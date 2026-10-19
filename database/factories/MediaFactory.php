<?php

namespace Database\Factories;

use App\Models\Media;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Media>
 */
class MediaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'disk' => 'public',
            'external_url' => 'https://picsum.photos/seed/'.fake()->uuid().'/800/600',
            'alt_text' => fake()->sentence(4),
        ];
    }
}
