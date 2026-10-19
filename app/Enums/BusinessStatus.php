<?php

namespace App\Enums;

/**
 * Verification lifecycle of a business listing. Public visibility is a separate
 * flag (businesses.is_published); SUSPENDED listings are never public.
 */
enum BusinessStatus: string
{
    case Unverified = 'UNVERIFIED';
    case Submitted = 'SUBMITTED';
    case UnderReview = 'UNDER_REVIEW';
    case Verified = 'VERIFIED';
    case Claimed = 'CLAIMED';
    case Suspended = 'SUSPENDED';
    case Closed = 'CLOSED';

    /**
     * @return list<self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Unverified => [self::Submitted, self::UnderReview, self::Suspended, self::Closed],
            self::Submitted => [self::UnderReview, self::Unverified, self::Suspended],
            self::UnderReview => [self::Verified, self::Unverified, self::Suspended],
            self::Verified => [self::Claimed, self::UnderReview, self::Unverified, self::Suspended, self::Closed],
            self::Claimed => [self::Verified, self::UnderReview, self::Suspended, self::Closed],
            self::Suspended => [self::UnderReview, self::Unverified],
            self::Closed => [self::UnderReview],
        };
    }

    public function canTransitionTo(self $to): bool
    {
        return in_array($to, $this->allowedTransitions(), true);
    }

    /**
     * Statuses that carry a public "verified" badge.
     */
    public function isVerified(): bool
    {
        return $this === self::Verified || $this === self::Claimed;
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
