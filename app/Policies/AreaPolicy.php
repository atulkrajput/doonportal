<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Admin;
use App\Models\Area;
use App\Models\User;

class AreaPolicy
{
    public function viewAny(User|Admin|null $user): bool
    {
        return true;
    }

    public function view(User|Admin|null $user, Area $area): bool
    {
        return $area->is_published || (bool) $user?->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function create(User|Admin $user): bool
    {
        return $user->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function update(User|Admin $user, Area $area): bool
    {
        return $user->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function delete(User|Admin $user, Area $area): bool
    {
        return $user->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function forceDelete(User|Admin $user, Area $area): bool
    {
        return false;
    }
}
