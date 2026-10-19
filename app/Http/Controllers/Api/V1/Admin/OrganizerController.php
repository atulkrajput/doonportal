<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\OrganizerRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Organizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class OrganizerController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $query = Organizer::query()->withCount('events');

        return AdminRecordResource::collection($this->paginate($query, $request, ['name', 'email'], ['name' => 'name']));
    }

    public function show(Organizer $organizer): AdminRecordResource
    {
        return new AdminRecordResource($this->loadDetail($organizer));
    }

    public function store(OrganizerRequest $request): JsonResponse
    {
        $organizer = $this->saveAudited(new Organizer, $request->modelAttributes(), $this->relationSyncs($request));

        return (new AdminRecordResource($this->loadDetail($organizer)))->response()->setStatusCode(201);
    }

    public function update(OrganizerRequest $request, Organizer $organizer): AdminRecordResource
    {
        $this->saveAudited($organizer, $request->modelAttributes(), $this->relationSyncs($request));

        return new AdminRecordResource($this->loadDetail($organizer));
    }

    public function destroy(Organizer $organizer): Response
    {
        $this->deleteAudited($organizer);

        return response()->noContent();
    }

    public function restore(Organizer $organizer): AdminRecordResource
    {
        $this->restoreAudited($organizer);

        return new AdminRecordResource($this->loadDetail($organizer));
    }

    private function loadDetail(Organizer $organizer): Organizer
    {
        return $organizer->load(['businesses:id,name,slug', 'user:id,name']);
    }

    /**
     * @return array<string, callable>
     */
    private function relationSyncs(OrganizerRequest $request): array
    {
        $data = $request->validated();

        return array_key_exists('business_ids', $data)
            ? ['business_ids' => fn (Organizer $o) => $this->syncIds($o->businesses(), $data['business_ids'])]
            : [];
    }
}
