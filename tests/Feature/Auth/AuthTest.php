<?php

namespace Tests\Feature\Auth;

use App\Enums\RoleName;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_user_can_register_and_gets_user_role_and_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Asha',
            'email' => 'asha@example.com',
            'password' => 'Secret-pass-123',
            'password_confirmation' => 'Secret-pass-123',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'roles']])
            ->assertJsonPath('user.roles', ['USER'])
            ->assertJsonMissingPath('user.password');

        $this->assertTrue(User::firstWhere('email', 'asha@example.com')->hasRole(RoleName::User));
    }

    public function test_registration_cannot_assign_roles(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Mallory',
            'email' => 'mallory@example.com',
            'password' => 'Secret-pass-123',
            'password_confirmation' => 'Secret-pass-123',
            'roles' => ['SUPER_ADMIN'],
        ])->assertCreated()->assertJsonPath('user.roles', ['USER']);
    }

    public function test_registration_validates_input(): void
    {
        $this->postJson('/api/v1/auth/register', ['email' => 'not-an-email'])
            ->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors' => ['name', 'email', 'password']]);
    }

    public function test_login_with_valid_and_invalid_credentials(): void
    {
        $user = User::factory()->create(['password' => 'Secret-pass-123']);

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Secret-pass-123'])
            ->assertOk()->assertJsonStructure(['token', 'user']);
    }

    public function test_me_requires_authentication_and_returns_json_401(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized()->assertJson(['message' => 'Unauthenticated.']);
        $this->get('/api/v1/me')->assertUnauthorized()->assertHeader('content-type', 'application/json');
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_profile_update_only_changes_allowed_fields(): void
    {
        $user = User::factory()->create(['email' => 'keep@example.com']);

        $this->actingAs($user)->patchJson('/api/v1/me', [
            'name' => 'New Name',
            'phone' => '+91 98765 43210',
            'email' => 'changed@example.com',
        ])->assertOk()->assertJsonPath('data.name', 'New Name');

        $this->assertSame('keep@example.com', $user->fresh()->email);
    }

    public function test_forgot_password_does_not_reveal_unknown_emails(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk()->json('message');
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk()->json('message');

        $this->assertSame($known, $unknown);
        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_password_can_be_reset_with_valid_token(): void
    {
        $user = User::factory()->create();
        $user->createToken('old');
        $token = Password::createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'Brand-new-pass-9',
            'password_confirmation' => 'Brand-new-pass-9',
        ])->assertOk();

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Brand-new-pass-9'])->assertOk();
        $this->assertSame(1, $user->tokens()->count()); // old token revoked, new login token issued
    }
}
