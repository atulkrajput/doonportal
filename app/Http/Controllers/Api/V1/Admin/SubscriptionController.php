<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\SubscriptionStatus;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\SubscriptionRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Discovery\DiscoveryQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * Subscriptions are recorded by staff. They are never deleted — cancel instead —
 * so the revenue history stays intact. Every change is audited.
 */
class SubscriptionController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate([
            'status' => ['nullable', Rule::in(SubscriptionStatus::values())],
            'plan_id' => ['nullable', 'string', 'size:26'],
            'business_id' => ['nullable', 'string', 'size:26'],
        ]);

        $query = Subscription::query()->with(['business:id,name,slug', 'plan:id,name,interval'])
            ->when($request->filterValue('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('plan_id'), fn ($q, $id) => $q->where('plan_id', $id))
            ->when($request->input('business_id'), fn ($q, $id) => $q->where('business_id', $id))
            ->when($request->filterValue('q'), fn ($q, $term) => $q->whereHas('business', fn ($b) => app(DiscoveryQuery::class)->applyText($b, $term, ['name'])));

        return AdminRecordResource::collection($this->paginate($query, $request, [], ['starts_at' => '-starts_on']));
    }

    public function show(Subscription $subscription): AdminRecordResource
    {
        return new AdminRecordResource($subscription->load(['business:id,name,slug', 'plan', 'creator:id,name']));
    }

    public function store(SubscriptionRequest $request): JsonResponse
    {
        $attributes = $request->modelAttributes();
        $plan = Plan::findOrFail($attributes['plan_id']);

        // Sensible defaults from the plan: price and one billing period.
        $attributes['amount_paise'] ??= $plan->price_paise;
        if (! array_key_exists('ends_on', $attributes) && ($months = $plan->interval->months())) {
            $attributes['ends_on'] = Carbon::parse($attributes['starts_on'])->addMonthsNoOverflow($months)->subDay()->toDateString();
        }

        $subscription = new Subscription;
        $subscription->created_by = $request->user()->id;
        $subscription->currency = $plan->currency;
        $this->saveAudited($subscription, $attributes);

        return (new AdminRecordResource($subscription->load(['business:id,name,slug', 'plan'])))->response()->setStatusCode(201);
    }

    public function update(SubscriptionRequest $request, Subscription $subscription): AdminRecordResource
    {
        $this->saveAudited($subscription, $request->modelAttributes());

        return new AdminRecordResource($subscription->load(['business:id,name,slug', 'plan']));
    }
}
