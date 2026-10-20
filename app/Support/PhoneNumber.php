<?php

namespace App\Support;

/**
 * Phone numbers with a country code. Numbers are stored in E.164
 * (+919876543210) alongside the ISO country they were entered for.
 *
 * The country list (resources/data/countries.json, shared with the React
 * forms) holds each country's dial code and, for common countries, a pattern
 * for mobile numbers. Elsewhere any 6–13 digit national number is accepted.
 */
class PhoneNumber
{
    public const DEFAULT_COUNTRY = 'IN';

    /** Countries where a leading 0 is part of the number, not a trunk prefix. */
    private const KEEP_LEADING_ZERO = ['IT', 'SM', 'VA'];

    /** @var array<string, array{name: string, dial: string, pattern: ?string}>|null */
    private static ?array $countries = null;

    /**
     * @return array<string, array{name: string, dial: string, pattern: ?string}>
     */
    public static function countries(): array
    {
        if (self::$countries === null) {
            $rows = json_decode((string) file_get_contents(resource_path('data/countries.json')), true, flags: JSON_THROW_ON_ERROR);
            self::$countries = collect($rows)->mapWithKeys(fn (array $r) => [$r[0] => ['name' => $r[1], 'dial' => $r[2], 'pattern' => $r[3]]])->all();
        }

        return self::$countries;
    }

    /**
     * @return list<string>
     */
    public static function countryCodes(): array
    {
        return array_keys(self::countries());
    }

    /**
     * The number in E.164, or null when it is not a valid number for the country.
     */
    public static function toE164(?string $number, ?string $country): ?string
    {
        $country = strtoupper((string) ($country ?: self::DEFAULT_COUNTRY));
        $meta = self::countries()[$country] ?? null;
        $raw = preg_replace('/[\s().\-\x{2010}-\x{2015}]/u', '', (string) $number);

        if ($meta === null || $raw === '') {
            return null;
        }

        $dial = $meta['dial'];

        if (str_starts_with($raw, '+')) {
            if (! str_starts_with($raw, '+'.$dial)) {
                return null; // international prefix for a different country
            }
            $national = substr($raw, strlen($dial) + 1);
        } elseif (str_starts_with($raw, '00'.$dial)) {
            $national = substr($raw, strlen($dial) + 2);
        } else {
            $national = $raw;
            if (str_starts_with($national, '0') && ! in_array($country, self::KEEP_LEADING_ZERO, true)) {
                $national = substr($national, 1);
            }
        }

        if (! preg_match('/^\d+$/', $national) || strlen($dial.$national) > 15) {
            return null;
        }

        $pattern = $meta['pattern'] ?? '^\d{6,13}$';

        return preg_match('/'.$pattern.'/', $national) ? '+'.$dial.$national : null;
    }
}
