<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\WishlistResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $wishlists = $request->user()->wishlists()->with('product.images')->latest()->get();

        return $this->success(WishlistResource::collection($wishlists), 'OK');
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        $exists = $request->user()->wishlists()->where('product_id', $request->integer('product_id'))->exists();

        if ($exists) {
            throw ValidationException::withMessages(['product_id' => ['This product is already in your wishlist.']]);
        }

        $wishlist = $request->user()->wishlists()->create(['product_id' => $request->integer('product_id')]);

        return $this->success(new WishlistResource($wishlist->load('product.images')), 'Added to wishlist.', 201);
    }

    public function destroy(Request $request, Product $product)
    {
        $request->user()->wishlists()->where('product_id', $product->id)->delete();

        return $this->success(null, 'Removed from wishlist.');
    }
}
