<?php

namespace App\Enums;

enum SubscriptionStatus: string
{
    case Pending = 'PENDING';
    case Active = 'ACTIVE';
    case Cancelled = 'CANCELLED';
    case Expired = 'EXPIRED';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
