<?php

namespace Tests\Feature\Api;

use App\Enums\BusinessStatus;
use App\Enums\EventStatus;
use App\Enums\PublicationStatus;
use App\Enums\RoleName;
use App\Models\Area;
use App\Models\Business;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Event;
use App\Models\Place;
use App\Models\Review;
use App\Models\Story;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\AreaSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\DemoDataSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DiscoveryApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RolePermissionSeeder::class, AreaSeeder::class, CategorySeeder::class]);
    }

    public function test_business_list_only_shows_public_listings_with_pagination_meta(): void
    {
        Business::factory()->count(3)->create();
        Business::factory()->create(['is_published' => false]);
        Business::factory()->create(['status' => BusinessStatus::Suspended]);

        $this->getJson('/api/v1/businesses')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.per_page', 20)
            ->assertJsonStructure(['data' => [['id', 'name', 'slug', 'is_verified', 'rating', 'open_now', 'categories']], 'links', 'meta']);
    }

    public function test_pagination_is_capped_and_sort_is_allowlisted(): void
    {
        $this->getJson('/api/v1/businesses?per_page=500')->assertUnprocessable()->assertJsonValidationErrors('per_page');
        $this->getJson('/api/v1/businesses?sort=name;DROP TABLE users')->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->getJson('/api/v1/businesses?per_page=100&sort=rating')->assertOk();
    }

    public function test_filters_by_category_including_children_area_price_and_rating(): void
    {
        $food = Category::firstWhere('slug', 'food-drink');
        $cafes = Category::firstWhere('slug', 'cafes');
        $gyms = Category::firstWhere('slug', 'gyms');
        $rajpur = Area::firstWhere('slug', 'rajpur-road');

        $cafe = Business::factory()->create(['name' => 'Alpha Cafe', 'price_range' => 1, 'primary_area_id' => $rajpur->id]);
        $cafe->forceFill(['rating_avg' => 4.6])->save();
        $cafe->categories()->attach($cafes);
        $gym = Business::factory()->create(['name' => 'Beta Gym', 'price_range' => 3]);
        $gym->categories()->attach($gyms);

        $this->getJson('/api/v1/businesses?category=food-drink')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Alpha Cafe');
        $this->getJson('/api/v1/businesses?category=cafes')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/businesses?area=rajpur-road')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/businesses?area=unknown-area')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/businesses?price=3')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Beta Gym');
        $this->getJson('/api/v1/businesses?price[]=1&price[]=3')->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/businesses?min_rating=4.5')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/businesses?q=alpha')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/businesses?q=50%25')->assertJsonCount(0, 'data');
        $this->assertNotNull($food);
    }

    public function test_open_now_uses_local_time_and_overnight_hours(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-20 23:30', 'Asia/Kolkata')); // Tuesday

        $dayShop = Business::factory()->create(['name' => 'Day Shop']);
        $dayShop->hours()->create(['day_of_week' => 2, 'opens_at' => '09:00', 'closes_at' => '18:00']);
        $lateBar = Business::factory()->create(['name' => 'Late Bar']);
        $lateBar->hours()->create(['day_of_week' => 2, 'opens_at' => '18:00', 'closes_at' => '02:00']);
        $holiday = Business::factory()->create(['name' => 'Holiday Bar']);
        $holiday->hours()->create(['day_of_week' => 2, 'opens_at' => '18:00', 'closes_at' => '02:00']);
        $holiday->hourExceptions()->create(['date' => '2026-10-20', 'is_closed' => true]);
        Business::factory()->create(['name' => 'No Hours']);

        $this->getJson('/api/v1/businesses?open_now=1')
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Late Bar')->assertJsonPath('data.0.open_now', true);

        // Past midnight, the overnight slot that began Tuesday is still open on Wednesday.
        $this->travelTo(CarbonImmutable::parse('2026-10-21 01:00', 'Asia/Kolkata'));
        $this->getJson('/api/v1/businesses?open_now=1')->assertJsonCount(2, 'data');

        $this->getJson('/api/v1/businesses/no-hours')->assertJsonPath('data.open_now', null);
    }

    public function test_business_detail_hides_unpublished_records_with_404(): void
    {
        $hidden = Business::factory()->create(['is_published' => false]);
        $public = Business::factory()->create();
        $public->socialLinks()->create(['platform' => 'instagram', 'url' => 'https://instagram.com/example']);

        $this->getJson("/api/v1/businesses/{$hidden->slug}")->assertNotFound();
        $this->getJson("/api/v1/businesses/{$hidden->slug}/reviews")->assertNotFound();
        $this->getJson('/api/v1/businesses/does-not-exist')->assertNotFound()->assertJsonStructure(['message']);

        $this->getJson("/api/v1/businesses/{$public->slug}")
            ->assertOk()
            ->assertJsonPath('data.social_links.0.platform', 'instagram')
            ->assertJsonMissingPath('data.owner_id')
            ->assertJsonMissingPath('data.metadata');

        $editor = User::factory()->withRole(RoleName::Editor)->create();
        $this->withToken($editor->createToken('t')->plainTextToken)
            ->getJson("/api/v1/businesses/{$hidden->slug}")->assertOk();
    }

    public function test_business_subresources(): void
    {
        $business = Business::factory()->create();
        $business->services()->create(['name' => 'Espresso', 'price_min_paise' => 12000]);
        $business->offers()->create(['title' => 'Current', 'ends_at' => now()->addWeek()]);
        $business->offers()->create(['title' => 'Expired', 'ends_at' => now()->subDay()]);
        Review::factory()->create(['reviewable_id' => $business->id]);
        Review::factory()->create(['reviewable_id' => $business->id, 'status' => 'PENDING']);
        $sibling = Business::factory()->create();
        $cafes = Category::firstWhere('slug', 'cafes');
        $business->categories()->attach($cafes);
        $sibling->categories()->attach($cafes);

        $this->getJson("/api/v1/businesses/{$business->slug}/services")->assertJsonPath('data.0.price_min_paise', 12000);
        $this->getJson("/api/v1/businesses/{$business->slug}/offers")->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'Current');
        $this->getJson("/api/v1/businesses/{$business->slug}/reviews")->assertJsonCount(1, 'data')
            ->assertJsonMissingPath('data.0.author.email');
        $this->getJson("/api/v1/businesses/{$business->slug}/photos")->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/businesses/{$business->slug}/related")->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $sibling->id);
    }

    public function test_events_list_upcoming_public_events_in_local_time(): void
    {
        $upcoming = Event::factory()->create(['starts_at' => now()->addDays(2), 'ends_at' => now()->addDays(2)->addHours(2)]);
        Event::factory()->create(['starts_at' => now()->subDays(3), 'ends_at' => now()->subDays(3)->addHours(2)]);
        Event::factory()->create(['status' => EventStatus::Draft]);
        $cancelled = Event::factory()->create(['status' => EventStatus::Cancelled, 'cancellation_reason' => 'Rain', 'starts_at' => now()->addDays(4), 'ends_at' => now()->addDays(4)->addHour()]);

        $this->getJson('/api/v1/events')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $upcoming->id)
            ->assertJsonPath('data.0.timezone', 'Asia/Kolkata')
            ->assertJsonPath('data.1.is_cancelled', true);

        $this->assertStringEndsWith('+05:30', $this->getJson('/api/v1/events')->json('data.0.starts_at'));
        $this->getJson('/api/v1/events?include_past=1')->assertJsonCount(3, 'data');
        $this->getJson('/api/v1/events?free=0')->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/events/{$cancelled->slug}")->assertOk()->assertJsonPath('data.cancellation_reason', 'Rain');
        $this->getJson('/api/v1/events?to=2020-01-01&from=2021-01-01')->assertUnprocessable();
    }

    public function test_event_date_window_filters(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-21 10:00', 'Asia/Kolkata')); // Wednesday
        $today = Event::factory()->create(['starts_at' => CarbonImmutable::parse('2026-10-21 18:00', 'Asia/Kolkata'), 'ends_at' => null]);
        $weekend = Event::factory()->create(['starts_at' => CarbonImmutable::parse('2026-10-24 18:00', 'Asia/Kolkata'), 'ends_at' => null]);

        $this->getJson('/api/v1/events?when=today')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $today->id);
        $this->getJson('/api/v1/events?when=weekend')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $weekend->id);
        $this->getJson('/api/v1/events?from=2026-10-24&to=2026-10-24')->assertJsonCount(1, 'data');
    }

    public function test_places_stories_and_collections_respect_publication(): void
    {
        $place = Place::factory()->create();
        Place::factory()->create(['status' => PublicationStatus::Draft]);
        $story = Story::factory()->create();
        Story::factory()->create(['published_at' => now()->addDay()]); // scheduled
        $story->entityLinks()->create(['entity_type' => 'place', 'entity_id' => $place->id]);
        $hiddenPlace = Place::factory()->create(['status' => PublicationStatus::Draft]);
        $story->entityLinks()->create(['entity_type' => 'place', 'entity_id' => $hiddenPlace->id]);

        $collection = Collection::factory()->create();
        $collection->items()->create(['item_type' => 'place', 'item_id' => $place->id, 'position' => 1, 'note' => 'Great at dusk']);
        $collection->items()->create(['item_type' => 'place', 'item_id' => $hiddenPlace->id, 'position' => 2]);

        $this->getJson('/api/v1/places')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/stories')->assertJsonCount(1, 'data')->assertJsonMissingPath('data.0.body');
        $this->getJson("/api/v1/stories/{$story->slug}")
            ->assertOk()->assertJsonPath('data.body', $story->body)
            ->assertJsonCount(1, 'data.linked_entities')
            ->assertJsonPath('data.linked_entities.0.path', "/place/{$place->slug}");
        $this->getJson("/api/v1/collections/{$collection->slug}")
            ->assertOk()->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.note', 'Great at dusk')
            ->assertJsonPath('data.items.0.entity.type', 'place');
        $this->getJson("/api/v1/places/{$hiddenPlace->slug}")->assertNotFound();
    }

    public function test_areas_and_categories(): void
    {
        $rajpur = Area::firstWhere('slug', 'rajpur-road');
        $b = Business::factory()->create(['primary_area_id' => $rajpur->id]);
        $b->areas()->attach($rajpur);
        $story = Story::factory()->create();
        $story->entityLinks()->create(['entity_type' => 'area', 'entity_id' => $rajpur->id]);

        $this->getJson('/api/v1/areas')->assertOk()->assertJsonCount(count(AreaSeeder::AREAS), 'data');
        $this->getJson('/api/v1/areas/rajpur-road')->assertOk()->assertJsonPath('data.counts.businesses', 1);
        $this->getJson('/api/v1/areas/rajpur-road/businesses')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/areas/rajpur-road/places')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/areas/rajpur-road/events')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/areas/rajpur-road/stories')->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/categories?type=business')->assertOk()
            ->assertJsonPath('data.0.slug', 'food-drink')
            ->assertJsonPath('data.0.children.1.slug', 'cafes');
        $this->getJson('/api/v1/categories?type=bogus')->assertUnprocessable();
        $this->getJson('/api/v1/categories/cafes')->assertJsonPath('data.parent.slug', 'food-drink');
    }

    public function test_search_groups_results_by_type(): void
    {
        Business::factory()->create(['name' => 'Mountain Coffee House']);
        Place::factory()->create(['name' => 'Mountain View Point']);
        Event::factory()->create(['title' => 'Mountain Music Night']);
        Business::factory()->create(['name' => 'Hidden Mountain', 'is_published' => false]);

        $this->getJson('/api/v1/search?q=mountain')
            ->assertOk()
            ->assertJsonPath('total', 3)
            ->assertJsonCount(1, 'results.business')
            ->assertJsonPath('results.business.0.path', '/business/mountain-coffee-house');

        $this->getJson('/api/v1/search?q=mountain&types=place')->assertJsonPath('total', 1);
        $this->getJson('/api/v1/search?q=a')->assertUnprocessable();
    }

    public function test_home_returns_all_sections_and_empty_arrays_without_data(): void
    {
        $this->getJson('/api/v1/home')
            ->assertOk()
            ->assertJsonStructure(['data' => ['happening', 'popular', 'new_in_doon', 'eat', 'places', 'stories', 'collections', 'areas', 'explore_categories', 'map_preview']])
            ->assertJsonCount(0, 'data.popular')
            ->assertJsonCount(0, 'data.happening');
    }

    public function test_demo_seeder_content_is_flagged_and_visible(): void
    {
        $this->seed(DemoDataSeeder::class);
        $this->seed(DemoDataSeeder::class); // idempotent

        $this->assertSame(0, Business::whereNot('metadata->demo', true)->count());
        $this->assertSame(0, Business::where('status', '!=', BusinessStatus::Unverified->value)->count());

        $home = $this->getJson('/api/v1/home')->assertOk();
        $this->assertNotEmpty($home->json('data.popular'));
        $this->assertNotEmpty($home->json('data.happening'));
        $this->assertNotEmpty($home->json('data.eat'));
        $this->assertTrue($home->json('data.popular.0.is_demo'));
        $this->assertFalse($home->json('data.popular.0.is_verified'));
    }

    public function test_analytics_accepts_allowlisted_events_only(): void
    {
        $business = Business::factory()->create();

        $this->postJson('/api/v1/analytics/events', [
            'name' => 'business_phone_clicked',
            'entity_type' => 'business',
            'entity_id' => $business->id,
            'properties' => ['source' => 'detail'],
        ])->assertStatus(202);

        $this->postJson('/api/v1/analytics/events', ['name' => 'drop_tables'])->assertUnprocessable();
        $this->postJson('/api/v1/analytics/events', ['name' => 'business_viewed', 'entity_type' => 'user', 'entity_id' => $business->id])->assertUnprocessable();
        $this->postJson('/api/v1/analytics/events', ['name' => 'business_viewed', 'properties' => ['nested' => ['x' => 1]]])->assertUnprocessable();

        $row = DB::table('analytics_events')->first();
        $this->assertSame('business', $row->entity_type);
        $this->assertSame(64, strlen($row->session_hash));
        $this->assertStringNotContainsString('127.0.0.1', (string) $row->properties);
    }
}
