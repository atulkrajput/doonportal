<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\VenueRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class VenueController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $query = Venue::query()->with('area:id,name,slug')->withCount('events')
            ->when($request->filterValue('area_id'), fn ($q, $id) => $q->where('area_id', $id));

        return AdminRecordResource::collection($this->paginate($query, $request, ['name', 'address_line'], ['name' => 'name']));
    }

    public function show(Venue $venue): AdminRecordResource
    {
        return new AdminRecordResource($this->loadDetail($venue));
    }

    public function store(VenueRequest $request): JsonResponse
    {
        $venue = $this->saveAudited(new Venue, $request->modelAttributes());

        return (new AdminRecordResource($this->loadDetail($venue)))->response()->setStatusCode(201);
    }

    public function update(VenueRequest $request, Venue $venue): AdminRecordResource
    {
        $this->saveAudited($venue, $request->modelAttributes());

        return new AdminRecordResource($this->loadDetail($venue));
    }

    public function destroy(Venue $venue): Response
    {
        $this->deleteAudited($venue);

        return response()->noContent();
    }

    public function restore(Venue $venue): AdminRecordResource
    {
        $this->restoreAudited($venue);

        return new AdminRecordResource($this->loadDetail($venue));
    }

    private function loadDetail(Venue $venue): Venue
    {
        return $venue->load(['area:id,name,slug', 'business:id,name,slug', 'place:id,name,slug']);
    }
}
