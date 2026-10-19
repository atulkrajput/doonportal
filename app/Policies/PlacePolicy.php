<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Place;
use App\Models\User;

class PlacePolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Place $place): bool
    {
        return $place->isPublic() || (bool) $user?->hasPermission(PermissionName::ManagePlaces);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(PermissionName::ManagePlaces);
    }

    public function update(User $user, Place $place): bool
    {
        return $user->hasPermission(PermissionName::ManagePlaces);
    }

    public function delete(User $user, Place $place): bool
    {
        return $user->hasPermission(PermissionName::ManagePlaces);
    }

    public function forceDelete(User $user, Place $place): bool
    {
        return false;
    }
}
