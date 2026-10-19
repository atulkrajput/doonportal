<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PublicationStatus;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\PageRequest;
use App\Http\Requests\Admin\PublicationStatusRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Page;
use App\Services\SiteSettings;
use App\Services\StatusTransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

/**
 * Site pages (legal, about, contact). Permission: pages.manage.
 */
class PageController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate(['status' => ['nullable', Rule::in(PublicationStatus::values())]]);

        $query = Page::query()->select(['id', 'slug', 'title', 'summary', 'status', 'show_in_footer', 'sort_order', 'published_at', 'created_at', 'updated_at', 'deleted_at'])
            ->when($request->filterValue('status'), fn ($q, $s) => $q->where('status', $s));

        return AdminRecordResource::collection($this->paginate($query, $request, ['title', 'slug'], ['name' => 'title']));
    }

    public function show(Page $page, SiteSettings $settings): AdminRecordResource
    {
        $legal = $settings->get('legal');

        return (new AdminRecordResource($page))->additional(['meta' => [
            'missing_legal_details' => array_values(array_filter(SiteSettings::REQUIRED_LEGAL, fn ($k) => blank($legal[$k]))),
        ]]);
    }

    public function store(PageRequest $request): JsonResponse
    {
        $page = new Page;
        $page->updated_by = $request->user()->id;
        $this->saveAudited($page, $request->modelAttributes());
        $this->flush();

        return (new AdminRecordResource($page))->response()->setStatusCode(201);
    }

    public function update(PageRequest $request, Page $page): AdminRecordResource
    {
        $page->updated_by = $request->user()->id;
        $this->saveAudited($page, $request->modelAttributes());
        $this->flush();

        return new AdminRecordResource($page);
    }

    public function destroy(Page $page): Response
    {
        $this->deleteAudited($page);
        $this->flush();

        return response()->noContent();
    }

    public function restore(Page $page): AdminRecordResource
    {
        $this->restoreAudited($page);
        $this->flush();

        return new AdminRecordResource($page);
    }

    public function status(PublicationStatusRequest $request, Page $page, StatusTransitionService $transitions): AdminRecordResource
    {
        $transitions->transitionPublication($page, $request->enum('status', PublicationStatus::class), $request->user(), $request->validated('note'));
        $this->flush();

        return new AdminRecordResource($page);
    }

    private function flush(): void
    {
        Cache::forget('seo.sitemap.'.md5(url('/')));
    }
}
