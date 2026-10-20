<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Admin;
use App\Models\Place;
use App\Models\User;

class PlacePolicy
{
    public function viewAny(User|Admin|null $user): bool
    {
        return true;
    }

    public function view(User|Admin|null $user, Place $place): bool
    {
        return $place->isPublic() || (bool) $user?->hasPermission(PermissionName::ManagePlaces);
    }

    public function create(User|Admin $user): bool
    {
        return $user->hasPermission(PermissionName::ManagePlaces);
    }

    public function update(User|Admin $user, Place $place): bool
    {
        return $user->hasPermission(PermissionName::ManagePlaces);
    }

    public function delete(User|Admin $user, Place $place): bool
    {
        return $user->hasPermission(PermissionName::ManagePlaces);
    }

    public function forceDelete(User|Admin $user, Place $place): bool
    {
        return false;
    }
}
