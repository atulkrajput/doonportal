<?php

namespace App\Services\DataEngine;

/**
 * Turns common OpenStreetMap opening_hours values into weekly rows
 * ("Mo-Sa 09:00-21:00; Su off", "Mo-Fr 10:00-13:00,14:00-18:00", "24/7").
 * Anything it does not fully understand returns null: no hours beats wrong hours.
 */
class OpeningHoursParser
{
    /** OSM day codes => day_of_week (0 = Sunday). */
    private const DAYS = ['Su' => 0, 'Mo' => 1, 'Tu' => 2, 'We' => 3, 'Th' => 4, 'Fr' => 5, 'Sa' => 6];

    private const ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    /**
     * @return list<array{day_of_week: int, is_closed: bool, opens_at: ?string, closes_at: ?string}>|null
     */
    public function parse(?string $value): ?array
    {
        $value = trim((string) $value);
        if ($value === '' || mb_strlen($value) > 255) {
            return null;
        }

        if ($value === '24/7') {
            return array_map(fn ($d) => ['day_of_week' => $d, 'is_closed' => false, 'opens_at' => '00:00', 'closes_at' => '23:59'], range(0, 6));
        }

        $week = []; // day => list of slots, or 'closed'

        foreach (array_filter(array_map('trim', explode(';', $value))) as $rule) {
            if (! preg_match('/^(?:(?<days>[A-Z][a-z](?:[-,][A-Z][a-z])*)\s+)?(?<times>.+)$/', $rule, $m)) {
                return null;
            }

            $days = filled($m['days']) ? $this->days($m['days']) : range(0, 6);
            if ($days === null) {
                return null;
            }

            $times = strtolower(trim($m['times']));
            if (in_array($times, ['off', 'closed'], true)) {
                foreach ($days as $d) {
                    $week[$d] = 'closed';
                }

                continue;
            }

            $slots = [];
            foreach (explode(',', $times) as $range) {
                if (! preg_match('/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/', trim($range), $t)) {
                    return null;
                }
                [$oh, $om, $ch, $cm] = [(int) $t[1], (int) $t[2], (int) $t[3], (int) $t[4]];
                if ($oh > 24 || $ch > 26 || $om > 59 || $cm > 59) {
                    return null;
                }
                // 24:00 (and past-midnight closing such as 25:00) is stored as the last minute of the day.
                $close = $ch >= 24 ? '23:59' : sprintf('%02d:%02d', $ch, $cm);
                $open = sprintf('%02d:%02d', min($oh, 23), $om);
                if ($open === $close) {
                    return null;
                }
                $slots[] = [$open, $close];
            }

            foreach ($days as $d) {
                $week[$d] = $slots;
            }
        }

        if ($week === []) {
            return null;
        }

        $rows = [];
        ksort($week);
        foreach ($week as $day => $slots) {
            if ($slots === 'closed') {
                $rows[] = ['day_of_week' => $day, 'is_closed' => true, 'opens_at' => null, 'closes_at' => null];

                continue;
            }
            foreach ($slots as [$open, $close]) {
                $rows[] = ['day_of_week' => $day, 'is_closed' => false, 'opens_at' => $open, 'closes_at' => $close];
            }
        }

        return $rows;
    }

    /**
     * "Mo-Fr", "Mo,We,Fr", "Sa-Mo" => day_of_week list.
     *
     * @return list<int>|null
     */
    private function days(string $spec): ?array
    {
        $days = [];
        foreach (explode(',', $spec) as $part) {
            if (str_contains($part, '-')) {
                [$from, $to] = explode('-', $part, 2);
                $start = array_search($from, self::ORDER, true);
                $end = array_search($to, self::ORDER, true);
                if ($start === false || $end === false) {
                    return null;
                }
                for ($i = $start; ; $i = ($i + 1) % 7) {
                    $days[] = self::DAYS[self::ORDER[$i]];
                    if ($i === $end) {
                        break;
                    }
                }
            } elseif (isset(self::DAYS[$part])) {
                $days[] = self::DAYS[$part];
            } else {
                return null;
            }
        }

        return array_values(array_unique($days));
    }
}
