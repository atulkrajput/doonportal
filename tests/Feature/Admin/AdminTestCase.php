<?php

namespace Tests\Feature\Admin;

use App\Enums\RoleName;
use App\Models\Admin;
use App\Models\AuditLog;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

abstract class AdminTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    /**
     * A staff account (Admin) when any role is a staff role, else a member (User).
     */
    protected function userWithRole(RoleName ...$roles): User|Admin
    {
        $staff = array_values(array_filter($roles, fn (RoleName $r) => $r->isStaff()));
        if ($staff !== []) {
            return Admin::factory()->create()->assignRole(...$staff);
        }

        return User::factory()->create()->assignRole(RoleName::User, ...$roles);
    }

    protected function actingAsRole(RoleName ...$roles): User|Admin
    {
        $user = $this->userWithRole(...$roles);
        Sanctum::actingAs($user);

        return $user;
    }

    protected function lastAudit(string $action): ?AuditLog
    {
        return AuditLog::where('action', $action)->latest('created_at')->orderByDesc('id')->first();
    }
}
