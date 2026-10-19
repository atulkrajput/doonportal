<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\SimpleListRequest;
use App\Http\Resources\CollectionResource;
use App\Models\Collection;
use App\Services\Discovery\EntityCards;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CollectionController extends Controller
{
    public function index(SimpleListRequest $request): AnonymousResourceCollection
    {
        return CollectionResource::collection(
            Collection::query()->public()->with('cover')->withCount('items')
                ->orderByDesc('is_featured')->orderByDesc('published_at')->orderBy('id')
                ->paginate($request->perPage())->withQueryString()
        );
    }

    /**
     * Items whose entity is missing or no longer public are skipped, never shown.
     */
    public function show(Collection $collection): CollectionResource
    {
        $this->ensureVisible($collection);
        $collection->load(['cover', 'items'])->loadCount('items');
        EntityCards::loadTargets($collection->items, 'item');

        $resource = new CollectionResource($collection);
        $resource->entries = $collection->items
            ->map(fn ($item) => ($card = EntityCards::card($item->item))
                ? ['position' => $item->position, 'note' => $item->note, 'entity' => $card]
                : null)
            ->filter()->values()->all();

        return $resource;
    }
}
