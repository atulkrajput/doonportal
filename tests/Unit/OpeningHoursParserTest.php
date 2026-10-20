<?php

namespace Tests\Unit;

use App\Services\DataEngine\OpeningHoursParser;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class OpeningHoursParserTest extends TestCase
{
    public function test_common_formats(): void
    {
        $p = new OpeningHoursParser;

        $rows = $p->parse('Mo-Sa 09:00-21:00; Su off');
        $this->assertCount(7, $rows);
        $this->assertSame(['day_of_week' => 0, 'is_closed' => true, 'opens_at' => null, 'closes_at' => null], $rows[0]);
        $this->assertSame(['day_of_week' => 1, 'is_closed' => false, 'opens_at' => '09:00', 'closes_at' => '21:00'], $rows[1]);

        $split = $p->parse('Mo,We,Fr 10:00-13:00,14:00-18:00');
        $this->assertCount(6, $split);
        $this->assertSame([1, 1, 3, 3, 5, 5], array_column($split, 'day_of_week'));

        $this->assertCount(7, $p->parse('24/7'));
        $this->assertSame('23:59', $p->parse('11:00-24:00')[0]['closes_at']);
        $this->assertSame([0, 5, 6], array_column($p->parse('Fr-Su 18:00-23:00'), 'day_of_week'), 'ranges wrap past Sunday');

        // Later rules override earlier ones for the same day.
        $override = $p->parse('Mo-Su 09:00-18:00; Su 10:00-14:00');
        $this->assertSame('10:00', collect($override)->firstWhere('day_of_week', 0)['opens_at']);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function unsupported(): array
    {
        return [
            'public holidays' => ['Mo-Fr 09:00-18:00; PH off'],
            'sunrise' => ['sunrise-sunset'],
            'words' => ['by appointment'],
            'empty' => [''],
            'months' => ['Jan-Mar Mo-Fr 09:00-17:00'],
        ];
    }

    #[DataProvider('unsupported')]
    public function test_unsupported_values_give_no_hours_rather_than_wrong_hours(string $value): void
    {
        $this->assertNull((new OpeningHoursParser)->parse($value));
    }
}
