<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\AreaRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Area;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AreaController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $query = Area::query()->withCount(['businesses', 'places', 'events'])
            ->when($request->validated('is_published') !== null, fn ($q) => $q->where('is_published', $request->boolean('is_published')));

        return AdminRecordResource::collection(
            $this->paginate($query, $request, ['name', 'summary'], ['name' => 'name'])
        );
    }

    public function show(Area $area): AdminRecordResource
    {
        return new AdminRecordResource($area->load('cover'));
    }

    public function store(AreaRequest $request): JsonResponse
    {
        $area = $this->saveAudited(new Area, $request->modelAttributes());

        return (new AdminRecordResource($area->load('cover')))->response()->setStatusCode(201);
    }

    public function update(AreaRequest $request, Area $area): AdminRecordResource
    {
        $this->saveAudited($area, $request->modelAttributes());

        return new AdminRecordResource($area->load('cover'));
    }

    public function destroy(Area $area): Response
    {
        $this->deleteAudited($area);

        return response()->noContent();
    }

    public function restore(Area $area): AdminRecordResource
    {
        $this->restoreAudited($area);

        return new AdminRecordResource($area->load('cover'));
    }
}
