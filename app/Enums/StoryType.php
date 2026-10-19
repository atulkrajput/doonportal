<?php

namespace App\Enums;

enum StoryType: string
{
    case Story = 'STORY';
    case Guide = 'GUIDE';
    case List = 'LIST';
    case News = 'NEWS';
    case Interview = 'INTERVIEW';
    case Heritage = 'HERITAGE';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
