<?php

namespace Tests\Feature\Admin;

use App\Enums\RoleName;
use App\Models\Admin;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

class StaffManagementTest extends AdminTestCase
{
    private function rolesOf(Admin $admin): array
    {
        return $admin->roles()->pluck('name')->sort()->values()->all();
    }

    private function putRoles(Admin $target, array $roles)
    {
        return $this->putJson("/api/v1/admin/staff/{$target->id}/roles", ['roles' => $roles]);
    }

    public function test_staff_sign_in_separately_and_tokens_stay_on_their_side(): void
    {
        $admin = Admin::factory()->create(['email' => 'meera@doonportal.com', 'password' => 'Staff-pass-123'])->assignRole(RoleName::Editor);
        User::factory()->create(['email' => 'meera@doonportal.com', 'password' => 'Member-pass-123'])->assignRole(RoleName::User);

        // Same email, two separate accounts: each password only works on its own sign-in.
        $this->postJson('/api/v1/admin/auth/login', ['email' => 'meera@doonportal.com', 'password' => 'Member-pass-123'])->assertUnprocessable();
        $this->postJson('/api/v1/auth/login', ['email' => 'meera@doonportal.com', 'password' => 'Staff-pass-123'])->assertUnprocessable();

        $staffToken = $this->postJson('/api/v1/admin/auth/login', ['email' => 'meera@doonportal.com', 'password' => 'Staff-pass-123'])
            ->assertOk()->assertJsonPath('user.type', 'staff')->assertJsonPath('user.roles', ['EDITOR'])->json('token');
        $memberToken = $this->postJson('/api/v1/auth/login', ['email' => 'meera@doonportal.com', 'password' => 'Member-pass-123'])->json('token');
        $this->assertNotNull($admin->fresh()->last_login_at);

        $this->withToken($staffToken)->getJson('/api/v1/admin/auth/me')->assertOk()->assertJsonPath('data.id', $admin->id);
        $this->withToken($staffToken)->getJson('/api/v1/admin/businesses')->assertOk();
        $this->withToken($staffToken)->getJson('/api/v1/me')->assertForbidden();
        $this->app['auth']->forgetGuards();

        $this->withToken($memberToken)->getJson('/api/v1/admin/businesses')->assertForbidden();
        $this->withToken($memberToken)->getJson('/api/v1/admin/auth/me')->assertForbidden();
        $this->withToken($memberToken)->getJson('/api/v1/me')->assertOk();
    }

    public function test_deactivated_staff_cannot_sign_in_or_use_tokens(): void
    {
        $this->actingAsRole(RoleName::SuperAdmin);
        $editor = Admin::factory()->create(['password' => 'Staff-pass-123'])->assignRole(RoleName::Editor);
        $editor->createToken('admin');

        $this->putJson("/api/v1/admin/staff/{$editor->id}/active", ['is_active' => false])->assertOk()->assertJsonPath('data.is_active', false);
        $this->assertSame(0, $editor->tokens()->count());
        $this->assertNotNull($this->lastAudit('admin.deactivated'));

        $this->postJson('/api/v1/admin/auth/login', ['email' => $editor->email, 'password' => 'Staff-pass-123'])->assertUnprocessable();

        Sanctum::actingAs($editor->fresh());
        $this->getJson('/api/v1/admin/businesses')->assertForbidden();
    }

    public function test_admin_creates_staff_and_manages_roles_with_audit(): void
    {
        $admin = $this->actingAsRole(RoleName::Admin);

        $this->postJson('/api/v1/admin/staff', ['name' => 'Ravi', 'email' => 'Ravi@DoonPortal.com', 'password' => 'Temp-pass-123', 'password_confirmation' => 'Temp-pass-123', 'roles' => ['ADMIN']])
            ->assertForbidden();
        $id = $this->postJson('/api/v1/admin/staff', ['name' => 'Ravi', 'email' => 'Ravi@DoonPortal.com', 'password' => 'Temp-pass-123', 'password_confirmation' => 'Temp-pass-123', 'roles' => ['EDITOR']])
            ->assertCreated()->assertJsonPath('data.email', 'ravi@doonportal.com')->assertJsonMissingPath('data.password')->json('data.id');
        $target = Admin::findOrFail($id);
        $this->assertTrue(Hash::check('Temp-pass-123', $target->password));

        $this->putRoles($target, ['EDITOR', 'MODERATOR'])->assertOk();
        $this->assertSame(['EDITOR', 'MODERATOR'], $this->rolesOf($target));
        $log = $this->lastAudit('admin.roles_changed');
        $this->assertSame(['admin', $admin->id], [$log->actor_type, $log->actor_id]);
        $this->assertSame(['EDITOR'], $log->old_values['roles']);

        $this->putRoles($target, [])->assertStatus(422);
        $this->putRoles($target, ['USER'])->assertUnprocessable()->assertJsonValidationErrors('roles.0');
        $this->putRoles($target, ['ROOT'])->assertUnprocessable();
    }

    public function test_only_super_admins_manage_administrators(): void
    {
        $this->actingAsRole(RoleName::Admin);
        $editor = $this->userWithRole(RoleName::Editor);
        $otherAdmin = $this->userWithRole(RoleName::Admin);
        $superAdmin = $this->userWithRole(RoleName::SuperAdmin);

        $this->putRoles($editor, ['EDITOR', 'ADMIN'])->assertForbidden();
        $this->putRoles($otherAdmin, ['EDITOR'])->assertForbidden();
        $this->putRoles($superAdmin, ['ADMIN'])->assertForbidden();
        $this->putJson("/api/v1/admin/staff/{$otherAdmin->id}/active", ['is_active' => false])->assertForbidden();
        $this->putJson("/api/v1/admin/staff/{$otherAdmin->id}/password", ['password' => 'New-pass-12345', 'password_confirmation' => 'New-pass-12345'])->assertForbidden();
        $this->assertSame(['EDITOR'], $this->rolesOf($editor));

        Sanctum::actingAs($superAdmin);
        $this->putRoles($editor, ['ADMIN'])->assertOk();
        $this->putJson("/api/v1/admin/staff/{$otherAdmin->id}/password", ['password' => 'New-pass-12345', 'password_confirmation' => 'New-pass-12345'])->assertOk();
        $this->assertTrue(Hash::check('New-pass-12345', $otherAdmin->fresh()->password));
    }

    public function test_nobody_changes_their_own_roles_or_status(): void
    {
        $superAdmin = $this->actingAsRole(RoleName::SuperAdmin);

        $this->putRoles($superAdmin, ['EDITOR'])->assertForbidden();
        $this->putJson("/api/v1/admin/staff/{$superAdmin->id}/active", ['is_active' => false])->assertForbidden();
        $this->putJson("/api/v1/admin/staff/{$superAdmin->id}/password", ['password' => 'New-pass-12345', 'password_confirmation' => 'New-pass-12345'])->assertForbidden();
        $this->assertSame(['SUPER_ADMIN'], $this->rolesOf($superAdmin));
    }

    public function test_staff_without_user_management_cannot_see_staff_or_members(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $target = $this->userWithRole(RoleName::Moderator);

        $this->getJson('/api/v1/admin/staff')->assertForbidden();
        $this->getJson('/api/v1/admin/members')->assertForbidden();
        $this->putRoles($target, ['ADMIN'])->assertForbidden();
    }

    public function test_member_list_shows_members_only_and_never_secrets(): void
    {
        $this->actingAsRole(RoleName::Admin);
        $owner = $this->userWithRole(RoleName::BusinessOwner);
        $this->userWithRole();

        $this->getJson('/api/v1/admin/members?role=BUSINESS_OWNER')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $owner->id)
            ->assertJsonMissingPath('data.0.password')->assertJsonMissingPath('data.0.google_id');
        $this->getJson('/api/v1/admin/members?role=ADMIN')->assertUnprocessable();
        $this->getJson('/api/v1/admin/staff')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_staff_change_their_own_password(): void
    {
        $admin = Admin::factory()->create(['password' => 'Old-pass-12345'])->assignRole(RoleName::Moderator);
        Sanctum::actingAs($admin);

        $this->putJson('/api/v1/admin/auth/password', ['current_password' => 'wrong', 'password' => 'New-pass-12345', 'password_confirmation' => 'New-pass-12345'])
            ->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->putJson('/api/v1/admin/auth/password', ['current_password' => 'Old-pass-12345', 'password' => 'New-pass-12345', 'password_confirmation' => 'New-pass-12345'])
            ->assertOk();
        $this->assertTrue(Hash::check('New-pass-12345', $admin->fresh()->password));
    }

    public function test_staff_create_command_makes_a_super_admin(): void
    {
        $this->artisan('staff:create', ['--name' => 'Atul', '--email' => 'Atul@DoonPortal.com'])
            ->expectsQuestion('Password (at least 8 characters)', 'Strong-pass-123')
            ->expectsQuestion('Repeat the password', 'Strong-pass-123')
            ->assertSuccessful();

        $admin = Admin::firstWhere('email', 'atul@doonportal.com');
        $this->assertTrue($admin->isSuperAdmin());
        $this->assertSame(0, User::count(), 'staff accounts are not member accounts');

        $this->artisan('staff:create', ['--name' => 'Dup', '--email' => 'atul@doonportal.com'])
            ->expectsQuestion('Password (at least 8 characters)', 'Strong-pass-123')
            ->expectsQuestion('Repeat the password', 'Strong-pass-123')
            ->assertFailed();
    }
}
