<?php

namespace Tests\Feature\Community;

use App\Enums\RoleName;
use App\Models\AnalyticsEvent;
use App\Models\Business;
use App\Models\Submission;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Admin\AdminTestCase;

class OwnerToolsTest extends AdminTestCase
{
    private User $owner;

    private Business $business;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = $this->userWithRole(RoleName::BusinessOwner);
        $this->business = Business::factory()->create(['tagline' => 'Old tagline', 'phone' => '+91 98765 00000']);
        $this->business->forceFill(['owner_id' => $this->owner->id])->save();
        $this->business->hours()->create(['day_of_week' => 1, 'opens_at' => '09:00', 'closes_at' => '18:00', 'is_closed' => false]);
        Sanctum::actingAs($this->owner);
    }

    public function test_owner_sees_their_listings_and_others_cannot(): void
    {
        $this->getJson('/api/v1/me/businesses')->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $this->business->id)
            ->assertJsonPath('data.0.has_pending_edit', false);
        $this->getJson("/api/v1/me/businesses/{$this->business->id}")->assertOk()
            ->assertJsonPath('data.current.tagline', 'Old tagline')
            ->assertJsonPath('data.current.hours.0.opens_at', '09:00');

        Sanctum::actingAs($this->userWithRole(RoleName::BusinessOwner));
        $this->getJson("/api/v1/me/businesses/{$this->business->id}")->assertNotFound();
        $this->postJson("/api/v1/me/businesses/{$this->business->id}/edits", ['tagline' => 'Hijacked'])->assertNotFound();
        $this->getJson("/api/v1/me/businesses/{$this->business->id}/stats")->assertNotFound();
    }

    public function test_owner_edits_wait_for_approval_and_only_changes_are_stored(): void
    {
        $current = $this->getJson("/api/v1/me/businesses/{$this->business->id}")->json('data.current');

        // Sending the form back unchanged is not a proposal.
        $this->postJson("/api/v1/me/businesses/{$this->business->id}/edits", $current)
            ->assertUnprocessable()->assertJsonValidationErrors('changes');

        // Fields owners don't control are ignored, not applied.
        $this->postJson("/api/v1/me/businesses/{$this->business->id}/edits", ['name' => 'Renamed', 'is_featured' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('changes');

        $id = $this->postJson("/api/v1/me/businesses/{$this->business->id}/edits", [
            ...$current,
            'tagline' => 'Fresh bread daily',
            'hours' => [['day_of_week' => 1, 'opens_at' => '08:00', 'closes_at' => '18:00']],
        ])->assertCreated()->json('data.id');

        $submission = Submission::findOrFail($id);
        $this->assertSame(['tagline', 'hours'], array_keys($submission->payload));
        $this->assertSame('Old tagline', $this->business->fresh()->tagline, 'nothing changes before approval');

        // A second proposal replaces the pending one.
        $again = $this->postJson("/api/v1/me/businesses/{$this->business->id}/edits", ['tagline' => 'Fresh bread, every day'])
            ->assertCreated()->json('data.id');
        $this->assertSame($id, $again);
        $this->assertSame(['tagline' => 'Fresh bread, every day'], Submission::find($id)->payload);
        $this->getJson('/api/v1/me/businesses')->assertJsonPath('data.0.has_pending_edit', true);

        // Staff see the live value next to the proposal, then approve.
        $this->actingAsRole(RoleName::Moderator);
        $this->getJson("/api/v1/admin/submissions/{$id}")->assertOk()
            ->assertJsonPath('data.context.current.tagline', 'Old tagline')
            ->assertJsonPath('data.payload.tagline', 'Fresh bread, every day');
        $this->postJson("/api/v1/admin/submissions/{$id}/approve")->assertOk();

        $this->assertSame('Fresh bread, every day', $this->business->fresh()->tagline);
        // Hours were dropped from the final proposal, so they are untouched.
        $this->assertSame('09:00', substr((string) $this->business->hours()->first()->opens_at, 0, 5));
        $this->assertNotNull($this->lastAudit('business.owner_edit_applied'));
    }

    public function test_edit_is_not_applied_if_ownership_changed_meanwhile(): void
    {
        $id = $this->postJson("/api/v1/me/businesses/{$this->business->id}/edits", ['tagline' => 'Mine'])->json('data.id');
        $this->business->forceFill(['owner_id' => null])->save();

        $this->actingAsRole(RoleName::Moderator);
        $this->postJson("/api/v1/admin/submissions/{$id}/approve")->assertUnprocessable();
        $this->assertSame('Old tagline', $this->business->fresh()->tagline);
    }

    public function test_owner_stats_count_listing_activity(): void
    {
        foreach (['business_viewed', 'business_viewed', 'business_viewed', 'business_phone_clicked', 'directions_clicked'] as $name) {
            AnalyticsEvent::create(['name' => $name, 'entity_type' => 'business', 'entity_id' => $this->business->id]);
        }
        AnalyticsEvent::create(['name' => 'business_viewed', 'entity_type' => 'business', 'entity_id' => Business::factory()->create()->id]);

        $stats = $this->getJson("/api/v1/me/businesses/{$this->business->id}/stats?days=7")->assertOk()->json('data');
        $totals = collect($stats['totals'])->pluck('total', 'event');

        $this->assertSame(3, $totals['business_viewed']);
        $this->assertSame(1, $totals['business_phone_clicked']);
        $this->assertSame(1, $totals['directions_clicked']);
        $this->assertCount(7, $stats['daily_views']);
        $this->assertSame(3, collect($stats['daily_views'])->sum('views'));

        $this->getJson('/api/v1/me/businesses')->assertJsonPath('data.0.last_30_days.views', 3)
            ->assertJsonPath('data.0.last_30_days.actions', 2);
        $this->getJson("/api/v1/me/businesses/{$this->business->id}/stats?days=12")->assertUnprocessable();
    }
}
