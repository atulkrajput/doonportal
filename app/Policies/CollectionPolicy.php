<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Admin;
use App\Models\Collection;
use App\Models\User;

class CollectionPolicy
{
    public function viewAny(User|Admin|null $user): bool
    {
        return true;
    }

    public function view(User|Admin|null $user, Collection $collection): bool
    {
        return $collection->isPublic() || (bool) $user?->hasPermission(PermissionName::ManageCollections);
    }

    public function create(User|Admin $user): bool
    {
        return $user->hasPermission(PermissionName::ManageCollections);
    }

    public function update(User|Admin $user, Collection $collection): bool
    {
        return $user->hasPermission(PermissionName::ManageCollections);
    }

    public function delete(User|Admin $user, Collection $collection): bool
    {
        return $user->hasPermission(PermissionName::ManageCollections);
    }

    public function forceDelete(User|Admin $user, Collection $collection): bool
    {
        return false;
    }
}
