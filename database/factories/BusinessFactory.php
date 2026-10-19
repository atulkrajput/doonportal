<?php

namespace Database\Factories;

use App\Enums\BusinessStatus;
use App\Models\Business;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Business>
 */
class BusinessFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company(),
            'description' => fake()->paragraph(),
            'status' => BusinessStatus::Unverified,
            'is_published' => true,
            'address_line' => fake()->streetAddress(),
            'phone' => '+91 '.fake()->numerify('98########'),
            'price_range' => fake()->numberBetween(1, 4),
        ];
    }
}
