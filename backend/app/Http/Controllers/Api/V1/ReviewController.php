<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Reviews\ReviewStoreRequest;
use App\Http\Resources\ReviewResource;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function index(Product $product)
    {
        $reviews = $product->reviews()->with('user')->latest()->get();

        return $this->success(ReviewResource::collection($reviews), 'OK');
    }

    public function store(ReviewStoreRequest $request, Product $product)
    {
        $user = $request->user();

        $orderItem = OrderItem::query()
            ->where('id', $request->integer('order_item_id'))
            ->where('product_id', $product->id)
            ->whereHas('order', fn ($q) => $q->where('user_id', $user->id)->where('status', OrderStatus::Delivered->value))
            ->first();

        if (! $orderItem) {
            throw ValidationException::withMessages([
                'order_item_id' => ['You can only review products from your own delivered orders.'],
            ]);
        }

        $alreadyReviewed = $orderItem->review()->exists();

        if ($alreadyReviewed) {
            throw ValidationException::withMessages([
                'order_item_id' => ['You have already reviewed this order item.'],
            ]);
        }

        $review = $product->reviews()->create([
            'user_id' => $user->id,
            'order_item_id' => $orderItem->id,
            'rating' => $request->integer('rating'),
            'body' => $request->input('body'),
        ]);

        $this->refreshProductRating($product);

        return $this->success(new ReviewResource($review->load('user')), 'Review submitted.', 201);
    }

    protected function refreshProductRating(Product $product): void
    {
        $product->refresh();
        $avg = $product->reviews()->avg('rating') ?? 0;
        $count = $product->reviews()->count();

        $product->update([
            'rating_avg' => round($avg, 2),
            'rating_count' => $count,
        ]);
    }
}
