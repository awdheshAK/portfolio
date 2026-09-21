<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Color;
use App\Models\Product;
use App\Models\Size;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * @var array<int, array<string, mixed>>
     */
    public const PRODUCTS = [
        [
            'name' => 'Classic T-Shirt',
            'category_slug' => 'casual-wear-t-shirts',
            'base_price_minor' => 59900,
            'short_description' => 'A wardrobe staple crew-neck tee in soft combed cotton.',
            'description' => 'Our Classic T-Shirt is cut from breathable, pre-shrunk combed cotton for an easy everyday fit. Reinforced shoulder seams and a ribbed collar keep its shape wash after wash, making it a reliable go-to for casual days.',
            'colors' => ['black', 'white', 'navy-blue'],
            'sizes' => ['S', 'M', 'L', 'XL'],
            'is_featured' => true,
        ],
        [
            'name' => 'Premium Cotton Shirt',
            'category_slug' => 'casual-wear-shirts',
            'base_price_minor' => 129900,
            'short_description' => 'A tailored button-down shirt in premium long-staple cotton.',
            'description' => 'Crafted from long-staple cotton with a smooth finish, the Premium Cotton Shirt offers a tailored silhouette that moves comfortably from desk to dinner. Features mother-of-pearl buttons and a reinforced placket.',
            'colors' => ['white', 'royal-blue', 'charcoal-grey'],
            'sizes' => ['S', 'M', 'L', 'XL', 'XXL'],
            'is_featured' => true,
        ],
        [
            'name' => 'Relaxed Pants',
            'category_slug' => 'casual-wear-pants',
            'base_price_minor' => 149900,
            'short_description' => 'Relaxed-fit chino pants with a comfortable elastic waistband.',
            'description' => 'The Relaxed Pants pair a soft cotton-blend twill with a partially elasticated waistband, giving you tailored looks without sacrificing all-day comfort. Two side pockets and a single back pocket round out the design.',
            'colors' => ['charcoal-grey', 'navy-blue', 'black'],
            'sizes' => ['S', 'M', 'L', 'XL', 'XXL'],
            'is_featured' => false,
        ],
        [
            'name' => 'Comfort Night Suit',
            'category_slug' => 'sleep-wear-night-suits',
            'base_price_minor' => 109900,
            'short_description' => 'A matching top-and-pajama set for restful nights.',
            'description' => 'The Comfort Night Suit set pairs a loose-fit button top with drawstring pajama pants, both cut from breathable cotton jersey that stays soft wash after wash. Perfect for warm or cool nights alike.',
            'colors' => ['navy-blue', 'maroon', 'forest-green'],
            'sizes' => ['S', 'M', 'L', 'XL'],
            'is_featured' => false,
        ],
        [
            'name' => 'Classic Nightwear',
            'category_slug' => 'sleep-wear-nightwear',
            'base_price_minor' => 79900,
            'short_description' => 'A relaxed sleep tee and shorts set for everyday comfort.',
            'description' => 'Classic Nightwear is a simple, breathable sleep tee and shorts combo made from lightweight cotton jersey, designed to keep you cool and comfortable through the night.',
            'colors' => ['white', 'black', 'mustard-yellow'],
            'sizes' => ['S', 'M', 'L', 'XL'],
            'is_featured' => false,
        ],
        [
            'name' => 'Performance Tank Top',
            'category_slug' => 'gym-wear-tank-tops',
            'base_price_minor' => 49900,
            'short_description' => 'A lightweight, moisture-wicking tank for high-intensity workouts.',
            'description' => 'Built with a moisture-wicking performance knit, the Performance Tank Top keeps you dry and cool through the toughest sets, with dropped armholes for a full range of motion.',
            'colors' => ['black', 'royal-blue', 'forest-green'],
            'sizes' => ['S', 'M', 'L', 'XL'],
            'is_featured' => true,
        ],
        [
            'name' => 'Gym T-Shirt',
            'category_slug' => 'gym-wear-t-shirts',
            'base_price_minor' => 59900,
            'short_description' => 'A breathable performance tee built for the gym floor.',
            'description' => 'The Gym T-Shirt uses a four-way stretch performance fabric with strategic mesh ventilation panels, so you stay comfortable through every rep.',
            'colors' => ['black', 'charcoal-grey', 'royal-blue'],
            'sizes' => ['S', 'M', 'L', 'XL', 'XXL'],
            'is_featured' => false,
        ],
        [
            'name' => 'Performance Leggings',
            'category_slug' => 'gym-wear-leggings',
            'base_price_minor' => 129900,
            'short_description' => 'Squat-proof performance leggings with a supportive high waistband.',
            'description' => 'Engineered from a four-way stretch, sweat-wicking fabric, the Performance Leggings offer squat-proof opacity and a supportive high waistband that stays put through any workout.',
            'colors' => ['black', 'charcoal-grey', 'navy-blue'],
            'sizes' => ['XS', 'S', 'M', 'L', 'XL'],
            'is_featured' => true,
        ],
        [
            'name' => 'Premium Hoodie',
            'category_slug' => 'winter-wear-hoodies',
            'base_price_minor' => 159900,
            'short_description' => 'A heavyweight fleece hoodie built for cold weather comfort.',
            'description' => 'The Premium Hoodie is cut from heavyweight brushed fleece with a double-lined hood and a spacious kangaroo pocket, made to keep you warm through the coldest months.',
            'colors' => ['charcoal-grey', 'black', 'navy-blue'],
            'sizes' => ['S', 'M', 'L', 'XL', 'XXL'],
            'is_featured' => true,
        ],
        [
            'name' => 'Classic Sweatshirt',
            'category_slug' => 'winter-wear-sweatshirts',
            'base_price_minor' => 139900,
            'short_description' => 'A ribbed crew-neck sweatshirt for everyday layering.',
            'description' => 'The Classic Sweatshirt combines a soft fleece-back interior with ribbed cuffs and hem, making it an easy layering piece for the cooler months.',
            'colors' => ['maroon', 'navy-blue', 'charcoal-grey'],
            'sizes' => ['S', 'M', 'L', 'XL'],
            'is_featured' => false,
        ],
    ];

    public function run(): void
    {
        $colorsBySlug = Color::query()->get()->keyBy('slug');
        $sizesByLabel = Size::query()->get()->keyBy('label');

        foreach (self::PRODUCTS as $index => $data) {
            $category = Category::query()->where('slug', $data['category_slug'])->first();
            $slug = Str::slug($data['name']);

            $product = Product::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'category_id' => $category?->id,
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'short_description' => $data['short_description'],
                    'base_price_minor' => $data['base_price_minor'],
                    'is_customizable' => false,
                    'is_active' => true,
                    'is_featured' => $data['is_featured'],
                ]
            );

            $product->images()->delete();

            foreach (range(1, 3) as $imageIndex) {
                $product->images()->create([
                    'url' => "https://picsum.photos/seed/{$slug}-{$imageIndex}/800/800",
                    'alt_text' => "{$data['name']} — view {$imageIndex}",
                    'sort_order' => $imageIndex - 1,
                ]);
            }

            $stockSeed = ($index * 7) % 40; // deterministic pseudo-variety, no external RNG dependency

            foreach ($data['colors'] as $colorSlug) {
                $color = $colorsBySlug->get($colorSlug);

                if (! $color) {
                    continue;
                }

                foreach ($data['sizes'] as $sizeLabel) {
                    $size = $sizesByLabel->get($sizeLabel);

                    if (! $size) {
                        continue;
                    }

                    $sku = strtoupper(Str::slug($slug).'-'.$color->slug.'-'.$size->label);

                    $product->variants()->updateOrCreate(
                        ['product_id' => $product->id, 'color_id' => $color->id, 'size_id' => $size->id],
                        [
                            'sku' => $sku,
                            'price_delta_minor' => 0,
                            'stock' => 15 + $stockSeed,
                            'is_active' => true,
                        ]
                    );

                    $stockSeed = ($stockSeed + 5) % 40;
                }
            }
        }

        // Make one variant deliberately low-stock so the admin dashboard's
        // "low stock" widget has something to show.
        Product::query()->first()?->variants()->first()?->update(['stock' => 3]);
    }
}
