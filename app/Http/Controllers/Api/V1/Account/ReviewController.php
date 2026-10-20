<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\ReviewRequest;
use App\Http\Requests\Discovery\SimpleListRequest;
use App\Http\Resources\Account\MyReviewResource;
use App\Models\Business;
use App\Models\Review;
use App\Services\Community\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Members writing and managing their own reviews. New and edited reviews wait
 * for a moderator before they appear on the listing.
 */
class ReviewController extends Controller
{
    public function __construct(private readonly ReviewService $reviews) {}

    public function index(SimpleListRequest $request): AnonymousResourceCollection
    {
        return MyReviewResource::collection(
            $request->user()->reviews()->with('reviewable')->latest()->orderByDesc('id')->paginate($request->perPage())
        );
    }

    /**
     * The signed-in member's review of this business, if any (to show "edit your review").
     */
    public function mine(Request $request, Business $business): JsonResponse
    {
        abort_unless($business->isPublic(), 404);
        $review = $business->reviews()->where('user_id', $request->user()->id)->first();

        return response()->json(['data' => $review ? new MyReviewResource($review) : null]);
    }

    public function store(ReviewRequest $request, Business $business): JsonResponse
    {
        abort_unless($business->isPublic(), 404);

        $review = $this->reviews->submit($request->user(), $business, $request->validated());

        return (new MyReviewResource($review->load('reviewable')))->response()->setStatusCode(201);
    }

    public function update(ReviewRequest $request, Review $review): MyReviewResource
    {
        abort_unless($review->user_id === $request->user()->id, 403);

        return new MyReviewResource($this->reviews->update($review, $request->user(), $request->validated())->load('reviewable'));
    }

    public function destroy(Request $request, Review $review): Response
    {
        abort_unless($review->user_id === $request->user()->id, 403);

        $this->reviews->delete($review, $request->user());

        return response()->noContent();
    }
}
