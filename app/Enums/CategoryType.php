<?php

namespace App\Enums;

enum CategoryType: string
{
    case Business = 'business';
    case Place = 'place';
    case Event = 'event';
    case Story = 'story';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
