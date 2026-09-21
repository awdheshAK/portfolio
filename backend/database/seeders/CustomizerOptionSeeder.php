<?php

namespace Database\Seeders;

use App\Models\EmbroideryPosition;
use App\Models\Patch;
use App\Models\PrintPosition;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CustomizerOptionSeeder extends Seeder
{
    /**
     * x/y are percentages (0-100) of the garment canvas width/height, anchored
     * at `anchor`, for the frontend to place the print/embroidery layer
     * precisely without hard-coding coordinates on its own.
     */
    public const PRINT_POSITIONS = [
        ['label' => 'Front Center', 'price_minor' => 15000, 'x' => 50, 'y' => 35, 'anchor' => 'center'],
        ['label' => 'Back Center', 'price_minor' => 18000, 'x' => 50, 'y' => 30, 'anchor' => 'center'],
        ['label' => 'Left Chest', 'price_minor' => 10000, 'x' => 30, 'y' => 22, 'anchor' => 'center'],
        ['label' => 'Right Sleeve', 'price_minor' => 8000, 'x' => 85, 'y' => 40, 'anchor' => 'center'],
    ];

    public const EMBROIDERY_POSITIONS = [
        ['label' => 'Left Chest', 'price_minor' => 25000, 'x' => 30, 'y' => 22, 'anchor' => 'center'],
        ['label' => 'Right Chest', 'price_minor' => 25000, 'x' => 70, 'y' => 22, 'anchor' => 'center'],
        ['label' => 'Back Center', 'price_minor' => 35000, 'x' => 50, 'y' => 28, 'anchor' => 'center'],
        ['label' => 'Cap Front', 'price_minor' => 20000, 'x' => 50, 'y' => 50, 'anchor' => 'center'],
    ];

    public const PATCHES = [
        ['name' => 'Woven Name Patch', 'type' => 'woven', 'price_minor' => 12000],
        ['name' => 'Leather Brand Patch', 'type' => 'leather', 'price_minor' => 18000],
        ['name' => 'Chenille Letter Patch', 'type' => 'chenille', 'price_minor' => 22000],
        ['name' => 'PVC Rubber Patch', 'type' => 'pvc', 'price_minor' => 16000],
    ];

    public function run(): void
    {
        foreach (self::PRINT_POSITIONS as $position) {
            PrintPosition::query()->updateOrCreate(
                ['slug' => Str::slug($position['label']).'-print'],
                [
                    'label' => $position['label'],
                    'price_minor' => $position['price_minor'],
                    'x' => $position['x'],
                    'y' => $position['y'],
                    'anchor' => $position['anchor'],
                    'is_active' => true,
                ]
            );
        }

        foreach (self::EMBROIDERY_POSITIONS as $position) {
            EmbroideryPosition::query()->updateOrCreate(
                ['slug' => Str::slug($position['label']).'-embroidery'],
                [
                    'label' => $position['label'],
                    'price_minor' => $position['price_minor'],
                    'x' => $position['x'],
                    'y' => $position['y'],
                    'anchor' => $position['anchor'],
                    'is_active' => true,
                ]
            );
        }

        foreach (self::PATCHES as $patch) {
            Patch::query()->updateOrCreate(
                ['slug' => Str::slug($patch['name'])],
                [
                    'name' => $patch['name'],
                    'type' => $patch['type'],
                    'price_minor' => $patch['price_minor'],
                    'image_url' => 'https://placehold.co/200x200?text='.urlencode($patch['name']),
                    'is_active' => true,
                ]
            );
        }
    }
}
