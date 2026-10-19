<?php

namespace Tests\Feature\Admin;

use App\Enums\RoleName;
use App\Models\AuditLog;
use App\Models\User;

class RoleManagementTest extends AdminTestCase
{
    private function rolesOf(User $user): array
    {
        return $user->roles()->pluck('name')->sort()->values()->all();
    }

    private function putRoles(User $target, array $roles)
    {
        return $this->putJson("/api/v1/admin/users/{$target->id}/roles", ['roles' => $roles]);
    }

    public function test_admin_can_grant_and_revoke_staff_roles_and_it_is_audited(): void
    {
        $admin = $this->actingAsRole(RoleName::Admin);
        $target = $this->userWithRole();

        $this->putRoles($target, ['EDITOR', 'MODERATOR'])->assertOk()
            ->assertJsonPath('data.roles', fn ($roles) => collect($roles)->sort()->values()->all() === ['EDITOR', 'MODERATOR', 'USER']);

        $log = $this->lastAudit('user.roles_changed');
        $this->assertSame($admin->id, $log->actor_id);
        $this->assertSame($target->id, $log->auditable_id);
        $this->assertSame(['USER'], $log->old_values['roles']);
        $this->assertSame(['EDITOR', 'MODERATOR', 'USER'], $log->new_values['roles']);

        $this->putRoles($target, [])->assertOk();
        $this->assertSame(['USER'], $this->rolesOf($target), 'USER is the baseline role and is always kept.');
    }

    public function test_admin_cannot_grant_admin_or_super_admin(): void
    {
        $this->actingAsRole(RoleName::Admin);
        $target = $this->userWithRole(RoleName::Editor);

        $this->putRoles($target, ['EDITOR', 'ADMIN'])->assertForbidden();
        $this->putRoles($target, ['SUPER_ADMIN'])->assertForbidden();

        $this->assertSame(['EDITOR', 'USER'], $this->rolesOf($target));
        $this->assertNull($this->lastAudit('user.roles_changed'));
    }

    public function test_admin_cannot_change_another_administrators_roles(): void
    {
        $this->actingAsRole(RoleName::Admin);
        $otherAdmin = $this->userWithRole(RoleName::Admin);
        $superAdmin = $this->userWithRole(RoleName::SuperAdmin);

        $this->putRoles($otherAdmin, ['EDITOR'])->assertForbidden();
        $this->putRoles($otherAdmin, ['ADMIN', 'EDITOR'])->assertForbidden();
        $this->putRoles($superAdmin, [])->assertForbidden();

        $this->assertSame(['ADMIN', 'USER'], $this->rolesOf($otherAdmin));
        $this->assertSame(['SUPER_ADMIN', 'USER'], $this->rolesOf($superAdmin));
    }

    public function test_nobody_can_change_their_own_roles(): void
    {
        foreach ([RoleName::Admin, RoleName::SuperAdmin] as $role) {
            $me = $this->actingAsRole($role);
            $this->putRoles($me, [$role->value, 'EDITOR'])->assertForbidden()
                ->assertJsonPath('message', 'You cannot change your own roles.');
            $this->putRoles($me, [])->assertForbidden();
            $this->assertContains($role->value, $this->rolesOf($me));
        }
    }

    public function test_super_admin_can_grant_and_revoke_admin(): void
    {
        $this->actingAsRole(RoleName::SuperAdmin);
        $target = $this->userWithRole();

        $this->putRoles($target, ['ADMIN'])->assertOk();
        $this->assertSame(['ADMIN', 'USER'], $this->rolesOf($target));

        $this->putRoles($target, ['EDITOR'])->assertOk();
        $this->assertSame(['EDITOR', 'USER'], $this->rolesOf($target));
        $this->assertSame(2, AuditLog::where('action', 'user.roles_changed')->count());
    }

    public function test_staff_without_user_management_cannot_touch_roles(): void
    {
        $target = $this->userWithRole();

        foreach ([RoleName::Editor, RoleName::Moderator, RoleName::BusinessOwner, RoleName::User] as $role) {
            $this->actingAsRole($role);
            $this->putRoles($target, ['EDITOR'])->assertForbidden();
            $this->getJson('/api/v1/admin/users')->assertForbidden();
        }

        $this->assertSame(['USER'], $this->rolesOf($target));
    }

    public function test_unknown_roles_are_rejected(): void
    {
        $this->actingAsRole(RoleName::SuperAdmin);
        $target = $this->userWithRole();

        $this->putRoles($target, ['ROOT'])->assertUnprocessable()->assertJsonValidationErrors('roles.0');
        $this->putJson("/api/v1/admin/users/{$target->id}/roles", [])->assertUnprocessable();
    }

    public function test_user_listing_filters_by_role_and_never_exposes_secrets(): void
    {
        $this->actingAsRole(RoleName::Admin);
        $this->userWithRole(RoleName::Editor);
        $this->userWithRole();

        $response = $this->getJson('/api/v1/admin/users?role=EDITOR')->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertArrayNotHasKey('password', $response->json('data.0'));
        $this->assertArrayNotHasKey('remember_token', $response->json('data.0'));
    }
}
