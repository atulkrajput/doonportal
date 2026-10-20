<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\BusinessStatus;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\BusinessRequest;
use App\Http\Requests\Admin\BusinessStatusRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Business;
use App\Services\BusinessWriter;
use App\Services\StatusTransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class BusinessController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate(['status' => ['nullable', Rule::in(BusinessStatus::values())]]);

        $query = Business::query()->with('primaryArea:id,name,slug')
            ->when($request->filterValue('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->filterValue('area_id'), fn ($q, $id) => $q->where(fn ($q) => $q
                ->where('primary_area_id', $id)->orWhereHas('areas', fn ($q) => $q->whereKey($id))))
            ->when($request->filterValue('category_id'), fn ($q, $id) => $q->whereHas('categories', fn ($q) => $q->whereKey($id)))
            ->when($request->validated('is_published') !== null, fn ($q) => $q->where('is_published', $request->boolean('is_published')));

        return AdminRecordResource::collection(
            $this->paginate($query, $request, ['name', 'locality', 'address_line'], ['name' => 'name'])
        );
    }

    public function show(Business $business): AdminRecordResource
    {
        return new AdminRecordResource($this->loadDetail($business));
    }

    public function store(BusinessRequest $request): JsonResponse
    {
        $business = app(BusinessWriter::class)->save(new Business, $request->validated());

        return (new AdminRecordResource($this->loadDetail($business)))->response()->setStatusCode(201);
    }

    public function update(BusinessRequest $request, Business $business): AdminRecordResource
    {
        app(BusinessWriter::class)->save($business, $request->validated());

        return new AdminRecordResource($this->loadDetail($business));
    }

    public function destroy(Business $business): Response
    {
        $this->deleteAudited($business);

        return response()->noContent();
    }

    public function restore(Business $business): AdminRecordResource
    {
        $this->restoreAudited($business);

        return new AdminRecordResource($this->loadDetail($business));
    }

    public function status(BusinessStatusRequest $request, Business $business, StatusTransitionService $transitions): AdminRecordResource
    {
        $transitions->transitionBusiness($business, $request->enum('status', BusinessStatus::class), $request->user(), $request->validated('note'));

        return new AdminRecordResource($this->loadDetail($business));
    }

    private function loadDetail(Business $business): Business
    {
        return $business->load(['primaryArea:id,name,slug', 'categories:id,name,slug,type', 'areas:id,name,slug',
            'hours', 'services', 'socialLinks', 'logo', 'cover', 'owner:id,name']);
    }
}
