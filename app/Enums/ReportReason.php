<?php

namespace App\Enums;

enum ReportReason: string
{
    case IncorrectInfo = 'INCORRECT_INFO';
    case PermanentlyClosed = 'PERMANENTLY_CLOSED';
    case Duplicate = 'DUPLICATE';
    case Spam = 'SPAM';
    case Inappropriate = 'INAPPROPRIATE';
    case Other = 'OTHER';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
