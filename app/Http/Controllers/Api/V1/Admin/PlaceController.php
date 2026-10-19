<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PublicationStatus;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\PlaceRequest;
use App\Http\Requests\Admin\PublicationStatusRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Place;
use App\Services\StatusTransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class PlaceController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate(['status' => ['nullable', Rule::in(PublicationStatus::values())]]);

        $query = Place::query()->with('primaryArea:id,name,slug')
            ->when($request->filterValue('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->filterValue('area_id'), fn ($q, $id) => $q->where(fn ($q) => $q
                ->where('primary_area_id', $id)->orWhereHas('areas', fn ($q) => $q->whereKey($id))))
            ->when($request->filterValue('category_id'), fn ($q, $id) => $q->whereHas('categories', fn ($q) => $q->whereKey($id)));

        return AdminRecordResource::collection(
            $this->paginate($query, $request, ['name', 'address_line'], ['name' => 'name'])
        );
    }

    public function show(Place $place): AdminRecordResource
    {
        return new AdminRecordResource($this->loadDetail($place));
    }

    public function store(PlaceRequest $request): JsonResponse
    {
        $place = $this->saveAudited(new Place, $request->modelAttributes(), $this->relationSyncs($request));

        return (new AdminRecordResource($this->loadDetail($place)))->response()->setStatusCode(201);
    }

    public function update(PlaceRequest $request, Place $place): AdminRecordResource
    {
        $this->saveAudited($place, $request->modelAttributes(), $this->relationSyncs($request));

        return new AdminRecordResource($this->loadDetail($place));
    }

    public function destroy(Place $place): Response
    {
        $this->deleteAudited($place);

        return response()->noContent();
    }

    public function restore(Place $place): AdminRecordResource
    {
        $this->restoreAudited($place);

        return new AdminRecordResource($this->loadDetail($place));
    }

    public function status(PublicationStatusRequest $request, Place $place, StatusTransitionService $transitions): AdminRecordResource
    {
        $transitions->transitionPublication($place, $request->enum('status', PublicationStatus::class), $request->user(), $request->validated('note'));

        return new AdminRecordResource($this->loadDetail($place));
    }

    private function loadDetail(Place $place): Place
    {
        return $place->load(['primaryArea:id,name,slug', 'categories:id,name,slug,type', 'areas:id,name,slug', 'facilities', 'cover']);
    }

    /**
     * @return array<string, callable>
     */
    private function relationSyncs(PlaceRequest $request): array
    {
        $data = $request->validated();
        $syncs = [];

        if (array_key_exists('category_ids', $data)) {
            $syncs['category_ids'] = fn (Place $p) => $this->syncIds($p->categories(), $data['category_ids']);
        }
        if (array_key_exists('area_ids', $data)) {
            $syncs['area_ids'] = fn (Place $p) => $this->syncIds($p->areas(), $data['area_ids']);
        }
        if (array_key_exists('facilities', $data)) {
            $syncs['facilities'] = fn (Place $p) => $this->replaceChildren($p->facilities(), $data['facilities'], ['name', 'notes']);
        }

        return $syncs;
    }
}
