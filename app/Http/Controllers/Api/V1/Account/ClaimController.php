<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\BusinessClaimRequest;
use App\Http\Requests\Discovery\SimpleListRequest;
use App\Http\Resources\Account\ClaimResource;
use App\Models\Business;
use App\Models\BusinessClaim;
use App\Services\Community\ClaimService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClaimController extends Controller
{
    public function __construct(private readonly ClaimService $claims) {}

    public function index(SimpleListRequest $request): AnonymousResourceCollection
    {
        return ClaimResource::collection(
            $request->user()->businessClaims()->with('business:id,name,slug')->latest()->orderByDesc('id')->paginate($request->perPage())
        );
    }

    public function store(BusinessClaimRequest $request, Business $business): JsonResponse
    {
        abort_unless($business->isPublic(), 404);

        $claim = $this->claims->submit($request->user(), $business, $request->details());

        return (new ClaimResource($claim->load('business:id,name,slug')))->response()->setStatusCode(201);
    }

    public function cancel(Request $request, BusinessClaim $claim): ClaimResource
    {
        abort_unless($claim->user_id === $request->user()->id, 404);

        return new ClaimResource($this->claims->cancel($claim, $request->user())->load('business:id,name,slug'));
    }
}
