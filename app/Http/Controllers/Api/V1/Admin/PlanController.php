<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\PlanRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class PlanController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $query = Plan::query()->withCount(['subscriptions', 'subscriptions as active_subscriptions_count' => fn ($q) => $q->where('status', 'ACTIVE')])
            ->when($request->validated('is_published') !== null, fn ($q) => $q->where('is_active', $request->boolean('is_published')));

        return AdminRecordResource::collection($this->paginate($query, $request, ['name', 'description'], ['name' => 'name']));
    }

    public function show(Plan $plan): AdminRecordResource
    {
        return new AdminRecordResource($plan);
    }

    public function store(PlanRequest $request): JsonResponse
    {
        $plan = $this->saveAudited(new Plan, $request->modelAttributes());

        return (new AdminRecordResource($plan))->response()->setStatusCode(201);
    }

    public function update(PlanRequest $request, Plan $plan): AdminRecordResource
    {
        $this->saveAudited($plan, $request->modelAttributes());

        return new AdminRecordResource($plan);
    }

    public function destroy(Plan $plan): Response
    {
        if ($plan->subscriptions()->where('status', 'ACTIVE')->exists()) {
            throw ValidationException::withMessages(['plan' => 'This plan has active subscriptions. Deactivate it instead.']);
        }
        $this->deleteAudited($plan);

        return response()->noContent();
    }

    public function restore(Plan $plan): AdminRecordResource
    {
        $this->restoreAudited($plan);

        return new AdminRecordResource($plan);
    }
}
