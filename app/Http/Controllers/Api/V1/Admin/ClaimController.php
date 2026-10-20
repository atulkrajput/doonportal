<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ClaimStatus;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\ModerationDecisionRequest;
use App\Http\Resources\Account\ClaimResource;
use App\Models\BusinessClaim;
use App\Services\Community\ClaimService;
use App\Services\Discovery\DiscoveryQuery;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Ownership claims queue (claims.manage).
 */
class ClaimController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate(['status' => ['nullable', Rule::in(ClaimStatus::values())]]);
        $term = trim((string) $request->validated('q'));
        $search = app(DiscoveryQuery::class);

        $query = BusinessClaim::query()->with(['business:id,name,slug,owner_id', 'user:id,name,email,phone', 'reviewer:id,name'])
            ->when($request->filterValue('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($term !== '', fn ($q) => $q->where(fn ($q) => $q
                ->whereHas('business', fn ($b) => $search->applyText($b, $term, ['name']))
                ->orWhereHas('user', fn ($u) => $search->applyText($u, $term, ['name', 'email']))));

        // Text search is applied above (business name, claimant); none on the claims table itself.
        return ClaimResource::collection($this->paginate($query, $request, []));
    }

    public function show(BusinessClaim $claim): ClaimResource
    {
        return new ClaimResource($claim->load(['business:id,name,slug,owner_id', 'user:id,name,email,phone', 'reviewer:id,name']));
    }

    public function approve(ModerationDecisionRequest $request, BusinessClaim $claim, ClaimService $claims): ClaimResource
    {
        $claims->approve($claim, $request->user(), $request->validated('notes'));

        return $this->show($claim->refresh());
    }

    public function reject(ModerationDecisionRequest $request, BusinessClaim $claim, ClaimService $claims): ClaimResource
    {
        $claims->reject($claim, $request->user(), $request->validated('notes'));

        return $this->show($claim->refresh());
    }
}
