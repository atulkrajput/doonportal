<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Category $category): bool
    {
        return $category->is_active || (bool) $user?->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function update(User $user, Category $category): bool
    {
        return $user->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function delete(User $user, Category $category): bool
    {
        return $user->hasPermission(PermissionName::ManageTaxonomy);
    }

    public function forceDelete(User $user, Category $category): bool
    {
        return false;
    }
}
