<?php

namespace Database\Seeders;

use App\Models\Area;
use Illuminate\Database\Seeder;

/**
 * Real Dehradun neighbourhood names only. Descriptions and coordinates are left
 * empty on purpose: they must come from verified sources, not be invented.
 * Idempotent.
 */
class AreaSeeder extends Seeder
{
    public const AREAS = [
        'Rajpur Road', 'Jakhan', 'Malsi', 'Dalanwala', 'Race Course', 'Vasant Vihar', 'Clement Town',
        'Raipur', 'Prem Nagar', 'Patel Nagar', 'Sahastradhara Road', 'GMS Road', 'Ballupur',
    ];

    public function run(): void
    {
        foreach (self::AREAS as $i => $name) {
            Area::withTrashed()->firstOrCreate(['name' => $name], ['sort_order' => $i]);
        }
    }
}
