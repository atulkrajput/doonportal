<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Story;
use App\Models\User;

class StoryPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Story $story): bool
    {
        return $story->isPublic() || (bool) $user?->hasPermission(PermissionName::ManageStories);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(PermissionName::ManageStories);
    }

    public function update(User $user, Story $story): bool
    {
        return $user->hasPermission(PermissionName::ManageStories);
    }

    public function delete(User $user, Story $story): bool
    {
        return $user->hasPermission(PermissionName::ManageStories);
    }

    public function forceDelete(User $user, Story $story): bool
    {
        return false;
    }
}
