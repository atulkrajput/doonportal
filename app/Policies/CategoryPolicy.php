<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Admin;
use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    public function viewAny(User|Admin|null $user): bool
    {
        return true;
    }

    public function view(User|Admin|null $user, Category $category): bool
    {
        return $category->is_active || (bool) $user?->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function create(User|Admin $user): bool
    {
        return $user->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function update(User|Admin $user, Category $category): bool
    {
        return $user->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function delete(User|Admin $user, Category $category): bool
    {
        return $user->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function forceDelete(User|Admin $user, Category $category): bool
    {
        return false;
    }
}
