<?php

namespace Tests\Feature\Domain;

use App\Enums\BusinessStatus;
use App\Enums\EventStatus;
use App\Enums\RoleName;
use App\Exceptions\InvalidStatusTransition;
use App\Models\Area;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Event;
use App\Models\Favorite;
use App\Models\Place;
use App\Models\Review;
use App\Models\Story;
use App\Models\User;
use App\Services\StatusTransitionService;
use Database\Seeders\AreaSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Database\ClassMorphViolationException;
use Illuminate\Database\Eloquent\MassAssignmentException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoreEntitiesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_reference_seeders_are_idempotent(): void
    {
        $this->seed([AreaSeeder::class, CategorySeeder::class]);
        $areas = Area::count();
        $categories = Category::count();

        $this->seed([AreaSeeder::class, CategorySeeder::class, RolePermissionSeeder::class]);

        $this->assertSame($areas, Area::count());
        $this->assertSame($categories, Category::count());
        $this->assertSame(count(AreaSeeder::AREAS), $areas);
        $this->assertNotNull(Category::firstWhere('slug', 'cafes')?->parent);
    }

    public function test_slugs_are_generated_and_unique(): void
    {
        $a = Business::factory()->create(['name' => 'Doon Cafe']);
        $b = Business::factory()->create(['name' => 'Doon Cafe']);

        $this->assertSame('doon-cafe', $a->slug);
        $this->assertSame('doon-cafe-2', $b->slug);
        $this->assertSame('slug', $a->getRouteKeyName());
    }

    public function test_business_relationships(): void
    {
        $area = Area::factory()->create();
        $category = Category::factory()->create();
        $business = Business::factory()->create(['primary_area_id' => $area->id]);
        $business->areas()->attach($area);
        $business->categories()->attach($category, ['is_primary' => true]);
        $business->hours()->create(['day_of_week' => 1, 'opens_at' => '09:00', 'closes_at' => '18:00']);
        $business->services()->create(['name' => 'Coffee', 'price_min_paise' => 15000]);

        $business->refresh();
        $this->assertTrue($business->primaryArea->is($area));
        $this->assertTrue((bool) $business->categories->first()->pivot->is_primary);
        $this->assertCount(1, $area->businesses);
        $this->assertCount(1, $category->businesses);
        $this->assertSame(15000, $business->services->first()->price_min_paise);
    }

    public function test_polymorphic_types_use_the_allowlisted_aliases(): void
    {
        $user = User::factory()->create();
        $place = Place::factory()->create();
        $favorite = $user->favorites()->create(['favoritable_type' => 'place', 'favoritable_id' => $place->id]);

        $this->assertSame('place', $place->getMorphClass());
        $this->assertTrue($favorite->favoritable->is($place));

        $collection = Collection::factory()->create();
        $collection->items()->create(['item_type' => 'place', 'item_id' => $place->id, 'position' => 1]);
        $this->assertTrue($collection->items->first()->item->is($place));
    }

    public function test_models_outside_the_morph_map_are_rejected(): void
    {
        $this->expectException(ClassMorphViolationException::class);

        (new class extends Model {})->getMorphClass();
    }

    public function test_one_review_and_one_favorite_per_user_per_entity(): void
    {
        $user = User::factory()->create();
        $business = Business::factory()->create();
        Review::factory()->create(['user_id' => $user->id, 'reviewable_id' => $business->id]);

        try {
            Review::factory()->create(['user_id' => $user->id, 'reviewable_id' => $business->id]);
            $this->fail('Duplicate review allowed');
        } catch (QueryException) {
            $this->assertSame(1, Review::count());
        }

        Favorite::forceCreate(['user_id' => $user->id, 'favoritable_type' => 'business', 'favoritable_id' => $business->id]);
        $this->expectException(QueryException::class);
        Favorite::forceCreate(['user_id' => $user->id, 'favoritable_type' => 'business', 'favoritable_id' => $business->id]);
    }

    public function test_business_status_transitions_are_enforced_and_audited(): void
    {
        $service = app(StatusTransitionService::class);
        $admin = User::factory()->withRole(RoleName::Admin)->create();
        $business = Business::factory()->create();

        $this->assertThrows(
            fn () => $service->transitionBusiness($business, BusinessStatus::Verified, $admin),
            InvalidStatusTransition::class
        );

        $service->transitionBusiness($business, BusinessStatus::UnderReview, $admin);
        $service->transitionBusiness($business, BusinessStatus::Verified, $admin, 'Phone and address confirmed');

        $this->assertSame(BusinessStatus::Verified, $business->fresh()->status);
        $this->assertNotNull($business->fresh()->verified_at);
        $this->assertSame(2, AuditLog::where('action', 'business.status_changed')->count());
        $this->assertSame($admin->id, AuditLog::latest('id')->first()->actor_id);

        // CLAIMED requires an owner set through the claim workflow.
        $this->assertThrows(
            fn () => $service->transitionBusiness($business, BusinessStatus::Claimed, $admin),
            InvalidStatusTransition::class
        );
    }

    public function test_business_status_is_not_mass_assignable(): void
    {
        $this->assertNotContains('status', (new Business)->getFillable());
        $this->assertNotContains('owner_id', (new Business)->getFillable());
        $this->assertSame(BusinessStatus::Unverified, (new Business(['name' => 'X']))->status);

        // Outside production, attempts to mass-assign guarded fields fail loudly.
        $this->expectException(MassAssignmentException::class);
        new Business(['name' => 'X', 'status' => 'VERIFIED']);
    }

    public function test_events_cannot_be_published_with_invalid_dates(): void
    {
        $service = app(StatusTransitionService::class);

        $noDate = Event::factory()->create(['status' => EventStatus::Review, 'starts_at' => null, 'ends_at' => null]);
        $this->assertThrows(fn () => $service->transitionEvent($noDate, EventStatus::Published), InvalidStatusTransition::class);

        $backwards = Event::factory()->create(['status' => EventStatus::Review, 'starts_at' => now()->addDay(), 'ends_at' => now()]);
        $this->assertThrows(fn () => $service->transitionEvent($backwards, EventStatus::Published), InvalidStatusTransition::class);

        $wrongYear = Event::factory()->create(['status' => EventStatus::Review, 'starts_at' => now()->addYears(5), 'ends_at' => null]);
        $this->assertThrows(fn () => $service->transitionEvent($wrongYear, EventStatus::Published), InvalidStatusTransition::class);

        $ok = Event::factory()->create(['status' => EventStatus::Review, 'published_at' => null]);
        $service->transitionEvent($ok, EventStatus::Published);
        $this->assertNotNull($ok->fresh()->published_at);

        $this->assertThrows(fn () => $service->transitionEvent($ok, EventStatus::Cancelled), InvalidStatusTransition::class);
        $service->transitionEvent($ok, EventStatus::Cancelled, null, 'Venue unavailable');
        $this->assertSame('Venue unavailable', $ok->fresh()->cancellation_reason);
    }

    public function test_event_phase_is_derived_from_time(): void
    {
        $event = Event::factory()->make(['starts_at' => now()->addHour(), 'ends_at' => now()->addHours(3)]);
        $this->assertSame('UPCOMING', $event->phase());
        $this->assertSame('LIVE', $event->phase(now()->addHours(2)));
        $this->assertSame('COMPLETED', $event->phase(now()->addHours(4)));
    }

    public function test_policies_enforce_public_visibility_and_permissions(): void
    {
        $guestHidden = Business::factory()->create(['is_published' => false]);
        $suspended = Business::factory()->create(['status' => BusinessStatus::Suspended]);
        $public = Business::factory()->create();
        $draftStory = Story::factory()->create(['status' => 'DRAFT']);

        $user = User::factory()->withRole(RoleName::User)->create();
        $editor = User::factory()->withRole(RoleName::Editor)->create();
        $owner = User::factory()->withRole(RoleName::BusinessOwner)->create();
        $guestHidden->forceFill(['owner_id' => $owner->id])->save();

        $this->assertTrue($user->can('view', $public));
        $this->assertFalse($user->can('view', $guestHidden));
        $this->assertFalse($user->can('view', $suspended));
        $this->assertFalse($user->can('view', $draftStory));
        $this->assertFalse($user->can('update', $public));

        $this->assertTrue($editor->can('view', $guestHidden));
        $this->assertTrue($editor->can('update', $public));
        $this->assertTrue($editor->can('view', $draftStory));

        $this->assertTrue($owner->can('update', $guestHidden));
        $this->assertFalse($owner->can('update', $public));
        $this->assertFalse($owner->can('changeStatus', $guestHidden));

        $super = User::factory()->withRole(RoleName::SuperAdmin)->create();
        $this->assertTrue($super->can('changeStatus', $public));
    }
}
