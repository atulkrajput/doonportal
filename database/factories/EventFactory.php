<?php

namespace Database\Factories;

use App\Enums\EventStatus;
use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => ucfirst(fake()->unique()->words(4, true)),
            'summary' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'status' => EventStatus::Published,
            'starts_at' => now()->addDays(7)->startOfHour(),
            'ends_at' => now()->addDays(7)->startOfHour()->addHours(3),
            'timezone' => 'Asia/Kolkata',
            'is_free' => true,
            'published_at' => now()->subDay(),
        ];
    }
}
