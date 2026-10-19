<?php

namespace Database\Factories;

use App\Enums\CategoryType;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'type' => CategoryType::Business,
            'name' => ucfirst(fake()->unique()->words(2, true)),
            'is_active' => true,
        ];
    }
}
