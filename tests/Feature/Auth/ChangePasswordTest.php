<?php

namespace Tests\Feature\Auth;

use App\Models\AuditLog;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    private const OLD = 'old-password-123';

    private const NEW = 'brand-new-password-456';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function change(string $token, array $body)
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token)->putJson('/api/v1/me/password', $body);
    }

    public function test_password_change_revokes_other_tokens_and_is_audited(): void
    {
        $user = User::factory()->create(['password' => self::OLD]);
        $current = $user->createToken('admin')->plainTextToken;
        $other = $user->createToken('phone');

        $this->change($current, [
            'current_password' => self::OLD, 'password' => self::NEW, 'password_confirmation' => self::NEW,
        ])->assertOk()->assertJsonPath('message', 'Your password has been changed. Other devices have been signed out.');

        $user->refresh();
        $this->assertTrue(Hash::check(self::NEW, $user->password));
        $this->assertNull(PersonalAccessToken::find($other->accessToken->id), 'Other sessions are signed out.');
        $this->assertSame(1, $user->tokens()->count(), 'The token used for the change keeps working.');

        $log = AuditLog::where('action', 'user.password_changed')->sole();
        $this->assertSame($user->id, $log->actor_id);
        $this->assertNull($log->new_values, 'No password material is written to the audit log.');

        $this->app['auth']->forgetGuards();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => self::NEW])->assertOk();
    }

    public function test_wrong_current_password_weak_or_unconfirmed_passwords_are_rejected(): void
    {
        $user = User::factory()->create(['password' => self::OLD]);
        $token = $user->createToken('admin')->plainTextToken;

        $this->change($token, ['current_password' => 'wrong', 'password' => self::NEW, 'password_confirmation' => self::NEW])
            ->assertUnprocessable()->assertJsonValidationErrors(['current_password' => 'Your current password is incorrect.']);
        $this->change($token, ['current_password' => self::OLD, 'password' => 'short', 'password_confirmation' => 'short'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->change($token, ['current_password' => self::OLD, 'password' => self::NEW, 'password_confirmation' => 'different-one'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->change($token, ['current_password' => self::OLD, 'password' => self::OLD, 'password_confirmation' => self::OLD])
            ->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->assertTrue(Hash::check(self::OLD, $user->fresh()->password));
        $this->assertSame(0, AuditLog::where('action', 'user.password_changed')->count());
    }

    public function test_guests_cannot_change_passwords_and_attempts_are_throttled(): void
    {
        $this->putJson('/api/v1/me/password', ['current_password' => 'x', 'password' => self::NEW])->assertUnauthorized();

        $user = User::factory()->create(['password' => self::OLD]);
        $token = $user->createToken('admin')->plainTextToken;
        for ($i = 0; $i < 5; $i++) {
            $this->change($token, ['current_password' => 'guess-'.$i, 'password' => self::NEW, 'password_confirmation' => self::NEW])
                ->assertUnprocessable();
        }
        $this->change($token, ['current_password' => self::OLD, 'password' => self::NEW, 'password_confirmation' => self::NEW])
            ->assertStatus(429);
    }
}
