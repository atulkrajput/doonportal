<?php

namespace Database\Factories;

use App\Enums\PublicationStatus;
use App\Models\Collection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Collection>
 */
class CollectionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => ucfirst(fake()->unique()->words(3, true)),
            'description' => fake()->sentence(),
            'selection_criteria' => fake()->sentence(),
            'status' => PublicationStatus::Published,
            'published_at' => now()->subDay(),
        ];
    }
}
