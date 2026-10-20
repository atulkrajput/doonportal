<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ReviewStatus;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Resources\Account\MyReviewResource;
use App\Models\Review;
use App\Services\Community\ReviewService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Review moderation (reviews.moderate).
 */
class ReviewController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate(['status' => ['nullable', Rule::in(ReviewStatus::values())]]);

        $query = Review::query()->with(['user:id,name', 'reviewable'])
            ->when($request->filterValue('status'), fn ($q, $status) => $q->where('status', $status));

        return MyReviewResource::collection($this->paginate($query, $request, ['title', 'body']));
    }

    public function status(Request $request, Review $review, ReviewService $reviews): MyReviewResource
    {
        $data = $request->validate([
            'status' => ['required', Rule::in([ReviewStatus::Published->value, ReviewStatus::Rejected->value, ReviewStatus::Hidden->value])],
            'note' => ['nullable', 'string', 'max:500'],
        ]);
        abort_if($review->user_id === $request->user()->id, 403, 'You can’t moderate your own review.');

        $reviews->moderate($review, ReviewStatus::from($data['status']), $request->user(), $data['note'] ?? null);

        return new MyReviewResource($review->load(['user:id,name', 'reviewable']));
    }

    public function removeReply(Request $request, Review $review, ReviewService $reviews): MyReviewResource
    {
        $reviews->reply($review, $request->user(), null);

        return new MyReviewResource($review->load(['user:id,name', 'reviewable']));
    }
}
