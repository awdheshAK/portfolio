<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\CartItemStoreRequest;
use App\Http\Requests\Cart\CartItemUpdateRequest;
use App\Http\Requests\Cart\CouponApplyRequest;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\User;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    public function __construct(protected CartService $cartService) {}

    protected function currentUser(Request $request): ?User
    {
        return auth('sanctum')->user();
    }

    protected function resolveCart(Request $request, bool $createIfMissing = true): Cart
    {
        $user = $this->currentUser($request);
        $guestToken = $request->header('X-Guest-Cart-Token');

        if (! $user && ! $guestToken) {
            throw ValidationException::withMessages([
                'X-Guest-Cart-Token' => ['A guest cart token or authentication is required.'],
            ]);
        }

        return $this->cartService->resolveCart($user, $guestToken, $createIfMissing);
    }

    public function show(Request $request)
    {
        $cart = $this->resolveCart($request);
        $cart->load(['items.productVariant.product', 'items.garment', 'coupon']);

        return $this->success(new CartResource($cart), 'OK');
    }

    public function addItem(CartItemStoreRequest $request)
    {
        $cart = $this->resolveCart($request);
        $cart = $this->cartService->addItem($cart, $request->validated());

        return $this->success(new CartResource($cart), 'Item added to cart.');
    }

    public function updateItem(CartItemUpdateRequest $request, CartItem $item)
    {
        $cart = $this->resolveCart($request, false);

        if (! $cart->exists || $item->cart_id !== $cart->id) {
            return $this->fail('This cart item was not found.', 404);
        }

        $cart = $this->cartService->updateItemQuantity($cart, $item, (int) $request->input('quantity'));

        return $this->success(new CartResource($cart), 'Cart updated.');
    }

    public function removeItem(Request $request, CartItem $item)
    {
        $cart = $this->resolveCart($request, false);

        if (! $cart->exists || $item->cart_id !== $cart->id) {
            return $this->fail('This cart item was not found.', 404);
        }

        $cart = $this->cartService->removeItem($cart, $item);

        return $this->success(new CartResource($cart), 'Item removed from cart.');
    }

    public function applyCoupon(CouponApplyRequest $request)
    {
        $cart = $this->resolveCart($request);
        $cart->load('items');
        $cart = $this->cartService->applyCoupon($cart, strtoupper($request->string('code')));

        return $this->success(new CartResource($cart), 'Coupon applied.');
    }

    public function removeCoupon(Request $request)
    {
        $cart = $this->resolveCart($request);
        $cart = $this->cartService->removeCoupon($cart);

        return $this->success(new CartResource($cart), 'Coupon removed.');
    }
}
