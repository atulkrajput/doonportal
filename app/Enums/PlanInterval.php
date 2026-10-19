<?php

namespace App\Enums;

enum PlanInterval: string
{
    case Month = 'MONTH';
    case Year = 'YEAR';
    case OneTime = 'ONE_TIME';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /** Months covered by one billing period (null = no recurring period). */
    public function months(): ?int
    {
        return match ($this) {
            self::Month => 1,
            self::Year => 12,
            self::OneTime => null,
        };
    }
}
