<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PublicationStatus;
use App\Enums\StoryType;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\PublicationStatusRequest;
use App\Http\Requests\Admin\StoryRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Story;
use App\Services\StatusTransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class StoryController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate([
            'status' => ['nullable', Rule::in(PublicationStatus::values())],
            'type' => ['nullable', Rule::in(StoryType::values())],
        ]);

        // Bodies can be large; listings never need them.
        $query = Story::query()->select(collect((new Story)->getFillable())->reject(fn ($c) => $c === 'body')
            ->push('id', 'created_at', 'updated_at', 'deleted_at')->all())
            ->with('author:id,name')
            ->when($request->filterValue('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->filterValue('type'), fn ($q, $type) => $q->where('type', $type))
            ->when($request->filterValue('category_id'), fn ($q, $id) => $q->whereHas('categories', fn ($q) => $q->whereKey($id)));

        return AdminRecordResource::collection($this->paginate($query, $request, ['title', 'excerpt'], ['name' => 'title']));
    }

    public function show(Story $story): AdminRecordResource
    {
        return new AdminRecordResource($this->loadDetail($story));
    }

    public function store(StoryRequest $request): JsonResponse
    {
        $story = new Story;
        $story->author_id = $request->user()->id;
        $story = $this->saveAudited($story, $request->modelAttributes(), $this->relationSyncs($request));

        return (new AdminRecordResource($this->loadDetail($story)))->response()->setStatusCode(201);
    }

    public function update(StoryRequest $request, Story $story): AdminRecordResource
    {
        $this->saveAudited($story, $request->modelAttributes(), $this->relationSyncs($request));

        return new AdminRecordResource($this->loadDetail($story));
    }

    public function destroy(Story $story): Response
    {
        $this->deleteAudited($story);

        return response()->noContent();
    }

    public function restore(Story $story): AdminRecordResource
    {
        $this->restoreAudited($story);

        return new AdminRecordResource($this->loadDetail($story));
    }

    public function status(PublicationStatusRequest $request, Story $story, StatusTransitionService $transitions): AdminRecordResource
    {
        $transitions->transitionPublication($story, $request->enum('status', PublicationStatus::class), $request->user(), $request->validated('note'));

        return new AdminRecordResource($this->loadDetail($story));
    }

    private function loadDetail(Story $story): Story
    {
        return $story->load(['author:id,name', 'categories:id,name,slug,type', 'entityLinks', 'cover']);
    }

    /**
     * @return array<string, callable>
     */
    private function relationSyncs(StoryRequest $request): array
    {
        $data = $request->validated();
        $syncs = [];

        if (array_key_exists('category_ids', $data)) {
            $syncs['category_ids'] = fn (Story $s) => $this->syncIds($s->categories(), $data['category_ids']);
        }
        if (array_key_exists('linked_entities', $data)) {
            $rows = collect($data['linked_entities'])
                ->map(fn ($l) => ['entity_type' => $l['type'], 'entity_id' => $l['id']])
                ->unique(fn ($l) => $l['entity_type'].':'.$l['entity_id'])->values()->all();
            $syncs['linked_entities'] = fn (Story $s) => $this->replaceChildren($s->entityLinks(), $rows, ['entity_type', 'entity_id']);
        }

        return $syncs;
    }
}
