<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Admin;
use App\Models\Business;
use App\Models\User;

class BusinessPolicy
{
    public function viewAny(User|Admin|null $user): bool
    {
        return true;
    }

    public function view(User|Admin|null $user, Business $business): bool
    {
        return $business->isPublic()
            || ($user && ($user->hasPermission(PermissionName::ManageBusinesses) || $this->owns($user, $business)));
    }

    public function create(User|Admin $user): bool
    {
        return $user->hasPermission(PermissionName::ManageBusinesses);
    }

    /**
     * Owners may edit their own profile; ownership comes from an approved claim (businesses.owner_id),
     * never from client input.
     */
    public function update(User|Admin $user, Business $business): bool
    {
        return $user->hasPermission(PermissionName::ManageBusinesses) || $this->owns($user, $business);
    }

    public function changeStatus(User|Admin $user, Business $business): bool
    {
        return $user->hasPermission(PermissionName::ManageBusinesses);
    }

    public function delete(User|Admin $user, Business $business): bool
    {
        return $user->hasPermission(PermissionName::ManageBusinesses);
    }

    public function restore(User|Admin $user, Business $business): bool
    {
        return $user->hasPermission(PermissionName::ManageBusinesses);
    }

    public function forceDelete(User|Admin $user, Business $business): bool
    {
        return false;
    }

    private function owns(User|Admin $user, Business $business): bool
    {
        // Owners are members; a staff account never owns a listing.
        return $user instanceof User && $business->owner_id !== null && $business->owner_id === $user->id;
    }
}
