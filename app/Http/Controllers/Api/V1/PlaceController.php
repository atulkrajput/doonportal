<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\PlaceIndexRequest;
use App\Http\Requests\Discovery\SimpleListRequest;
use App\Http\Resources\MediaResource;
use App\Http\Resources\PlaceResource;
use App\Models\Place;
use App\Services\Discovery\DiscoveryQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlaceController extends Controller
{
    public function __construct(private readonly DiscoveryQuery $discovery) {}

    public function index(PlaceIndexRequest $request): AnonymousResourceCollection
    {
        $page = $this->discovery->places($request->filters(), $request->sort())
            ->paginate($request->perPage())->withQueryString();

        return PlaceResource::collection($page);
    }

    public function show(Place $place): PlaceResource
    {
        $this->ensureVisible($place);

        return new PlaceResource($place->load([...DiscoveryQuery::PLACE_CARD_RELATIONS, 'areas', 'facilities']));
    }

    public function photos(SimpleListRequest $request, Place $place): JsonResponse
    {
        $this->ensureVisible($place);
        $page = $place->approvedPhotos()->with('media')->paginate($request->perPage());

        return response()->json([
            'data' => $page->getCollection()->map(fn ($p) => [
                'id' => $p->id,
                'caption' => $p->caption,
                'media' => new MediaResource($p->media),
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    public function related(Place $place): AnonymousResourceCollection
    {
        $this->ensureVisible($place);
        $place->loadMissing('categories');
        $categoryIds = $place->categories->pluck('id');

        $related = $this->discovery->places()
            ->whereKeyNot($place->id)
            ->where(fn ($q) => $q
                ->when($categoryIds->isNotEmpty(), fn ($q) => $q->whereHas('categories', fn ($c) => $c->whereIn('categories.id', $categoryIds)))
                ->when($place->primary_area_id, fn ($q) => $q->orWhere('primary_area_id', $place->primary_area_id)))
            ->limit(6)->get();

        return PlaceResource::collection($related);
    }
}
