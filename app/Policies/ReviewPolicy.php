<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Enums\ReviewStatus;
use App\Models\Admin;
use App\Models\Review;
use App\Models\User;

class ReviewPolicy
{
    public function view(User|Admin|null $user, Review $review): bool
    {
        return $review->status === ReviewStatus::Published
            || ($user && ($this->authored($user, $review) || $user->hasPermission(PermissionName::ModerateReviews)));
    }

    public function create(User|Admin $user): bool
    {
        return true;
    }

    public function update(User|Admin $user, Review $review): bool
    {
        return $this->authored($user, $review);
    }

    public function delete(User|Admin $user, Review $review): bool
    {
        return $this->authored($user, $review) || $user->hasPermission(PermissionName::ModerateReviews);
    }

    public function moderate(User|Admin $user, Review $review): bool
    {
        return $user->hasPermission(PermissionName::ModerateReviews);
    }

    private function authored(User|Admin $user, Review $review): bool
    {
        return $user instanceof User && $review->user_id === $user->id;
    }
}
