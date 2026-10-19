<?php

namespace App\Enums;

enum PublicationStatus: string
{
    case Draft = 'DRAFT';
    case Review = 'REVIEW';
    case Published = 'PUBLISHED';
    case Archived = 'ARCHIVED';

    /**
     * @return list<self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Draft => [self::Review, self::Published, self::Archived],
            self::Review => [self::Draft, self::Published, self::Archived],
            self::Published => [self::Review, self::Draft, self::Archived],
            self::Archived => [self::Draft, self::Review],
        };
    }

    public function canTransitionTo(self $to): bool
    {
        return in_array($to, $this->allowedTransitions(), true);
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
