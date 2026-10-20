<?php

namespace Tests\Feature\Community;

use App\Enums\RoleName;
use App\Models\User;
use App\Support\PhoneNumber;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Admin\AdminTestCase;

class AccountTest extends AdminTestCase
{
    public function test_phone_numbers_are_validated_per_country_and_stored_in_e164(): void
    {
        $this->assertSame('+919876543210', PhoneNumber::toE164('98765 43210', 'IN'));
        $this->assertSame('+919876543210', PhoneNumber::toE164('+91 98765-43210', 'IN'));
        $this->assertSame('+919876543210', PhoneNumber::toE164('098765 43210', 'IN'));
        $this->assertNull(PhoneNumber::toE164('12345 67890', 'IN'), 'Indian mobiles start with 6-9');
        $this->assertNull(PhoneNumber::toE164('+44 7911 123456', 'IN'), 'dial code must match the country');
        $this->assertSame('+447911123456', PhoneNumber::toE164('07911 123456', 'GB'));
        $this->assertSame('+12025550123', PhoneNumber::toE164('(202) 555-0123', 'US'));
        $this->assertSame('+393123456789', PhoneNumber::toE164('312 345 6789', 'IT'));
        $this->assertSame('+254712345678', PhoneNumber::toE164('0712 345678', 'KE'));
        $this->assertSame('+9779841234567', PhoneNumber::toE164('009779841234567', 'NP'));
    }

    public function test_member_updates_profile_with_phone_and_address(): void
    {
        $user = $this->actingAsRole();

        $this->patchJson('/api/v1/me', [
            'name' => 'Asha Rawat',
            'phone_country' => 'in',
            'phone' => '98765 43210',
            'address_line1' => '12 Rajpur Road',
            'city' => 'Dehradun',
            'state' => 'Uttarakhand',
            'postal_code' => '248001',
            'country' => 'IN',
        ])->assertOk()
            ->assertJsonPath('data.phone', '+919876543210')
            ->assertJsonPath('data.phone_country', 'IN')
            ->assertJsonPath('data.address.city', 'Dehradun')
            ->assertJsonPath('data.address.postal_code', '248001');

        $this->assertSame('+919876543210', $user->fresh()->phone);

        $this->patchJson('/api/v1/me', ['phone_country' => 'IN', 'phone' => '12345'])
            ->assertUnprocessable()->assertJsonValidationErrors(['phone' => 'Enter a valid mobile number for India.']);
        $this->patchJson('/api/v1/me', ['country' => 'IN', 'postal_code' => '2480'])
            ->assertUnprocessable()->assertJsonValidationErrors('postal_code');
        $this->patchJson('/api/v1/me', ['country' => 'ZZ'])->assertUnprocessable()->assertJsonValidationErrors('country');

        // Clearing the number clears its country too.
        $this->patchJson('/api/v1/me', ['phone' => ''])->assertOk()
            ->assertJsonPath('data.phone', null)->assertJsonPath('data.phone_country', null);
    }

    public function test_register_accepts_an_optional_phone_number(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Ravi',
            'email' => 'ravi@example.com',
            'phone_country' => 'IN',
            'phone' => '9876543210',
            'password' => 'Secret-pass-123',
            'password_confirmation' => 'Secret-pass-123',
        ])->assertCreated()->assertJsonPath('user.phone', '+919876543210');

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Mira',
            'email' => 'mira@example.com',
            'password' => 'Secret-pass-123',
            'password_confirmation' => 'Secret-pass-123',
        ])->assertCreated()->assertJsonPath('user.phone', null);
    }

    public function test_account_without_password_can_set_one_without_current_password(): void
    {
        $user = User::factory()->create(['password' => null])->assignRole(RoleName::User);
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')->assertJsonPath('data.has_password', false);
        $this->putJson('/api/v1/me/password', ['password' => 'New-secret-123', 'password_confirmation' => 'New-secret-123'])
            ->assertOk();

        $this->assertTrue($user->fresh()->hasPassword());
        $this->assertNotNull($this->lastAudit('user.password_set'));

        // Once set, the current password is required again.
        $this->putJson('/api/v1/me/password', ['password' => 'Another-secret-123', 'password_confirmation' => 'Another-secret-123'])
            ->assertUnprocessable()->assertJsonValidationErrors('current_password');
    }

    public function test_password_login_fails_for_google_only_accounts(): void
    {
        User::factory()->create(['email' => 'g@example.com', 'password' => null]);

        $this->postJson('/api/v1/auth/login', ['email' => 'g@example.com', 'password' => ''])->assertUnprocessable();
        $this->postJson('/api/v1/auth/login', ['email' => 'g@example.com', 'password' => 'anything'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }
}
