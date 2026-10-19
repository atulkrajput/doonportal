<?php

namespace Database\Seeders;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

/**
 * Idempotent: safe to run in every environment.
 */
class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = collect(PermissionName::cases())->mapWithKeys(fn (PermissionName $p) => [
            $p->value => Permission::firstOrCreate(['name' => $p->value], ['label' => $p->value])->id,
        ]);

        foreach (RoleName::cases() as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName->value], ['label' => $roleName->label()]);
            $role->permissions()->sync(
                collect($roleName->permissions())->map(fn (PermissionName $p) => $permissions[$p->value])->all()
            );
        }
    }
}
