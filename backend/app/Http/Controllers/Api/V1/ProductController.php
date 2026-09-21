<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->where('is_active', true)
            ->with(['category', 'images'])
            ->withMin('variants', 'stock');

        if ($category = $request->query('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $category));
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        if ($minPrice = $request->query('min_price')) {
            $query->where('base_price_minor', '>=', (int) $minPrice);
        }

        if ($maxPrice = $request->query('max_price')) {
            $query->where('base_price_minor', '<=', (int) $maxPrice);
        }

        if ($color = $request->query('color')) {
            $query->whereHas('variants.color', fn ($q) => $q->where('slug', $color)->orWhere('name', 'ilike', $color));
        }

        if ($size = $request->query('size')) {
            $query->whereHas('variants.size', fn ($q) => $q->where('slug', $size)->orWhere('label', 'ilike', $size));
        }

        // NOTE: fixed catalog products are not associated with fabrics in this
        // schema (fabrics apply to the customizer flow); the `fabric` filter
        // param is accepted for contract-compatibility but currently has no effect.

        match ($request->query('sort')) {
            'price_asc' => $query->orderBy('base_price_minor', 'asc'),
            'price_desc' => $query->orderBy('base_price_minor', 'desc'),
            'newest' => $query->orderBy('created_at', 'desc'),
            default => $query->orderBy('id', 'asc'),
        };

        $perPage = min(50, max(1, (int) $request->query('per_page', 15)));
        $paginator = $query->paginate($perPage)->withQueryString();

        return $this->success([
            'data' => ProductResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ], 'OK');
    }

    public function show(string $slug)
    {
        $product = Product::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->with(['category', 'images', 'variants.color', 'variants.size', 'reviews.user'])
            ->firstOrFail();

        // Avoid an N+1 lookup for each variant's price while still letting
        // ProductVariantResource compute price_minor = base + delta.
        $product->variants->each(fn ($variant) => $variant->setRelation('product', $product));

        return $this->success(new ProductResource($product), 'OK');
    }
}
