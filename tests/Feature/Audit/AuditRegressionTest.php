<?php

namespace Tests\Feature\Audit;

use App\Enums\BusinessStatus;
use App\Enums\EventStatus;
use App\Models\Business;
use App\Models\Event;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\AreaSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Scenarios from the 2026-10-20 feature audit (docs/qa) that the existing
 * suites did not exercise, plus regression tests for defects fixed in it.
 */
class AuditRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RolePermissionSeeder::class, AreaSeeder::class, CategorySeeder::class]);
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_expired_and_invalid_tokens_are_rejected_with_json_401(): void
    {
        $user = User::factory()->create();
        $expired = $user->createToken('web', expiresAt: now()->subMinute())->plainTextToken;

        $this->withToken($expired)->getJson('/api/v1/me')->assertUnauthorized()->assertJsonStructure(['message']);
        $this->app['auth']->forgetGuards();
        $this->withToken('1|not-a-real-token')->getJson('/api/v1/me')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withToken('garbage')->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
    }

    public function test_tokens_of_deleted_users_stop_working(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('web')->plainTextToken;
        $user->delete();

        $this->withToken($token)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_server_errors_do_not_expose_stack_traces_when_debug_is_off(): void
    {
        config(['app.debug' => false]);
        Route::get('/api/v1/__audit-boom', fn () => throw new \RuntimeException('secret-db-password-in-message'));

        $response = $this->getJson('/api/v1/__audit-boom')->assertStatus(500);

        $this->assertSame(['message' => 'Server Error'], $response->json());
        $this->assertStringNotContainsString('secret-db-password', $response->getContent());
    }

    public function test_injection_shaped_search_input_is_treated_as_text(): void
    {
        Business::factory()->create(['name' => "Joe's 100% Cafe"]);

        $this->getJson('/api/v1/businesses?q='.urlencode("' OR 1=1 --"))->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/businesses?q='.urlencode('100%'))->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/businesses?q='.urlencode('_'))->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/search?q='.urlencode('<script>alert(1)</script>'))
            ->assertOk()->assertJsonPath('total', 0);
    }

    public function test_closed_businesses_stay_visible_and_labelled_while_suspended_ones_are_hidden(): void
    {
        $closed = Business::factory()->create(['status' => BusinessStatus::Closed]);
        $suspended = Business::factory()->create(['status' => BusinessStatus::Suspended]);

        $this->getJson("/api/v1/businesses/{$closed->slug}")->assertOk()
            ->assertJsonPath('data.status', 'CLOSED')->assertJsonPath('data.is_verified', false);
        $this->getJson("/api/v1/businesses/{$suspended->slug}")->assertNotFound();
    }

    public function test_cancelled_events_are_labelled_and_missing_venue_or_tickets_do_not_break_the_page(): void
    {
        $event = Event::factory()->create([
            'status' => EventStatus::Cancelled, 'cancellation_reason' => 'Rain',
            'venue_id' => null, 'organizer_id' => null, 'ticket_url' => null, 'area_id' => null,
        ]);

        $this->getJson("/api/v1/events/{$event->slug}")->assertOk()
            ->assertJsonPath('data.phase', 'CANCELLED')
            ->assertJsonPath('data.is_cancelled', true)
            ->assertJsonPath('data.cancellation_reason', 'Rain')
            ->assertJsonPath('data.venue', null)
            ->assertJsonPath('data.ticket_url', null);
    }

    public function test_past_events_are_not_listed_as_upcoming(): void
    {
        Event::factory()->create(['title' => 'Old show', 'starts_at' => now()->subDays(3), 'ends_at' => now()->subDays(3)->addHours(2)]);
        Event::factory()->create(['title' => 'Next show']);

        $this->getJson('/api/v1/events')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'Next show');
        $this->getJson('/api/v1/events?include_past=1')->assertOk()->assertJsonCount(2, 'data');
    }

    /**
     * Regression: an all-day event without an end time used the 6-hour default
     * window, so it showed as COMPLETED and vanished from listings at 06:00 on the day.
     */
    public function test_all_day_events_without_an_end_last_the_whole_local_day(): void
    {
        $day = CarbonImmutable::parse('2026-11-14 00:00', 'Asia/Kolkata');
        $event = Event::factory()->create(['title' => 'Harvest fair', 'is_all_day' => true, 'starts_at' => $day->utc(), 'ends_at' => null]);

        CarbonImmutable::setTestNow($day->setTime(15, 0));
        $this->travelTo($day->setTime(15, 0));

        $this->assertSame('LIVE', $event->fresh()->phase());
        $this->getJson('/api/v1/events')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.phase', 'LIVE');

        $this->travelTo($day->addDay()->setTime(0, 30));
        $this->assertSame('COMPLETED', $event->fresh()->phase());
        $this->getJson('/api/v1/events')->assertOk()->assertJsonCount(0, 'data');
    }

    /**
     * Regression: the date-window filters (today, week, …) dropped an event that had
     * started but had no end time, although the default listing showed it as LIVE.
     */
    public function test_date_window_filters_keep_events_that_are_live_now(): void
    {
        $now = CarbonImmutable::parse('2026-11-14 19:00', 'Asia/Kolkata');
        $this->travelTo($now);
        Event::factory()->create(['title' => 'Open mic', 'starts_at' => $now->subHour()->utc(), 'ends_at' => null]);

        $this->getJson('/api/v1/events')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.phase', 'LIVE');
        $this->getJson('/api/v1/events?when=today')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/events?when=week')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_analytics_does_not_reveal_whether_hidden_records_exist(): void
    {
        $hidden = Business::factory()->create(['is_published' => false]);
        $public = Business::factory()->create();

        $this->postJson('/api/v1/analytics/events', ['name' => 'business_viewed', 'entity_type' => 'business', 'entity_id' => $public->id])
            ->assertStatus(202);
        $this->postJson('/api/v1/analytics/events', ['name' => 'business_viewed', 'entity_type' => 'business', 'entity_id' => $hidden->id])
            ->assertStatus(422);
        $this->assertDatabaseMissing('analytics_events', ['entity_id' => $hidden->id]);
    }
}
