<?php

namespace App\Services;

use App\Enums\BusinessStatus;
use App\Enums\EventStatus;
use App\Exceptions\InvalidStatusTransition;
use App\Models\Business;
use App\Models\Event;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * The only place business verification and event lifecycle statuses change.
 * Every transition is validated, atomic and audited.
 */
class StatusTransitionService
{
    /** Events further in the future than this are almost always a data error (wrong year). */
    public const MAX_EVENT_LEAD_DAYS = 548;

    public function __construct(private readonly AuditLogger $audit) {}

    public function transitionBusiness(Business $business, BusinessStatus $to, ?User $actor = null, ?string $note = null): Business
    {
        $from = $business->status;

        if (! $from->canTransitionTo($to)) {
            throw new InvalidStatusTransition("A business cannot move from {$from->value} to {$to->value}.");
        }

        if ($to === BusinessStatus::Claimed && $business->owner_id === null) {
            throw new InvalidStatusTransition('A business can only be marked CLAIMED once an approved owner is linked.');
        }

        return DB::transaction(function () use ($business, $from, $to, $actor, $note) {
            $business->status = $to;

            if ($to === BusinessStatus::Verified) {
                $business->verified_at = now();
                $business->last_verified_at = now();
            } elseif (! $to->isVerified()) {
                $business->verified_at = null;
            }

            $business->save();

            $this->audit->log('business.status_changed', $business,
                ['status' => $from], ['status' => $to, 'note' => $note], $actor);

            return $business;
        });
    }

    public function transitionEvent(Event $event, EventStatus $to, ?User $actor = null, ?string $note = null): Event
    {
        $from = $event->status;

        if (! $from->canTransitionTo($to)) {
            throw new InvalidStatusTransition("An event cannot move from {$from->value} to {$to->value}.");
        }

        if ($to === EventStatus::Published) {
            $this->assertPublishableDates($event);
        }

        if ($to === EventStatus::Cancelled && blank($note) && blank($event->cancellation_reason)) {
            throw new InvalidStatusTransition('Cancelling an event requires a reason.');
        }

        return DB::transaction(function () use ($event, $from, $to, $actor, $note) {
            $event->status = $to;

            if ($to === EventStatus::Published && $event->published_at === null) {
                $event->published_at = now();
            }

            if ($to === EventStatus::Cancelled && filled($note)) {
                $event->cancellation_reason = $note;
            }

            $event->save();

            $this->audit->log('event.status_changed', $event,
                ['status' => $from], ['status' => $to, 'note' => $note], $actor);

            return $event;
        });
    }

    private function assertPublishableDates(Event $event): void
    {
        if ($event->starts_at === null) {
            throw new InvalidStatusTransition('An event needs a start date and time before it can be published.');
        }

        if ($event->ends_at !== null && $event->ends_at->lt($event->starts_at)) {
            throw new InvalidStatusTransition('An event cannot end before it starts.');
        }

        if ($event->starts_at->gt(now()->addDays(self::MAX_EVENT_LEAD_DAYS))) {
            throw new InvalidStatusTransition('The event start date is implausibly far in the future; check the year.');
        }

        if (! in_array($event->timezone, timezone_identifiers_list(), true)) {
            throw new InvalidStatusTransition("Unknown event time zone [{$event->timezone}].");
        }
    }
}
