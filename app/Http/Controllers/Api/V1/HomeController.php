<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CategoryType;
use App\Http\Controllers\Controller;
use App\Http\Resources\AreaResource;
use App\Http\Resources\BusinessResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\CollectionResource;
use App\Http\Resources\EventResource;
use App\Http\Resources\PlaceResource;
use App\Http\Resources\StoryResource;
use App\Models\Area;
use App\Models\Category;
use App\Models\Collection;
use App\Services\Discovery\DiscoveryQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Homepage feed. Every section is live data; empty arrays mean "nothing yet",
 * and the frontend shows an empty state rather than placeholder content.
 */
class HomeController extends Controller
{
    public const CACHE_SECONDS = 300;

    public function __invoke(Request $request, DiscoveryQuery $discovery): JsonResponse
    {
        $payload = Cache::remember('api.v1.home', self::CACHE_SECONDS, fn () => $this->build($request, $discovery));

        return response()->json(['data' => $payload]);
    }

    /**
     * @return array<string, mixed>
     */
    private function build(Request $request, DiscoveryQuery $discovery): array
    {
        $resolve = fn ($resource) => $resource->resolve($request);

        $newBusinesses = $discovery->businesses(['new' => true], 'newest')->limit(8)->get();

        return [
            'happening' => $resolve(EventResource::collection($discovery->events([], 'soonest')->limit(8)->get())),
            'popular' => $resolve(BusinessResource::collection($discovery->businesses([], 'popular')->limit(8)->get())),
            'new_in_doon' => $resolve(BusinessResource::collection($newBusinesses)),
            'eat' => $resolve(BusinessResource::collection($discovery->businesses(['category' => 'food-drink'], 'popular')->limit(8)->get())),
            'places' => $resolve(PlaceResource::collection($discovery->places([], 'popular')->limit(8)->get())),
            'stories' => $resolve(StoryResource::collection($discovery->stories([], 'newest')->limit(6)->get())),
            'collections' => $resolve(CollectionResource::collection(
                Collection::query()->public()->with('cover')->withCount('items')
                    ->orderByDesc('is_featured')->orderByDesc('published_at')->limit(6)->get()
            )),
            'areas' => $resolve(AreaResource::collection(
                Area::query()->public()->with('cover')
                    ->withCount(['businesses' => fn ($q) => $q->public(), 'places' => fn ($q) => $q->public()])
                    ->orderBy('sort_order')->limit(13)->get()
            )),
            'explore_categories' => $resolve(CategoryResource::collection(
                Category::query()->active()->ofType(CategoryType::Business)->whereNull('parent_id')
                    ->orderBy('sort_order')->get()
            )),
            'map_preview' => $this->mapPreview($discovery),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Lightweight markers for the homepage map teaser (only geocoded records).
     *
     * @return list<array<string, mixed>>
     */
    private function mapPreview(DiscoveryQuery $discovery): array
    {
        $businesses = $discovery->businesses()->whereNotNull('latitude')->limit(40)->get()
            ->map(fn ($b) => ['type' => 'business', 'title' => $b->name, 'path' => "/business/{$b->slug}", 'lat' => $b->latitude, 'lng' => $b->longitude]);
        $places = $discovery->places()->whereNotNull('latitude')->limit(20)->get()
            ->map(fn ($p) => ['type' => 'place', 'title' => $p->name, 'path' => "/place/{$p->slug}", 'lat' => $p->latitude, 'lng' => $p->longitude]);

        return $businesses->concat($places)->values()->all();
    }
}
