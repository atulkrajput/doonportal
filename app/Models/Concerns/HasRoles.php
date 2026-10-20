<?php

namespace App\Models\Concerns;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Models\Role;

/**
 * Roles and permissions for an account model that defines roles(): members
 * (role_user) and staff (admin_role). Only staff roles carry permissions.
 */
trait HasRoles
{
    public function assignRole(RoleName ...$roles): static
    {
        $ids = Role::whereIn('name', array_map(fn (RoleName $r) => $r->value, $roles))->pluck('id');
        $this->roles()->syncWithoutDetaching(
            $ids->mapWithKeys(fn ($id) => [$id => ['created_at' => now()]])->all()
        );
        $this->unsetRelation('roles');

        return $this;
    }

    public function hasRole(RoleName ...$roles): bool
    {
        $names = array_map(fn (RoleName $r) => $r->value, $roles);

        return $this->roles->contains(fn (Role $role) => in_array($role->name, $names, true));
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(RoleName::SuperAdmin);
    }

    public function hasPermission(PermissionName|string $permission): bool
    {
        $name = $permission instanceof PermissionName ? $permission->value : $permission;

        return in_array($name, $this->permissionNames(), true);
    }

    /**
     * @return list<string>
     */
    public function permissionNames(): array
    {
        $this->loadMissing('roles.permissions');

        return $this->roles->flatMap->permissions->pluck('name')->unique()->values()->all();
    }
}
