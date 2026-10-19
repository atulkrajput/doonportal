<?php

namespace App\Enums;

/**
 * Stored editorial status of an event. The time-based phases UPCOMING, LIVE and
 * COMPLETED are derived from starts_at/ends_at for PUBLISHED events (see
 * Event::phase()) so no cron job has to keep them in sync.
 */
enum EventStatus: string
{
    case Draft = 'DRAFT';
    case Submitted = 'SUBMITTED';
    case Review = 'REVIEW';
    case Published = 'PUBLISHED';
    case Cancelled = 'CANCELLED';
    case Archived = 'ARCHIVED';

    /**
     * @return list<self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Draft => [self::Submitted, self::Review],
            self::Submitted => [self::Review, self::Draft],
            self::Review => [self::Published, self::Draft],
            self::Published => [self::Cancelled, self::Archived, self::Review],
            self::Cancelled => [self::Published, self::Archived],
            self::Archived => [],
        };
    }

    public function canTransitionTo(self $to): bool
    {
        return in_array($to, $this->allowedTransitions(), true);
    }

    /**
     * Statuses visible on the public site (cancelled events stay visible, labelled).
     *
     * @return list<string>
     */
    public static function publicValues(): array
    {
        return [self::Published->value, self::Cancelled->value];
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
