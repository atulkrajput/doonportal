<?php

namespace App\Enums;

enum ReportStatus: string
{
    case Open = 'OPEN';
    case Resolved = 'RESOLVED';
    case Dismissed = 'DISMISSED';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
