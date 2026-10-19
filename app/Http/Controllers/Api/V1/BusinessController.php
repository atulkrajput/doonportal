<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\BusinessIndexRequest;
use App\Http\Requests\Discovery\SimpleListRequest;
use App\Http\Resources\BusinessResource;
use App\Http\Resources\MediaResource;
use App\Http\Resources\ReviewResource;
use App\Models\Business;
use App\Models\Offer;
use App\Services\Discovery\DiscoveryQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BusinessController extends Controller
{
    public function __construct(private readonly DiscoveryQuery $discovery) {}

    public function index(BusinessIndexRequest $request): AnonymousResourceCollection
    {
        $page = $this->discovery->businesses($request->filters(), $request->sort())
            ->paginate($request->perPage())->withQueryString();

        return BusinessResource::collection($page);
    }

    public function show(Business $business): BusinessResource
    {
        $this->ensureVisible($business);

        return new BusinessResource($business->load([
            ...DiscoveryQuery::BUSINESS_CARD_RELATIONS, 'areas', 'socialLinks',
        ]));
    }

    public function photos(SimpleListRequest $request, Business $business): JsonResponse
    {
        $this->ensureVisible($business);
        $page = $business->approvedPhotos()->with('media')->paginate($request->perPage());

        return response()->json([
            'data' => $page->getCollection()->map(fn ($p) => [
                'id' => $p->id,
                'caption' => $p->caption,
                'media' => new MediaResource($p->media),
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    public function services(Business $business): JsonResponse
    {
        $this->ensureVisible($business);

        return response()->json(['data' => $business->services()->get()->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'description' => $s->description,
            'price_min_paise' => $s->price_min_paise,
            'price_max_paise' => $s->price_max_paise,
        ])]);
    }

    public function offers(Business $business): JsonResponse
    {
        $this->ensureVisible($business);

        return response()->json(['data' => $business->offers()->current()->orderBy('ends_at')->get()->map(fn (Offer $o) => [
            'id' => $o->id,
            'title' => $o->title,
            'description' => $o->description,
            'terms' => $o->terms,
            'discount_label' => $o->discount_label,
            'starts_at' => $o->starts_at?->toIso8601String(),
            'ends_at' => $o->ends_at?->toIso8601String(),
        ])]);
    }

    public function reviews(SimpleListRequest $request, Business $business): AnonymousResourceCollection
    {
        $this->ensureVisible($business);

        return ReviewResource::collection(
            $business->reviews()->published()->with('user:id,name')->latest()->orderBy('id')->paginate($request->perPage())
        );
    }

    /**
     * Listings sharing a category, preferring the same area.
     */
    public function related(Business $business): AnonymousResourceCollection
    {
        $this->ensureVisible($business);
        $business->loadMissing('categories');
        $categoryIds = $business->categories->pluck('id');

        $related = $this->discovery->businesses()
            ->whereKeyNot($business->id)
            ->when($categoryIds->isNotEmpty(), fn ($q) => $q->whereHas('categories', fn ($c) => $c->whereIn('categories.id', $categoryIds)))
            ->reorder()
            ->when($business->primary_area_id, fn ($q) => $q->orderByRaw('CASE WHEN primary_area_id = ? THEN 0 ELSE 1 END', [$business->primary_area_id]))
            ->orderByDesc('rating_avg')->orderBy('id')
            ->limit(6)->get();

        return BusinessResource::collection($related);
    }
}
