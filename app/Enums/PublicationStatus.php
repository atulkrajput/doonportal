<?php

namespace App\Enums;

enum PublicationStatus: string
{
    case Draft = 'DRAFT';
    case Review = 'REVIEW';
    case Published = 'PUBLISHED';
    case Archived = 'ARCHIVED';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
