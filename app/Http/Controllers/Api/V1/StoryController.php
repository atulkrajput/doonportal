<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\StoryIndexRequest;
use App\Http\Resources\StoryResource;
use App\Models\Story;
use App\Services\Discovery\DiscoveryQuery;
use App\Services\Discovery\EntityCards;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StoryController extends Controller
{
    public function __construct(private readonly DiscoveryQuery $discovery) {}

    public function index(StoryIndexRequest $request): AnonymousResourceCollection
    {
        return StoryResource::collection(
            $this->discovery->stories($request->filters(), $request->sort())
                ->paginate($request->perPage())->withQueryString()
        );
    }

    public function show(Story $story): StoryResource
    {
        $this->ensureVisible($story);
        $story->load([...DiscoveryQuery::STORY_CARD_RELATIONS, 'entityLinks']);
        EntityCards::loadTargets($story->entityLinks, 'entity');

        $resource = new StoryResource($story);
        $resource->withBody = true;
        $resource->linkedEntities = $story->entityLinks
            ->map(fn ($link) => EntityCards::card($link->entity))
            ->filter()->values()->all();

        return $resource;
    }
}
