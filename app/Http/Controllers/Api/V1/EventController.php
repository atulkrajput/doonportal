<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\EventIndexRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Services\Discovery\DiscoveryQuery;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EventController extends Controller
{
    public function __construct(private readonly DiscoveryQuery $discovery) {}

    public function index(EventIndexRequest $request): AnonymousResourceCollection
    {
        $page = $this->discovery->events($request->filters(), $request->sort())
            ->paginate($request->perPage())->withQueryString();

        return EventResource::collection($page);
    }

    public function show(Event $event): EventResource
    {
        $this->ensureVisible($event);

        return new EventResource($event->load(DiscoveryQuery::EVENT_CARD_RELATIONS));
    }

    /**
     * Upcoming events sharing a category, venue or area.
     */
    public function related(Event $event): AnonymousResourceCollection
    {
        $this->ensureVisible($event);
        $event->loadMissing('categories');
        $categoryIds = $event->categories->pluck('id');

        $related = $this->discovery->events()
            ->whereKeyNot($event->id)
            ->where(fn ($q) => $q
                ->when($categoryIds->isNotEmpty(), fn ($q) => $q->whereHas('categories', fn ($c) => $c->whereIn('categories.id', $categoryIds)))
                ->when($event->venue_id, fn ($q) => $q->orWhere('venue_id', $event->venue_id))
                ->when($event->area_id, fn ($q) => $q->orWhere('area_id', $event->area_id)))
            ->limit(6)->get();

        return EventResource::collection($related);
    }
}
