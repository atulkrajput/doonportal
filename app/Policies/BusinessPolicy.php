<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Business;
use App\Models\User;

class BusinessPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Business $business): bool
    {
        return $business->isPublic()
            || ($user && ($user->hasPermission(PermissionName::ManageBusinesses) || $this->owns($user, $business)));
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(PermissionName::ManageBusinesses);
    }

    /**
     * Owners may edit their own profile; ownership comes from an approved claim (businesses.owner_id),
     * never from client input.
     */
    public function update(User $user, Business $business): bool
    {
        return $user->hasPermission(PermissionName::ManageBusinesses) || $this->owns($user, $business);
    }

    public function changeStatus(User $user, Business $business): bool
    {
        return $user->hasPermission(PermissionName::ManageBusinesses);
    }

    public function delete(User $user, Business $business): bool
    {
        return $user->hasPermission(PermissionName::ManageBusinesses);
    }

    public function restore(User $user, Business $business): bool
    {
        return $user->hasPermission(PermissionName::ManageBusinesses);
    }

    public function forceDelete(User $user, Business $business): bool
    {
        return false;
    }

    private function owns(User $user, Business $business): bool
    {
        return $business->owner_id !== null && $business->owner_id === $user->id;
    }
}
