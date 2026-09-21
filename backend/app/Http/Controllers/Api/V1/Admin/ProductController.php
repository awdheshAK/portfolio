<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductStoreRequest;
use App\Http\Requests\Admin\ProductUpdateRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct(protected ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $products = Product::query()
            ->withTrashed()
            ->with(['category', 'images', 'variants'])
            ->orderByDesc('id')
            ->paginate(min(50, (int) $request->query('per_page', 20)));

        $products->getCollection()->each(
            fn (Product $product) => $product->variants->each(fn ($variant) => $variant->setRelation('product', $product))
        );

        return $this->success([
            'data' => ProductResource::collection($products->items()),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
            ],
        ], 'OK');
    }

    public function store(ProductStoreRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']).'-'.Str::random(6);

        $product = DB::transaction(function () use ($data) {
            $product = Product::create(collect($data)->except(['images', 'variants'])->toArray());

            foreach ($data['images'] ?? [] as $index => $image) {
                $product->images()->create([
                    'url' => $image['url'],
                    'alt_text' => $image['alt_text'] ?? null,
                    'sort_order' => $index,
                ]);
            }

            foreach ($data['variants'] ?? [] as $variant) {
                $product->variants()->create([
                    'color_id' => $variant['color_id'] ?? null,
                    'size_id' => $variant['size_id'] ?? null,
                    'sku' => $variant['sku'],
                    'price_delta_minor' => $variant['price_delta_minor'] ?? 0,
                    'stock' => $variant['stock'] ?? 0,
                ]);
            }

            return $product;
        });

        $this->activityLog->log(request()->user(), 'created', 'product', $product->id, null, $data);

        $product->load(['category', 'images', 'variants']);
        $product->variants->each(fn ($variant) => $variant->setRelation('product', $product));

        return $this->success(new ProductResource($product), 'Product created.', 201);
    }

    public function update(ProductUpdateRequest $request, Product $product)
    {
        $data = $request->validated();
        $old = $product->only(['name', 'base_price_minor', 'is_active', 'category_id']);

        DB::transaction(function () use ($product, $data) {
            $product->update(collect($data)->except(['images', 'variants'])->toArray());

            if (array_key_exists('images', $data)) {
                $product->images()->delete();

                foreach ($data['images'] as $index => $image) {
                    $product->images()->create([
                        'url' => $image['url'],
                        'alt_text' => $image['alt_text'] ?? null,
                        'sort_order' => $index,
                    ]);
                }
            }

            if (array_key_exists('variants', $data)) {
                foreach ($data['variants'] as $variant) {
                    $product->variants()->updateOrCreate(
                        ['id' => $variant['id'] ?? null],
                        [
                            'color_id' => $variant['color_id'] ?? null,
                            'size_id' => $variant['size_id'] ?? null,
                            'sku' => $variant['sku'],
                            'price_delta_minor' => $variant['price_delta_minor'] ?? 0,
                            'stock' => $variant['stock'] ?? 0,
                        ]
                    );
                }
            }
        });

        $this->activityLog->log(request()->user(), 'updated', 'product', $product->id, $old, $data);

        $fresh = $product->fresh(['category', 'images', 'variants']);
        $fresh->variants->each(fn ($variant) => $variant->setRelation('product', $fresh));

        return $this->success(new ProductResource($fresh), 'Product updated.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        $this->activityLog->log(request()->user(), 'deleted', 'product', $product->id, $product->toArray(), null);

        return $this->success(null, 'Product deleted.');
    }
}
