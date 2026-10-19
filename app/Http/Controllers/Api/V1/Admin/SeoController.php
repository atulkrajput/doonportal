<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\SeoMetaRequest;
use App\Models\Area;
use App\Models\Business;
use App\Models\Collection;
use App\Models\Event;
use App\Models\Place;
use App\Models\SeoMeta;
use App\Models\Story;
use App\Services\Seo\SeoResolver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

/**
 * Page/record SEO overrides, a preview of what search engines get for any URL,
 * and an audit of public records with weak metadata. Permission: seo.manage.
 */
class SeoController extends AdminController
{
    public function index(AdminIndexRequest $request): JsonResponse
    {
        $request->validate(['type' => ['nullable', 'in:path,'.implode(',', SeoMetaRequest::ENTITY_TYPES)]]);
        $type = $request->filterValue('type');

        $rows = SeoMeta::query()->with(['entity', 'image'])
            ->when($type === 'path', fn ($q) => $q->whereNotNull('path'))
            ->when($type && $type !== 'path', fn ($q) => $q->where('entity_type', $type))
            ->when($request->filterValue('q'), fn ($q, $term) => $q->where(fn ($q) => $q
                ->where('path', 'like', '%'.str_replace(['%', '_'], '', $term).'%')
                ->orWhere('title', 'like', '%'.str_replace(['%', '_'], '', $term).'%')))
            ->latest('updated_at')->paginate($request->perPage())->withQueryString();

        return response()->json([
            'data' => $rows->getCollection()->map(fn (SeoMeta $m) => $this->present($m)),
            'meta' => ['current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'total' => $rows->total()],
        ]);
    }

    public function store(SeoMetaRequest $request): JsonResponse
    {
        $meta = new SeoMeta;
        $meta->updated_by = $request->user()->id;
        $this->saveAudited($meta, $request->validated());
        $this->flush();

        return response()->json(['data' => $this->present($meta->load(['entity', 'image']))], 201);
    }

    public function update(SeoMetaRequest $request, SeoMeta $seoMeta): JsonResponse
    {
        $seoMeta->updated_by = $request->user()->id;
        $this->saveAudited($seoMeta, $request->validated());
        $this->flush();

        return response()->json(['data' => $this->present($seoMeta->load(['entity', 'image']))]);
    }

    public function destroy(SeoMeta $seoMeta): Response
    {
        $this->audit->log('seo_meta.deleted', $seoMeta, $seoMeta->only(['path', 'entity_type', 'entity_id', 'title', 'description', 'noindex']));
        $seoMeta->delete();
        $this->flush();

        return response()->noContent();
    }

    /** Overrides for one record, used by the SEO panel on admin edit screens. */
    public function forEntity(string $type, string $id): JsonResponse
    {
        abort_unless(in_array($type, SeoMetaRequest::ENTITY_TYPES, true), 404);
        $meta = SeoMeta::where('entity_type', $type)->where('entity_id', $id)->with('image')->first();

        return response()->json(['data' => $meta ? $this->present($meta) : null]);
    }

    /** What search engines receive for a path, after all overrides. */
    public function preview(Request $request, SeoResolver $resolver): JsonResponse
    {
        $data = $request->validate(['path' => ['required', 'string', 'max:500', 'regex:#^/#']]);
        $parts = parse_url($data['path']) ?: [];
        parse_str($parts['query'] ?? '', $query);

        return response()->json(['data' => $resolver->resolve(strtolower(rtrim($parts['path'] ?? '/', '/')) ?: '/', $query)->toArray()]);
    }

    /** Public records whose metadata will look weak in search results. */
    public function audit(): JsonResponse
    {
        $types = [
            'business' => [Business::class, 'name', fn (Builder $q) => $q->whereNull('tagline')->where(fn ($q) => $q->whereNull('description')->orWhere('description', ''))],
            'place' => [Place::class, 'name', fn (Builder $q) => $q->whereNull('summary')->where(fn ($q) => $q->whereNull('description')->orWhere('description', ''))],
            'event' => [Event::class, 'title', fn (Builder $q) => $q->whereNull('summary')->where(fn ($q) => $q->whereNull('description')->orWhere('description', ''))],
            'story' => [Story::class, 'title', fn (Builder $q) => $q->whereNull('excerpt')->whereNull('seo_description')],
            'collection' => [Collection::class, 'title', fn (Builder $q) => $q->whereNull('description')],
            'area' => [Area::class, 'name', fn (Builder $q) => $q->whereNull('summary')],
        ];

        $report = [];
        foreach ($types as $type => [$class, $titleColumn, $missingDescription]) {
            $public = fn () => $class::query()->public();
            $overridden = SeoMeta::where('entity_type', $type)->whereNotNull('description')->pluck('entity_id');

            $noDescription = $missingDescription($public())->whereNotIn('id', $overridden);
            $noImage = $public()->whereNull('cover_media_id');

            $report[$type] = [
                'public' => $public()->count(),
                'missing_description' => (clone $noDescription)->count(),
                'missing_image' => $noImage->count(),
                'long_titles' => $public()->whereRaw('LENGTH('.$titleColumn.') > 60')->count(),
                'examples' => (clone $noDescription)->limit(10)->get(['id', $titleColumn, 'slug'])
                    ->map(fn ($m) => ['id' => $m->id, 'title' => $m->{$titleColumn}])->all(),
            ];
        }

        return response()->json(['data' => $report]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(SeoMeta $meta): array
    {
        $entity = $meta->entity;

        return [
            'id' => $meta->id,
            'path' => $meta->path,
            'entity_type' => $meta->entity_type,
            'entity_id' => $meta->entity_id,
            'entity_label' => $entity ? ($entity->name ?? $entity->title ?? null) : null,
            'title' => $meta->title,
            'description' => $meta->description,
            'image_media_id' => $meta->image_media_id,
            'image' => $meta->image ? ['id' => $meta->image->id, 'url' => $meta->image->url()] : null,
            'noindex' => $meta->noindex,
            'updated_at' => $meta->updated_at?->toIso8601String(),
        ];
    }

    private function flush(): void
    {
        Cache::forget('seo.sitemap.'.md5(url('/')));
    }
}
