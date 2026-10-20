<?php

namespace Tests\Feature\Community;

use App\Enums\ReviewStatus;
use App\Enums\RoleName;
use App\Models\Business;
use App\Models\Event;
use App\Models\Review;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Admin\AdminTestCase;

class ReviewsAndSavedTest extends AdminTestCase
{
    private function review(array $overrides = []): array
    {
        return ['rating' => 4, 'title' => 'Lovely spot', 'body' => 'Great coffee and friendly staff, will return.', ...$overrides];
    }

    public function test_reviews_are_moderated_before_they_count(): void
    {
        $business = Business::factory()->create();
        $member = $this->actingAsRole();

        $this->postJson("/api/v1/businesses/{$business->slug}/reviews", ['rating' => 9, 'body' => 'short'])
            ->assertUnprocessable()->assertJsonValidationErrors(['rating', 'body']);

        $id = $this->postJson("/api/v1/businesses/{$business->slug}/reviews", $this->review())
            ->assertCreated()->assertJsonPath('data.status', 'PENDING')->json('data.id');
        $this->postJson("/api/v1/businesses/{$business->slug}/reviews", $this->review())
            ->assertUnprocessable()->assertJsonValidationErrors('rating');

        $this->getJson("/api/v1/businesses/{$business->slug}/reviews")->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/businesses/{$business->slug}/my-review")->assertJsonPath('data.id', $id);

        // Member tokens can't reach moderation; staff tokens can't write reviews.
        $this->getJson('/api/v1/admin/reviews')->assertForbidden();
        $this->actingAsRole(RoleName::Moderator);
        $this->postJson("/api/v1/businesses/{$business->slug}/reviews", $this->review())->assertForbidden();

        $this->getJson('/api/v1/admin/reviews?status=PENDING')->assertOk()->assertJsonCount(1, 'data');
        $this->postJson("/api/v1/admin/reviews/{$id}/status", ['status' => 'PUBLISHED'])->assertOk()->assertJsonPath('data.status', 'PUBLISHED');

        $business->refresh();
        $this->assertSame(1, $business->rating_count);
        $this->assertSame(4.0, $business->rating_avg);
        $this->getJson("/api/v1/businesses/{$business->slug}/reviews")->assertJsonCount(1, 'data');

        // Editing sends it back to moderation and out of the average.
        Sanctum::actingAs($member);
        $this->patchJson("/api/v1/me/reviews/{$id}", ['rating' => 2])->assertOk()->assertJsonPath('data.status', 'PENDING');
        $this->assertSame(0, $business->fresh()->rating_count);
        $this->getJson('/api/v1/me/reviews')->assertJsonPath('data.0.listing.name', $business->name);

        // Only the author edits or deletes.
        Sanctum::actingAs($this->userWithRole());
        $this->patchJson("/api/v1/me/reviews/{$id}", ['rating' => 5])->assertForbidden();
        $this->deleteJson("/api/v1/me/reviews/{$id}")->assertForbidden();
    }

    public function test_owner_cannot_review_their_listing_but_can_reply_to_reviews(): void
    {
        $owner = $this->userWithRole(RoleName::BusinessOwner);
        $business = Business::factory()->create();
        $business->forceFill(['owner_id' => $owner->id])->save();
        $published = Review::factory()->create(['reviewable_id' => $business->id]);
        $pending = Review::factory()->create(['reviewable_id' => $business->id, 'status' => ReviewStatus::Pending]);
        $elsewhere = Review::factory()->create();
        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/businesses/{$business->slug}/reviews", $this->review())
            ->assertUnprocessable()->assertJsonValidationErrors('rating');

        $this->getJson("/api/v1/me/businesses/{$business->id}/reviews")->assertOk()->assertJsonCount(1, 'data');
        $this->putJson("/api/v1/me/businesses/{$business->id}/reviews/{$published->id}/reply", ['body' => 'Thank you for visiting!'])
            ->assertOk()->assertJsonPath('data.owner_reply', 'Thank you for visiting!');
        $this->putJson("/api/v1/me/businesses/{$business->id}/reviews/{$pending->id}/reply", ['body' => 'Hi'])->assertNotFound();
        $this->putJson("/api/v1/me/businesses/{$business->id}/reviews/{$elsewhere->id}/reply", ['body' => 'Hi'])->assertNotFound();

        $this->getJson("/api/v1/businesses/{$business->slug}/reviews")
            ->assertJsonPath('data.0.owner_reply.body', 'Thank you for visiting!');

        // Moderators can take a reply down.
        $this->actingAsRole(RoleName::Moderator);
        $this->deleteJson("/api/v1/admin/reviews/{$published->id}/reply")->assertOk()->assertJsonPath('data.owner_reply', null);
    }

    public function test_members_save_and_unsave_public_listings(): void
    {
        $business = Business::factory()->create();
        $hidden = Business::factory()->create(['is_published' => false]);
        $event = Event::factory()->create();
        $this->actingAsRole();

        $this->putJson("/api/v1/me/saved/business/{$business->id}")->assertCreated();
        $this->putJson("/api/v1/me/saved/business/{$business->id}")->assertOk();
        $this->putJson("/api/v1/me/saved/business/{$hidden->id}")->assertNotFound();
        $this->putJson("/api/v1/me/saved/user/{$business->id}")->assertNotFound();

        $this->putJson("/api/v1/me/saved/event/{$event->id}")->assertCreated();

        $this->getJson('/api/v1/me/saved/keys')->assertOk()->assertJsonFragment(["business:{$business->id}"]);
        $this->getJson('/api/v1/me/saved?type=business')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.card.title', $business->name);

        // A listing unpublished after saving stays in the list without a card, so it can be removed.
        $business->update(['is_published' => false]);
        $this->getJson('/api/v1/me/saved?type=business')->assertJsonPath('data.0.card', null);

        $this->deleteJson("/api/v1/me/saved/business/{$business->id}")->assertNoContent();
        $this->getJson('/api/v1/me/saved/keys')->assertJsonCount(1, 'data')->assertJsonFragment(["event:{$event->id}"]);

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/me/saved')->assertUnauthorized();
    }
}
