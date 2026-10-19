<?php

namespace Database\Factories;

use App\Enums\PublicationStatus;
use App\Models\Place;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Place>
 */
class PlaceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->streetName().' Point',
            'summary' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'status' => PublicationStatus::Published,
            'published_at' => now()->subDay(),
        ];
    }
}
