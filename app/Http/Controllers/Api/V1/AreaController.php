<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\BusinessIndexRequest;
use App\Http\Requests\Discovery\EventIndexRequest;
use App\Http\Requests\Discovery\PlaceIndexRequest;
use App\Http\Requests\Discovery\SimpleListRequest;
use App\Http\Resources\AreaResource;
use App\Http\Resources\BusinessResource;
use App\Http\Resources\EventResource;
use App\Http\Resources\PlaceResource;
use App\Http\Resources\StoryResource;
use App\Models\Area;
use App\Services\Discovery\DiscoveryQuery;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AreaController extends Controller
{
    public function __construct(private readonly DiscoveryQuery $discovery) {}

    public function index(): AnonymousResourceCollection
    {
        return AreaResource::collection(
            $this->withCounts(Area::query()->public())->with('cover')->orderBy('sort_order')->orderBy('name')->get()
        );
    }

    public function show(Area $area): AreaResource
    {
        $this->ensureVisible($area);

        return new AreaResource($this->withCounts(Area::query())->with('cover')->findOrFail($area->id));
    }

    public function businesses(BusinessIndexRequest $request, Area $area): AnonymousResourceCollection
    {
        $this->ensureVisible($area);

        return BusinessResource::collection(
            $this->discovery->businesses([...$request->filters(), 'area' => $area->slug], $request->sort())
                ->paginate($request->perPage())->withQueryString()
        );
    }

    public function places(PlaceIndexRequest $request, Area $area): AnonymousResourceCollection
    {
        $this->ensureVisible($area);

        return PlaceResource::collection(
            $this->discovery->places([...$request->filters(), 'area' => $area->slug], $request->sort())
                ->paginate($request->perPage())->withQueryString()
        );
    }

    public function events(EventIndexRequest $request, Area $area): AnonymousResourceCollection
    {
        $this->ensureVisible($area);

        return EventResource::collection(
            $this->discovery->events([...$request->filters(), 'area' => $area->slug], $request->sort())
                ->paginate($request->perPage())->withQueryString()
        );
    }

    /**
     * Stories explicitly linked to this area by editors.
     */
    public function stories(SimpleListRequest $request, Area $area): AnonymousResourceCollection
    {
        $this->ensureVisible($area);

        return StoryResource::collection(
            $this->discovery->stories()
                ->whereHas('entityLinks', fn ($q) => $q->where('entity_type', 'area')->where('entity_id', $area->id))
                ->paginate($request->perPage())->withQueryString()
        );
    }

    private function withCounts(Builder $query): Builder
    {
        return $query->withCount([
            'businesses' => fn ($q) => $q->public(),
            'places' => fn ($q) => $q->public(),
            'events' => fn ($q) => $q->public()->upcomingOrLive(),
        ]);
    }
}
