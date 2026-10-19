<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Offer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Offer>
 */
class OfferFactory extends Factory
{
    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'title' => ucfirst(fake()->words(3, true)),
            'is_active' => true,
            'ends_at' => now()->addMonth(),
        ];
    }
}
