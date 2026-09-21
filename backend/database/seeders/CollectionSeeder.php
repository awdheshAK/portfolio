<?php

namespace Database\Seeders;

use App\Models\Collection;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CollectionSeeder extends Seeder
{
    public function run(): void
    {
        $featured = Collection::query()->updateOrCreate(
            ['slug' => 'featured'],
            [
                'name' => 'Featured',
                'description' => 'Our most popular picks this season.',
                'image_url' => 'https://placehold.co/1200x400?text=Featured+Collection',
                'is_active' => true,
            ]
        );

        $featuredProductIds = Product::query()->where('is_featured', true)->pluck('id');

        $featured->products()->sync(
            $featuredProductIds->mapWithKeys(fn ($id, $i) => [$id => ['sort_order' => $i]])->toArray()
        );

        $winter = Collection::query()->updateOrCreate(
            ['slug' => 'winter-essentials'],
            [
                'name' => 'Winter Essentials',
                'description' => 'Stay warm with our winter wear range.',
                'image_url' => 'https://placehold.co/1200x400?text=Winter+Essentials',
                'is_active' => true,
            ]
        );

        $winterProductIds = Product::query()
            ->whereHas('category', fn ($q) => $q->where('slug', 'like', 'winter-wear%'))
            ->pluck('id');

        $winter->products()->sync(
            $winterProductIds->mapWithKeys(fn ($id, $i) => [$id => ['sort_order' => $i]])->toArray()
        );
    }
}
