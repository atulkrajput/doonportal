<?php

namespace Tests\Feature\Admin;

use App\Enums\BusinessStatus;
use App\Enums\RoleName;
use App\Models\Area;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\Category;

class BusinessAdminTest extends AdminTestCase
{
    private function payload(array $overrides = []): array
    {
        $cafe = Category::factory()->create(['type' => 'business']);
        $bakery = Category::factory()->create(['type' => 'business']);
        $area = Area::factory()->create();

        return array_merge([
            'name' => 'Test Corner Cafe',
            'tagline' => 'Fictional cafe for tests',
            'is_published' => true,
            'primary_area_id' => $area->id,
            'latitude' => 30.33,
            'longitude' => 78.04,
            'phone' => '+91 135 000 0000',
            'website' => 'https://example.test',
            'price_range' => 2,
            'amenities' => ['wifi', 'parking'],
            'category_ids' => [$cafe->id, $bakery->id],
            'primary_category_id' => $bakery->id,
            'area_ids' => [$area->id],
            'hours' => [
                ['day_of_week' => 1, 'opens_at' => '09:00', 'closes_at' => '18:00'],
                ['day_of_week' => 5, 'opens_at' => '18:00', 'closes_at' => '01:00'],
                ['day_of_week' => 0, 'is_closed' => true],
            ],
            'services' => [['name' => 'Coffee', 'price_min_paise' => 8000, 'price_max_paise' => 20000]],
            'social_links' => [['platform' => 'instagram', 'url' => 'https://instagram.example/test']],
        ], $overrides);
    }

    public function test_editor_creates_a_business_with_children_and_it_is_audited(): void
    {
        $editor = $this->actingAsRole(RoleName::Editor);
        $payload = $this->payload();

        $id = $this->postJson('/api/v1/admin/businesses', $payload)
            ->assertCreated()
            ->assertJsonPath('data.name', 'Test Corner Cafe')
            ->assertJsonPath('data.slug', 'test-corner-cafe')
            ->assertJsonPath('data.status', 'UNVERIFIED')
            ->assertJsonCount(3, 'data.hours')
            ->assertJsonCount(1, 'data.services')
            ->assertJsonCount(2, 'data.categories')
            ->json('data.id');

        $business = Business::findOrFail($id);
        $this->assertSame($payload['primary_category_id'], $business->categories()->wherePivot('is_primary', true)->value('categories.id'));
        $this->assertSame('01:00:00', $business->hours()->where('day_of_week', 5)->value('closes_at'));
        $this->assertNull($business->hours()->where('day_of_week', 0)->value('opens_at'));

        $log = $this->lastAudit('business.created');
        $this->assertSame($editor->id, $log->actor_id);
        $this->assertSame($id, $log->auditable_id);
        $this->assertSame('Test Corner Cafe', $log->new_values['name']);
        $this->assertCount(2, $log->new_values['category_ids']);
        $this->assertCount(3, $log->new_values['hours']);
    }

    public function test_update_audits_only_changed_fields_and_noop_is_not_logged(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $business = Business::factory()->create(['name' => 'Old Name', 'tagline' => 'Same']);

        $this->patchJson("/api/v1/admin/businesses/{$business->id}", ['name' => 'New Name', 'tagline' => 'Same'])->assertOk();

        $log = $this->lastAudit('business.updated');
        $this->assertSame(['name' => 'Old Name'], $log->old_values);
        $this->assertSame(['name' => 'New Name'], $log->new_values);
        $this->assertSame('old-name', $business->fresh()->slug, 'Renaming keeps the slug stable.');

        $this->patchJson("/api/v1/admin/businesses/{$business->id}", ['name' => 'New Name'])->assertOk();
        $this->assertSame(1, AuditLog::where('action', 'business.updated')->count());
    }

    public function test_protected_fields_cannot_be_set_through_create_or_update(): void
    {
        $this->actingAsRole(RoleName::Admin);
        $other = $this->userWithRole();
        $business = Business::factory()->create();

        $this->patchJson("/api/v1/admin/businesses/{$business->id}", [
            'status' => 'VERIFIED', 'verified_at' => now()->toIso8601String(), 'owner_id' => $other->id,
            'rating_avg' => 5, 'rating_count' => 999, 'metadata' => ['demo' => false],
        ])->assertOk();

        $fresh = $business->fresh();
        $this->assertSame(BusinessStatus::Unverified, $fresh->status);
        $this->assertNull($fresh->verified_at);
        $this->assertNull($fresh->owner_id);
        $this->assertSame(0, $fresh->rating_count);
    }

    public function test_validation_rejects_bad_input(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $placeCategory = Category::factory()->create(['type' => 'place']);
        $taken = Business::factory()->create();

        $this->postJson('/api/v1/admin/businesses', [])->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->postJson('/api/v1/admin/businesses', $this->payload([
            'category_ids' => [$placeCategory->id],
            'primary_category_id' => $placeCategory->id,
            'latitude' => 12.97, 'longitude' => 77.59,
            'website' => 'javascript:alert(1)',
            'slug' => $taken->slug,
            'hours' => [['day_of_week' => 7, 'opens_at' => '25:00', 'closes_at' => '10:00']],
            'social_links' => [['platform' => 'myspace', 'url' => 'https://x.test']],
            'services' => [['name' => 'X', 'price_min_paise' => 500, 'price_max_paise' => 100]],
        ]))->assertUnprocessable()->assertJsonValidationErrors([
            'category_ids.0', 'latitude', 'website', 'slug', 'hours.0.day_of_week', 'hours.0.opens_at',
            'social_links.0.platform', 'services.0.price_max_paise',
        ]);
        $this->assertSame(1, Business::count());
    }

    public function test_verification_goes_through_the_status_service(): void
    {
        $editor = $this->actingAsRole(RoleName::Editor);
        $business = Business::factory()->create();

        $this->postJson("/api/v1/admin/businesses/{$business->id}/status", ['status' => 'VERIFIED'])
            ->assertStatus(409);
        $this->postJson("/api/v1/admin/businesses/{$business->id}/status", ['status' => 'UNDER_REVIEW'])->assertOk();
        $this->postJson("/api/v1/admin/businesses/{$business->id}/status", ['status' => 'VERIFIED', 'note' => 'Visited in person'])
            ->assertOk()->assertJsonPath('data.status', 'VERIFIED');

        $this->assertNotNull($business->fresh()->verified_at);
        $log = $this->lastAudit('business.status_changed');
        $this->assertSame($editor->id, $log->actor_id);
        $this->assertSame(['status' => 'UNDER_REVIEW'], $log->old_values);
        $this->assertSame('Visited in person', $log->new_values['note']);

        $this->postJson("/api/v1/admin/businesses/{$business->id}/status", ['status' => 'CLAIMED'])->assertStatus(409);
        $this->postJson("/api/v1/admin/businesses/{$business->id}/status", ['status' => 'NOPE'])->assertUnprocessable();
    }

    public function test_delete_and_restore_are_soft_and_audited(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $business = Business::factory()->create();

        $this->deleteJson("/api/v1/admin/businesses/{$business->id}")->assertNoContent();
        $this->assertSoftDeleted($business);
        $this->getJson("/api/v1/businesses/{$business->slug}")->assertNotFound();

        $this->getJson('/api/v1/admin/businesses?trashed=only')->assertOk()->assertJsonCount(1, 'data');
        $this->postJson("/api/v1/admin/businesses/{$business->id}/restore")->assertOk()->assertJsonPath('data.is_trashed', false);

        $this->assertNotNull($this->lastAudit('business.deleted'));
        $this->assertNotNull($this->lastAudit('business.restored'));
    }

    public function test_listing_filters_and_paginates(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $area = Area::factory()->create();
        Business::factory()->count(3)->create(['is_published' => false]);
        Business::factory()->create(['name' => 'Findable 100% Bakery', 'primary_area_id' => $area->id, 'is_published' => true]);

        $this->getJson('/api/v1/admin/businesses?per_page=2')->assertOk()
            ->assertJsonCount(2, 'data')->assertJsonPath('meta.total', 4);
        $this->getJson('/api/v1/admin/businesses?q=100%25')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/v1/admin/businesses?area_id={$area->id}")->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/admin/businesses?is_published=0')->assertOk()->assertJsonCount(3, 'data');
        $this->getJson('/api/v1/admin/businesses?status=BOGUS')->assertUnprocessable();
        $this->getJson('/api/v1/admin/businesses?sort=rating_avg')->assertUnprocessable();
        $this->getJson('/api/v1/admin/businesses?per_page=500')->assertUnprocessable();
    }
}
