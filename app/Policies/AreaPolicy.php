<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Area;
use App\Models\User;

class AreaPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Area $area): bool
    {
        return $area->is_published || (bool) $user?->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function update(User $user, Area $area): bool
    {
        return $user->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function delete(User $user, Area $area): bool
    {
        return $user->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function forceDelete(User $user, Area $area): bool
    {
        return false;
    }
}
