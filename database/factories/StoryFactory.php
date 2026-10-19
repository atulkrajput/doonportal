<?php

namespace Database\Factories;

use App\Enums\PublicationStatus;
use App\Enums\StoryType;
use App\Models\Story;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Story>
 */
class StoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'type' => StoryType::Story,
            'title' => ucfirst(fake()->unique()->words(5, true)),
            'excerpt' => fake()->sentence(),
            'body' => '<p>'.fake()->paragraph().'</p>',
            'status' => PublicationStatus::Published,
            'published_at' => now()->subDay(),
        ];
    }
}
