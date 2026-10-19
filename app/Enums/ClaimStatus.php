<?php

namespace App\Enums;

enum ClaimStatus: string
{
    case Pending = 'PENDING';
    case Approved = 'APPROVED';
    case Rejected = 'REJECTED';
    case Cancelled = 'CANCELLED';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
