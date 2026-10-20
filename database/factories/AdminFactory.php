<?php

namespace Database\Factories;

use App\Enums\RoleName;
use App\Models\Admin;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<Admin>
 */
class AdminFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
        ];
    }

    public function withRole(RoleName $role): static
    {
        return $this->afterCreating(function (Admin $admin) use ($role) {
            Role::firstOrCreate(['name' => $role->value], ['label' => $role->label()]);
            $admin->assignRole($role);
        });
    }
}
