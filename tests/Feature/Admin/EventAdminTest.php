<?php

namespace Tests\Feature\Admin;

use App\Enums\EventStatus;
use App\Enums\RoleName;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Event;
use App\Models\Venue;

class EventAdminTest extends AdminTestCase
{
    public function test_local_times_are_read_in_the_event_time_zone_and_stored_in_utc(): void
    {
        $editor = $this->actingAsRole(RoleName::Editor);
        $venue = Venue::factory()->create();
        $category = Category::factory()->create(['type' => 'event']);
        $date = now('Asia/Kolkata')->addDays(10)->format('Y-m-d');

        $id = $this->postJson('/api/v1/admin/events', [
            'title' => 'Test Evening Concert',
            'starts_at' => "{$date}T18:00",
            'ends_at' => "{$date}T21:30",
            'venue_id' => $venue->id,
            'category_ids' => [$category->id],
            'is_free' => true,
        ])->assertCreated()->assertJsonPath('data.status', 'DRAFT')->json('data.id');

        $event = Event::findOrFail($id);
        $this->assertSame("{$date} 12:30:00", $event->starts_at->utc()->format('Y-m-d H:i:s'));
        $this->assertSame($editor->id, $event->submitted_by);
        $this->assertNotNull($this->lastAudit('event.created'));
    }

    public function test_publish_cancel_with_reason_and_archive(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $event = Event::factory()->create(['status' => EventStatus::Review, 'published_at' => null]);
        $base = "/api/v1/admin/events/{$event->id}/status";

        $this->postJson($base, ['status' => 'PUBLISHED'])->assertOk()->assertJsonPath('data.status', 'PUBLISHED');
        $this->assertNotNull($event->fresh()->published_at);

        $this->postJson($base, ['status' => 'CANCELLED'])->assertUnprocessable()->assertJsonValidationErrors('note');
        $this->postJson($base, ['status' => 'CANCELLED', 'note' => 'Heavy rain forecast'])->assertOk();
        $this->assertSame('Heavy rain forecast', $event->fresh()->cancellation_reason);

        $log = $this->lastAudit('event.status_changed');
        $this->assertSame(['status' => 'PUBLISHED'], $log->old_values);
        $this->assertSame('CANCELLED', $log->new_values['status']);

        $this->postJson($base, ['status' => 'ARCHIVED'])->assertOk();
        $this->postJson($base, ['status' => 'PUBLISHED'])->assertStatus(409);
    }

    public function test_publishing_rejects_implausible_dates(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $event = Event::factory()->create(['status' => EventStatus::Review, 'starts_at' => now()->addYears(3), 'ends_at' => null]);

        $this->postJson("/api/v1/admin/events/{$event->id}/status", ['status' => 'PUBLISHED'])->assertStatus(409);
        $this->assertSame(EventStatus::Review, $event->fresh()->status);
    }

    public function test_rescheduling_a_published_event_keeps_the_original_start(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $originalStart = now()->addDays(5)->startOfHour();
        $event = Event::factory()->create(['status' => EventStatus::Published, 'starts_at' => $originalStart, 'ends_at' => null]);

        // Dates of an announced event cannot be changed through a plain update.
        $this->patchJson("/api/v1/admin/events/{$event->id}", ['starts_at' => now()->addDays(9)->toIso8601String()])
            ->assertUnprocessable()->assertJsonValidationErrors('starts_at');

        $newStart = now()->addDays(12)->startOfHour();
        $this->postJson("/api/v1/admin/events/{$event->id}/reschedule", [
            'starts_at' => $newStart->toIso8601String(), 'reason' => 'Venue change',
        ])->assertOk();

        $fresh = $event->fresh();
        $this->assertTrue($fresh->starts_at->equalTo($newStart));
        $this->assertTrue($fresh->original_starts_at->equalTo($originalStart));

        // A second reschedule keeps the first announced date.
        $this->postJson("/api/v1/admin/events/{$event->id}/reschedule", ['starts_at' => now()->addDays(14)->toIso8601String()])->assertOk();
        $this->assertTrue($event->fresh()->original_starts_at->equalTo($originalStart));

        $log = $this->lastAudit('event.rescheduled');
        $this->assertNotNull($log);
        $this->assertSame(2, AuditLog::where('action', 'event.rescheduled')->count());

        $this->postJson("/api/v1/admin/events/{$event->id}/reschedule", [
            'starts_at' => now()->addDays(20)->toIso8601String(), 'ends_at' => now()->addDays(19)->toIso8601String(),
        ])->assertStatus(409);
    }

    public function test_rescheduling_to_the_same_dates_is_rejected_and_not_audited(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $start = now()->addDays(5)->startOfHour();
        $event = Event::factory()->create(['status' => EventStatus::Published, 'starts_at' => $start, 'ends_at' => null]);

        $this->postJson("/api/v1/admin/events/{$event->id}/reschedule", ['starts_at' => $start->toIso8601String()])
            ->assertUnprocessable()->assertJsonValidationErrors('starts_at');
        $this->assertNull($this->lastAudit('event.rescheduled'));
    }

    public function test_rescheduling_a_draft_does_not_set_original_start(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $event = Event::factory()->create(['status' => EventStatus::Draft]);

        $this->postJson("/api/v1/admin/events/{$event->id}/reschedule", ['starts_at' => now()->addDays(3)->toIso8601String()])->assertOk();
        $this->assertNull($event->fresh()->original_starts_at);
    }

    public function test_event_validation(): void
    {
        $this->actingAsRole(RoleName::Editor);

        $this->postJson('/api/v1/admin/events', [
            'title' => 'Bad',
            'starts_at' => now()->addDay()->toIso8601String(),
            'ends_at' => now()->toIso8601String(),
            'timezone' => 'Mars/Olympus',
            'ticket_url' => 'ftp://tickets',
            'price_min_paise' => 500, 'price_max_paise' => 100,
        ])->assertUnprocessable()->assertJsonValidationErrors(['timezone', 'ticket_url']);

        $this->postJson('/api/v1/admin/events', [
            'title' => 'Bad',
            'starts_at' => now()->addDay()->toIso8601String(),
            'ends_at' => now()->toIso8601String(),
            'price_min_paise' => 500, 'price_max_paise' => 100,
        ])->assertUnprocessable()->assertJsonValidationErrors(['ends_at', 'price_max_paise']);
    }
}
