<?php

namespace App\Enums;

enum ReviewStatus: string
{
    case Pending = 'PENDING';
    case Published = 'PUBLISHED';
    case Rejected = 'REJECTED';
    case Hidden = 'HIDDEN';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
