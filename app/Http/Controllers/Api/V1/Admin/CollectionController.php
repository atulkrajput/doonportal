<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PublicationStatus;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\CollectionItemsRequest;
use App\Http\Requests\Admin\CollectionRequest;
use App\Http\Requests\Admin\PublicationStatusRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Collection;
use App\Models\CollectionItem;
use App\Services\StatusTransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CollectionController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate(['status' => ['nullable', Rule::in(PublicationStatus::values())]]);

        $query = Collection::query()->withCount('items')->with('curator:id,name')
            ->when($request->filterValue('status'), fn ($q, $status) => $q->where('status', $status));

        return AdminRecordResource::collection($this->paginate($query, $request, ['title', 'description'], ['name' => 'title']));
    }

    public function show(Collection $collection): AdminRecordResource
    {
        return new AdminRecordResource($this->loadDetail($collection));
    }

    public function store(CollectionRequest $request): JsonResponse
    {
        $collection = new Collection;
        $collection->curator_id = $request->user()->id;
        $collection = $this->saveAudited($collection, $request->modelAttributes());

        return (new AdminRecordResource($this->loadDetail($collection)))->response()->setStatusCode(201);
    }

    public function update(CollectionRequest $request, Collection $collection): AdminRecordResource
    {
        $this->saveAudited($collection, $request->modelAttributes());

        return new AdminRecordResource($this->loadDetail($collection));
    }

    public function destroy(Collection $collection): Response
    {
        $this->deleteAudited($collection);

        return response()->noContent();
    }

    public function restore(Collection $collection): AdminRecordResource
    {
        $this->restoreAudited($collection);

        return new AdminRecordResource($this->loadDetail($collection));
    }

    public function status(PublicationStatusRequest $request, Collection $collection, StatusTransitionService $transitions): AdminRecordResource
    {
        $transitions->transitionPublication($collection, $request->enum('status', PublicationStatus::class), $request->user(), $request->validated('note'));

        return new AdminRecordResource($this->loadDetail($collection));
    }

    /**
     * Replace the ordered item list in one audited transaction.
     */
    public function items(CollectionItemsRequest $request, Collection $collection): AdminRecordResource
    {
        $snapshot = fn () => $collection->items()->orderBy('position')->get()
            ->map(fn (CollectionItem $i) => ['type' => $i->item_type, 'id' => $i->item_id, 'note' => $i->note])->all();

        DB::transaction(function () use ($request, $collection, $snapshot) {
            $before = $snapshot();
            $collection->items()->delete();
            foreach (array_values($request->validated('items')) as $position => $item) {
                $collection->items()->create([
                    'item_type' => $item['type'],
                    'item_id' => $item['id'],
                    'note' => $item['note'] ?? null,
                    'position' => $position,
                ]);
            }
            $after = $snapshot();

            if ($before !== $after) {
                $this->audit->log('collection.items_updated', $collection, ['items' => $before], ['items' => $after]);
            }
        });

        return new AdminRecordResource($this->loadDetail($collection));
    }

    private function loadDetail(Collection $collection): Collection
    {
        return $collection->load(['curator:id,name', 'cover', 'items' => fn ($q) => $q->orderBy('position'), 'items.item']);
    }
}
