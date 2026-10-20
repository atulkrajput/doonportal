<?php

namespace App\Services\Community;

use App\Enums\ReviewStatus;
use App\Models\Admin;
use App\Models\Business;
use App\Models\Place;
use App\Models\Review;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Member reviews: written by members, published by moderators, answered by
 * the listing's owner. Rating aggregates count published reviews only.
 */
class ReviewService
{
    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * @param  array<string, mixed>  $data  rating, title, body, visited_on
     */
    public function submit(User $user, Business $business, array $data): Review
    {
        if ($business->owner_id === $user->id) {
            throw ValidationException::withMessages(['rating' => ['You can’t review a business you manage.']]);
        }
        if ($business->reviews()->withTrashed()->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages(['rating' => ['You have already reviewed this business. You can edit your review from your account.']]);
        }

        return DB::transaction(function () use ($user, $business, $data) {
            $review = new Review($data);
            $review->user()->associate($user);
            $review->reviewable()->associate($business);
            $review->save();

            $this->audit->log('review.submitted', $review, null, ['rating' => $review->rating], $user);

            return $review;
        });
    }

    /**
     * Edits go back to the moderation queue.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Review $review, User $user, array $data): Review
    {
        return DB::transaction(function () use ($review, $user, $data) {
            $wasPublished = $review->status === ReviewStatus::Published;
            $review->fill($data);
            $review->status = ReviewStatus::Pending;
            $review->save();

            if ($wasPublished) {
                $this->recalculate($review->reviewable);
            }
            $this->audit->log('review.updated', $review, null, ['rating' => $review->rating], $user);

            return $review;
        });
    }

    public function delete(Review $review, User $user): void
    {
        DB::transaction(function () use ($review, $user) {
            $review->delete();
            $this->recalculate($review->reviewable);
            $this->audit->log('review.deleted', $review, null, null, $user);
        });
    }

    public function moderate(Review $review, ReviewStatus $status, Admin $moderator, ?string $note = null): Review
    {
        if ($status === ReviewStatus::Pending) {
            throw ValidationException::withMessages(['status' => ['Choose publish, reject or hide.']]);
        }

        return DB::transaction(function () use ($review, $status, $moderator, $note) {
            $from = $review->status;
            $review->forceFill(['status' => $status, 'moderated_by' => $moderator->id, 'moderated_at' => now()])->save();
            $this->recalculate($review->reviewable);

            $this->audit->log('review.moderated', $review, ['status' => $from], ['status' => $status, 'note' => $note], $moderator);

            return $review;
        });
    }

    /**
     * The owner's public reply. Null removes it. Staff can also remove a reply.
     */
    public function reply(Review $review, User|Admin $actor, ?string $body): Review
    {
        return DB::transaction(function () use ($review, $actor, $body) {
            $old = $review->owner_reply;
            $review->forceFill(['owner_reply' => $body, 'owner_replied_at' => $body === null ? null : now()])->save();

            $this->audit->log($body === null ? 'review.reply_removed' : 'review.replied', $review, ['owner_reply' => $old], ['owner_reply' => $body], $actor);

            return $review;
        });
    }

    /**
     * Refresh rating_avg / rating_count on listings that keep aggregates.
     */
    public function recalculate(?Model $reviewable): void
    {
        if (! $reviewable instanceof Business && ! $reviewable instanceof Place) {
            return;
        }

        $stats = Review::query()
            ->where('reviewable_type', $reviewable->getMorphClass())
            ->where('reviewable_id', $reviewable->getKey())
            ->published()
            ->selectRaw('COUNT(*) as total, AVG(rating) as average')
            ->first();

        $reviewable->forceFill([
            'rating_count' => (int) $stats->total,
            'rating_avg' => round((float) $stats->average, 2),
        ])->saveQuietly();
    }
}
