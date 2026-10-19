<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Enums\ReviewStatus;
use App\Models\Review;
use App\Models\User;

class ReviewPolicy
{
    public function view(?User $user, Review $review): bool
    {
        return $review->status === ReviewStatus::Published
            || ($user && ($review->user_id === $user->id || $user->hasPermission(PermissionName::ModerateReviews)));
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Review $review): bool
    {
        return $review->user_id === $user->id;
    }

    public function delete(User $user, Review $review): bool
    {
        return $review->user_id === $user->id || $user->hasPermission(PermissionName::ModerateReviews);
    }

    public function moderate(User $user, Review $review): bool
    {
        return $user->hasPermission(PermissionName::ModerateReviews) && $review->user_id !== $user->id;
    }
}
