<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * Stores opens_at/closes_at as zero-padded "HH:MM:SS" so string comparison
 * behaves identically on MySQL, PostgreSQL and SQLite.
 */
trait NormalizesTimes
{
    protected function opensAt(): Attribute
    {
        return Attribute::make(get: fn ($v) => self::normalizeTime($v), set: fn ($v) => self::normalizeTime($v));
    }

    protected function closesAt(): Attribute
    {
        return Attribute::make(get: fn ($v) => self::normalizeTime($v), set: fn ($v) => self::normalizeTime($v));
    }

    private static function normalizeTime(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        [$h, $m, $s] = array_pad(explode(':', (string) $value), 3, '00');

        return sprintf('%02d:%02d:%02d', (int) $h, (int) $m, (int) $s);
    }
}
