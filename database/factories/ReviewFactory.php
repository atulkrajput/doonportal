<?php

namespace Database\Factories;

use App\Enums\ReviewStatus;
use App\Models\Business;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'reviewable_type' => 'business',
            'reviewable_id' => Business::factory(),
            'rating' => fake()->numberBetween(1, 5),
            'body' => fake()->paragraph(),
            'status' => ReviewStatus::Published,
        ];
    }
}
