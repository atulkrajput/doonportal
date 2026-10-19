<?php

namespace App\Enums;

enum SubmissionStatus: string
{
    case Pending = 'PENDING';
    case NeedsInfo = 'NEEDS_INFO';
    case Approved = 'APPROVED';
    case Rejected = 'REJECTED';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
