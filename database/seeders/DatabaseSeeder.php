<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Reference data only. Demo content is opt-in:
     *   php artisan db:seed --class=DemoDataSeeder
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            AreaSeeder::class,
            CategorySeeder::class,
        ]);
    }
}
