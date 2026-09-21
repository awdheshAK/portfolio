<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with a realistic, usable demo store.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            FabricSeeder::class,
            ColorSeeder::class,
            SizeSeeder::class,
            CustomizerOptionSeeder::class,
            GarmentSeeder::class,
            ProductSeeder::class,
            CollectionSeeder::class,
            CouponSeeder::class,
        ]);
    }
}
