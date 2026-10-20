<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Admin;
use App\Models\Story;
use App\Models\User;

class StoryPolicy
{
    public function viewAny(User|Admin|null $user): bool
    {
        return true;
    }

    public function view(User|Admin|null $user, Story $story): bool
    {
        return $story->isPublic() || (bool) $user?->hasPermission(PermissionName::ManageStories);
    }

    public function create(User|Admin $user): bool
    {
        return $user->hasPermission(PermissionName::ManageStories);
    }

    public function update(User|Admin $user, Story $story): bool
    {
        return $user->hasPermission(PermissionName::ManageStories);
    }

    public function delete(User|Admin $user, Story $story): bool
    {
        return $user->hasPermission(PermissionName::ManageStories);
    }

    public function forceDelete(User|Admin $user, Story $story): bool
    {
        return false;
    }
}
