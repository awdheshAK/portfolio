<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * @var array<string, array<int, string>>
     */
    public const STRUCTURE = [
        'Casual Wear' => ['T-Shirts', 'Shirts', 'Pants'],
        'Sleep Wear' => ['Night Suits', 'Nightwear'],
        'Gym Wear' => ['Tank Tops', 'T-Shirts', 'Leggings'],
        'Winter Wear' => ['Hoodies', 'Sweatshirts'],
    ];

    public function run(): void
    {
        $sortOrder = 0;

        foreach (self::STRUCTURE as $parentName => $children) {
            $parentSlug = Str::slug($parentName);

            $parent = Category::query()->updateOrCreate(
                ['slug' => $parentSlug],
                [
                    'name' => $parentName,
                    'description' => "{$parentName} for everyday comfort and style.",
                    'is_active' => true,
                    'sort_order' => $sortOrder++,
                ]
            );

            $childSortOrder = 0;

            foreach ($children as $childName) {
                $childSlug = $parentSlug.'-'.Str::slug($childName);

                Category::query()->updateOrCreate(
                    ['slug' => $childSlug],
                    [
                        'parent_id' => $parent->id,
                        'name' => $childName,
                        'description' => "{$childName} in the {$parentName} range.",
                        'is_active' => true,
                        'sort_order' => $childSortOrder++,
                    ]
                );
            }
        }
    }
}
