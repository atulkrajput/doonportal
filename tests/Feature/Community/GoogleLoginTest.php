<?php

namespace Tests\Feature\Community;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\Feature\Admin\AdminTestCase;

class GoogleLoginTest extends AdminTestCase
{
    private const CLIENT_ID = 'test-client.apps.googleusercontent.com';

    /** @var array{0: array<string, mixed>, 1: int} what the fake tokeninfo endpoint answers */
    private array $google = [[], 200];

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.google.client_id' => self::CLIENT_ID]);
        Http::fake(['oauth2.googleapis.com/tokeninfo*' => fn () => Http::response(...$this->google)]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function fakeGoogle(array $overrides = [], int $status = 200): void
    {
        $this->google = [[
            'iss' => 'https://accounts.google.com',
            'aud' => self::CLIENT_ID,
            'sub' => '1234567890',
            'email' => 'Asha@Example.com',
            'email_verified' => 'true',
            'name' => 'Asha Rawat',
            'exp' => (string) (time() + 3600),
            ...$overrides,
        ], $status];
    }

    public function test_new_google_user_is_created_with_verified_email_and_no_password(): void
    {
        $this->fakeGoogle();

        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])
            ->assertCreated()
            ->assertJsonStructure(['token'])
            ->assertJsonPath('user.email', 'asha@example.com')
            ->assertJsonPath('user.google_linked', true)
            ->assertJsonPath('user.has_password', false)
            ->assertJsonPath('user.roles', ['USER'])
            ->assertJsonMissingPath('user.google_id');

        $user = User::firstWhere('email', 'asha@example.com');
        $this->assertSame('1234567890', $user->google_id);
        $this->assertNotNull($user->email_verified_at);

        // Signing in again finds the same account.
        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])->assertOk();
        $this->assertSame(1, User::count());
    }

    public function test_existing_verified_account_is_linked_and_keeps_its_password(): void
    {
        $user = User::factory()->create(['email' => 'asha@example.com', 'password' => 'Secret-pass-123']);
        $this->fakeGoogle();

        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])->assertOk()->assertJsonPath('user.id', $user->id);

        $user->refresh();
        $this->assertSame('1234567890', $user->google_id);
        $this->assertTrue(Hash::check('Secret-pass-123', $user->password));
        $this->assertNotNull($this->lastAudit('user.google_linked'));
    }

    public function test_linking_an_unverified_account_removes_the_password_and_sessions(): void
    {
        // Someone registered with this email before its owner did and never verified it.
        $user = User::factory()->unverified()->create(['email' => 'asha@example.com', 'password' => 'Squatter-pass-123']);
        $user->createToken('squatter');
        $this->fakeGoogle();

        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])->assertOk();

        $user->refresh();
        $this->assertFalse($user->hasPassword());
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame(1, $user->tokens()->count(), 'only the new Google session remains');
    }

    public function test_tokens_for_another_client_or_unverified_email_are_rejected(): void
    {
        $this->fakeGoogle(['aud' => 'someone-else.apps.googleusercontent.com']);
        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])->assertUnprocessable()->assertJsonValidationErrors('credential');

        $this->fakeGoogle(['email_verified' => 'false']);
        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])->assertUnprocessable()->assertJsonValidationErrors('credential');

        $this->fakeGoogle(['exp' => (string) (time() - 10)]);
        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])->assertUnprocessable();

        $this->fakeGoogle(['error' => 'invalid_token'], 400);
        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])->assertUnprocessable();

        $this->assertSame(0, User::count());
    }

    public function test_closed_accounts_cannot_sign_in_with_google(): void
    {
        User::factory()->create(['email' => 'asha@example.com'])->delete();
        $this->fakeGoogle();

        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])->assertUnprocessable();
    }

    public function test_signed_in_member_links_google_with_the_same_email_only(): void
    {
        $member = $this->actingAsRole();
        $member->forceFill(['email' => 'asha@example.com'])->save();

        $this->fakeGoogle(['email' => 'someone.else@example.com']);
        $this->postJson('/api/v1/me/google', ['credential' => 'id-token'])->assertUnprocessable()->assertJsonValidationErrors('credential');

        $other = User::factory()->create(['google_id' => '1234567890']);
        $this->fakeGoogle();
        $this->postJson('/api/v1/me/google', ['credential' => 'id-token'])->assertUnprocessable();

        $other->forceFill(['google_id' => null])->save();
        $this->postJson('/api/v1/me/google', ['credential' => 'id-token'])->assertOk()
            ->assertJsonPath('data.id', $member->id)->assertJsonPath('data.google_linked', true);
        $this->assertSame('1234567890', $member->fresh()->google_id);
    }

    public function test_google_sign_in_is_off_without_a_client_id(): void
    {
        config(['services.google.client_id' => null]);

        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])->assertNotFound();
        Http::assertNothingSent();
    }
}
