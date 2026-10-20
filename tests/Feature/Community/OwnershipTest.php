<?php

namespace Tests\Feature\Community;

use App\Enums\BusinessStatus;
use App\Enums\ClaimStatus;
use App\Enums\RoleName;
use App\Enums\SubmissionStatus;
use App\Models\Area;
use App\Models\Business;
use App\Models\BusinessClaim;
use App\Models\Category;
use App\Models\Submission;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Admin\AdminTestCase;

class OwnershipTest extends AdminTestCase
{
    /**
     * @return array<string, mixed>
     */
    private function claimPayload(array $overrides = []): array
    {
        return [
            'claimant_role' => 'owner',
            'contact_phone_country' => 'IN',
            'contact_phone' => '98765 43210',
            'contact_email' => 'owner@example.com',
            'message' => 'I run this café; our GST certificate is linked.',
            'evidence_links' => ['https://example.com/gst.pdf'],
            'confirm' => true,
            ...$overrides,
        ];
    }

    public function test_member_claims_a_listing_and_a_moderator_approves_it(): void
    {
        $business = Business::factory()->create(['status' => BusinessStatus::Verified]);
        $member = $this->actingAsRole();

        $this->postJson("/api/v1/businesses/{$business->slug}/claim", $this->claimPayload())
            ->assertCreated()
            ->assertJsonPath('data.status', 'PENDING')
            ->assertJsonPath('data.contact_phone', '+919876543210')
            ->assertJsonMissingPath('data.user');

        // One open claim per member per listing.
        $this->postJson("/api/v1/businesses/{$business->slug}/claim", $this->claimPayload())
            ->assertUnprocessable()->assertJsonValidationErrors('business');

        $rival = $this->userWithRole();
        $rivalClaim = BusinessClaim::forceCreate(['business_id' => $business->id, 'user_id' => $rival->id, 'status' => 'PENDING']);

        // A plain member cannot review claims.
        $this->getJson('/api/v1/admin/claims')->assertForbidden();

        $moderator = $this->actingAsRole(RoleName::Moderator);
        $claim = BusinessClaim::where('user_id', $member->id)->firstOrFail();

        $this->getJson('/api/v1/admin/claims?status=PENDING')->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.user.email', fn ($email) => filled($email));
        $this->postJson("/api/v1/admin/claims/{$claim->id}/approve", ['notes' => 'GST matches'])
            ->assertOk()->assertJsonPath('data.status', 'APPROVED');

        $business->refresh();
        $this->assertSame($member->id, $business->owner_id);
        $this->assertSame(BusinessStatus::Claimed, $business->status, 'verified listings show as claimed');
        $this->assertTrue($member->fresh()->hasRole(RoleName::BusinessOwner));
        $this->assertSame(ClaimStatus::Rejected, $rivalClaim->fresh()->status);
        $this->assertSame($moderator->id, $claim->fresh()->reviewer_id);
        $this->assertNotNull($this->lastAudit('business.owner_linked'));

        // Decided claims stay decided; owned listings can't be claimed again.
        $this->postJson("/api/v1/admin/claims/{$claim->id}/reject", ['notes' => 'x'])->assertUnprocessable();
        Sanctum::actingAs($rival);
        $this->postJson("/api/v1/businesses/{$business->slug}/claim", $this->claimPayload())
            ->assertUnprocessable()->assertJsonValidationErrors('business');

        // The public listing now shows it is claimed; the owner is never exposed.
        $this->getJson("/api/v1/businesses/{$business->slug}")->assertJsonPath('data.is_claimed', true)
            ->assertJsonMissingPath('data.owner_id');
    }

    public function test_claims_need_contact_details_and_confirmation_and_can_be_cancelled(): void
    {
        $business = Business::factory()->create();
        $member = $this->actingAsRole();

        $this->postJson("/api/v1/businesses/{$business->slug}/claim", ['claimant_role' => 'boss'])
            ->assertUnprocessable()->assertJsonValidationErrors(['claimant_role', 'contact_phone', 'contact_email', 'confirm']);

        $claimId = $this->postJson("/api/v1/businesses/{$business->slug}/claim", $this->claimPayload())->json('data.id');
        $this->getJson('/api/v1/me/claims')->assertOk()->assertJsonPath('data.0.business.name', $business->name);

        // Someone else's claim is invisible to this member.
        $other = BusinessClaim::forceCreate(['business_id' => $business->id, 'user_id' => $this->userWithRole()->id, 'status' => 'PENDING']);
        $this->postJson("/api/v1/me/claims/{$other->id}/cancel")->assertNotFound();

        $this->postJson("/api/v1/me/claims/{$claimId}/cancel")->assertOk()->assertJsonPath('data.status', 'CANCELLED');
        $this->assertNull($business->fresh()->owner_id);
        $this->assertFalse($member->fresh()->hasRole(RoleName::BusinessOwner));
    }

    public function test_rejections_require_a_reason(): void
    {
        $business = Business::factory()->create();
        $claim = BusinessClaim::forceCreate(['business_id' => $business->id, 'user_id' => $this->userWithRole()->id, 'status' => 'PENDING']);
        $this->actingAsRole(RoleName::Moderator);

        $this->postJson("/api/v1/admin/claims/{$claim->id}/reject")->assertUnprocessable()->assertJsonValidationErrors('notes');
        $this->postJson("/api/v1/admin/claims/{$claim->id}/reject", ['notes' => 'No proof of ownership'])
            ->assertOk()->assertJsonPath('data.status', 'REJECTED')->assertJsonPath('data.review_notes', 'No proof of ownership');
    }

    public function test_member_adds_a_new_business_which_becomes_theirs_on_approval(): void
    {
        $category = Category::factory()->create(['name' => 'Bakeries']);
        $area = Area::factory()->create();
        $member = $this->actingAsRole();

        $this->postJson('/api/v1/me/submissions/business', ['name' => 'X'])
            ->assertUnprocessable()->assertJsonValidationErrors(['category_id', 'address_line', 'phone', 'relationship', 'confirm']);

        $id = $this->postJson('/api/v1/me/submissions/business', [
            'name' => 'Doon Sourdough',
            'category_id' => $category->id,
            'area_id' => $area->id,
            'address_line' => '4 Old Survey Road',
            'pincode' => '248001',
            'phone_country' => 'IN',
            'phone' => '9876543210',
            'whatsapp' => '98765 43211',
            'relationship' => 'owner',
            'confirm' => '1',
        ])->assertCreated()->assertJsonPath('data.type', 'BUSINESS')->assertJsonPath('data.payload.phone', '+919876543210')
            ->assertJsonPath('data.payload.whatsapp', '+919876543211')->json('data.id');

        $this->getJson('/api/v1/me/submissions')->assertJsonPath('data.0.status', 'PENDING');
        $this->assertSame(0, Business::count(), 'nothing is listed before review');

        $this->actingAsRole(RoleName::Moderator);
        $this->getJson("/api/v1/admin/submissions/{$id}")->assertOk()
            ->assertJsonPath('data.context.category', 'Bakeries')
            ->assertJsonPath('data.user.id', $member->id);
        $this->postJson("/api/v1/admin/submissions/{$id}/approve")->assertOk()->assertJsonPath('data.status', 'APPROVED');

        $business = Business::firstWhere('name', 'Doon Sourdough');
        $this->assertNotNull($business);
        $this->assertSame($member->id, $business->owner_id);
        $this->assertTrue($business->is_published);
        $this->assertSame(BusinessStatus::Unverified, $business->status, 'approval lists it; verification is separate');
        $this->assertSame([$category->id], $business->categories()->pluck('categories.id')->all());
        $this->assertTrue($member->fresh()->hasRole(RoleName::BusinessOwner));
        $this->assertSame($business->id, Submission::find($id)->entity_id);
    }

    public function test_member_can_withdraw_a_pending_submission_only(): void
    {
        $member = $this->actingAsRole();
        $pending = new Submission(['type' => 'BUSINESS', 'payload' => ['name' => 'A']]);
        $pending->user()->associate($member)->save();
        $decided = new Submission(['type' => 'BUSINESS', 'payload' => ['name' => 'B']]);
        $decided->user()->associate($member);
        $decided->forceFill(['status' => SubmissionStatus::Rejected])->save();
        $foreign = new Submission(['type' => 'BUSINESS', 'payload' => ['name' => 'C']]);
        $foreign->user()->associate(User::factory()->create())->save();

        $this->deleteJson("/api/v1/me/submissions/{$foreign->id}")->assertNotFound();
        $this->deleteJson("/api/v1/me/submissions/{$decided->id}")->assertUnprocessable();
        $this->deleteJson("/api/v1/me/submissions/{$pending->id}")->assertNoContent();
        $this->assertModelMissing($pending);
    }
}
