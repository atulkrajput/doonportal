<?php

namespace App\Services;

use App\Models\Business;
use App\Models\BusinessHour;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * Opening-hours logic in the city's local time. Hours rows are local wall-clock
 * times; a row whose closes_at is earlier than opens_at runs past midnight.
 */
class OpeningHours
{
    public const TIMEZONE = 'Asia/Kolkata';

    public static function localNow(): CarbonImmutable
    {
        return CarbonImmutable::now(self::TIMEZONE);
    }

    /**
     * Constrain a business query to listings open at the given local time.
     */
    public static function scopeOpenAt(Builder $query, ?CarbonImmutable $at = null): void
    {
        $at = ($at ?? self::localNow())->setTimezone(self::TIMEZONE);
        $date = $at->toDateString();
        $time = $at->format('H:i:s');
        $day = $at->dayOfWeek;
        $prevDay = $at->subDay()->dayOfWeek;

        $query
            ->whereDoesntHave('hourExceptions', fn ($q) => $q->whereDate('date', $date)->where('is_closed', true))
            ->where(fn ($q) => $q
                // A special-hours exception for today decides on its own.
                ->whereHas('hourExceptions', fn ($e) => $e->whereDate('date', $date)->where('is_closed', false)
                    ->where('opens_at', '<=', $time)->where('closes_at', '>', $time))
                ->orWhere(fn ($regular) => $regular
                    ->whereDoesntHave('hourExceptions', fn ($e) => $e->whereDate('date', $date))
                    ->whereHas('hours', fn ($h) => $h->where('is_closed', false)->where(fn ($slot) => $slot
                        // Same-day slot
                        ->where(fn ($s) => $s->where('day_of_week', $day)
                            ->whereColumn('opens_at', '<=', 'closes_at')
                            ->where('opens_at', '<=', $time)->where('closes_at', '>', $time))
                        // Overnight slot that started today
                        ->orWhere(fn ($s) => $s->where('day_of_week', $day)
                            ->whereColumn('opens_at', '>', 'closes_at')
                            ->where('opens_at', '<=', $time))
                        // Overnight slot that started yesterday
                        ->orWhere(fn ($s) => $s->where('day_of_week', $prevDay)
                            ->whereColumn('opens_at', '>', 'closes_at')
                            ->where('closes_at', '>', $time))
                    ))));
    }

    /**
     * Null when the business has no hours on record (unknown, not closed).
     * Requires the hours and hourExceptions relations to be loaded.
     */
    public static function isOpen(Business $business, ?CarbonImmutable $at = null): ?bool
    {
        if ($business->hours->isEmpty()) {
            return null;
        }

        $at = ($at ?? self::localNow())->setTimezone(self::TIMEZONE);
        $time = $at->format('H:i:s');

        $exception = $business->hourExceptions->first(fn ($e) => $e->date->toDateString() === $at->toDateString());
        if ($exception) {
            return ! $exception->is_closed
                && $exception->opens_at !== null
                && $exception->opens_at <= $time && $exception->closes_at > $time;
        }

        $day = $at->dayOfWeek;
        $prevDay = $at->subDay()->dayOfWeek;

        return $business->hours->contains(function (BusinessHour $h) use ($day, $prevDay, $time) {
            if ($h->is_closed || $h->opens_at === null || $h->closes_at === null) {
                return false;
            }
            $overnight = $h->opens_at > $h->closes_at;

            return ($h->day_of_week === $day && ! $overnight && $h->opens_at <= $time && $h->closes_at > $time)
                || ($h->day_of_week === $day && $overnight && $h->opens_at <= $time)
                || ($h->day_of_week === $prevDay && $overnight && $h->closes_at > $time);
        });
    }
}
