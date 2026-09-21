<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function __construct(protected PricingService $pricingService) {}

    /**
     * Resolve (and create if necessary) the cart for the current actor.
     * If both a user and a guest token are present (e.g. a guest just logged
     * in), the guest cart's items are merged into the user's cart.
     */
    public function resolveCart(?User $user, ?string $guestToken, bool $createIfMissing = true): Cart
    {
        if ($user) {
            $cart = Cart::query()->firstOrNew(['user_id' => $user->id]);

            if (! $cart->exists && $createIfMissing) {
                $cart->save();
            }

            if ($guestToken) {
                $guestCart = Cart::query()->where('guest_token', $guestToken)->first();

                if ($guestCart && $guestCart->id !== $cart->id) {
                    if (! $cart->exists) {
                        $cart->save();
                    }

                    foreach ($guestCart->items as $item) {
                        $item->update(['cart_id' => $cart->id]);
                    }

                    $guestCart->delete();
                }
            }

            return $cart->fresh(['items']) ?? $cart;
        }

        if (! $guestToken) {
            $guestToken = (string) Str::uuid();
        }

        $cart = Cart::query()->firstOrNew(['guest_token' => $guestToken]);

        if (! $cart->exists && $createIfMissing) {
            $cart->save();
        }

        return $cart;
    }

    public function addItem(Cart $cart, array $data): Cart
    {
        $type = $data['type'];
        $quantity = max(1, (int) ($data['quantity'] ?? 1));

        if ($type === CartItem::TYPE_PRODUCT) {
            /** @var ProductVariant $variant */
            $variant = ProductVariant::query()->with('product')->where('is_active', true)->find($data['product_variant_id']);

            if (! $variant) {
                throw ValidationException::withMessages(['product_variant_id' => ['The selected product variant is invalid.']]);
            }

            if (! $variant->inStock($quantity)) {
                throw ValidationException::withMessages(['quantity' => ['Not enough stock for the selected variant.']]);
            }

            $existing = $cart->items()
                ->where('type', CartItem::TYPE_PRODUCT)
                ->where('product_variant_id', $variant->id)
                ->first();

            $unitPrice = $variant->priceMinor();

            if ($existing) {
                $newQuantity = $existing->quantity + $quantity;

                if (! $variant->inStock($newQuantity)) {
                    throw ValidationException::withMessages(['quantity' => ['Not enough stock for the selected variant.']]);
                }

                $existing->update([
                    'quantity' => $newQuantity,
                    'unit_price_minor' => $unitPrice,
                    'total_price_minor' => $unitPrice * $newQuantity,
                ]);
            } else {
                $cart->items()->create([
                    'type' => CartItem::TYPE_PRODUCT,
                    'product_variant_id' => $variant->id,
                    'name_snapshot' => $variant->product->name,
                    'quantity' => $quantity,
                    'unit_price_minor' => $unitPrice,
                    'total_price_minor' => $unitPrice * $quantity,
                ]);
            }
        } else {
            $config = $data['design_configuration'] ?? [];

            if (empty($config)) {
                throw ValidationException::withMessages(['design_configuration' => ['A design configuration is required for custom items.']]);
            }

            $priced = $this->pricingService->calculate(array_merge($config, ['quantity' => 1]));

            $cart->items()->create([
                'type' => CartItem::TYPE_CUSTOM,
                'garment_id' => $config['garment_id'] ?? null,
                'design_configuration' => $config,
                'name_snapshot' => 'Custom garment',
                'quantity' => $quantity,
                'unit_price_minor' => $priced['unit_price_minor'],
                'total_price_minor' => $priced['unit_price_minor'] * $quantity,
            ]);
        }

        return $cart->fresh(['items.productVariant.product', 'items.garment', 'coupon']);
    }

    public function updateItemQuantity(Cart $cart, CartItem $item, int $quantity): Cart
    {
        if ($quantity < 1) {
            throw ValidationException::withMessages(['quantity' => ['Quantity must be at least 1.']]);
        }

        if ($item->type === CartItem::TYPE_PRODUCT && $item->productVariant) {
            if (! $item->productVariant->inStock($quantity)) {
                throw ValidationException::withMessages(['quantity' => ['Not enough stock for the selected variant.']]);
            }
        }

        $item->update([
            'quantity' => $quantity,
            'total_price_minor' => $item->unit_price_minor * $quantity,
        ]);

        return $cart->fresh(['items.productVariant.product', 'items.garment', 'coupon']);
    }

    public function removeItem(Cart $cart, CartItem $item): Cart
    {
        $item->delete();

        return $cart->fresh(['items.productVariant.product', 'items.garment', 'coupon']);
    }

    public function applyCoupon(Cart $cart, string $code): Cart
    {
        $coupon = Coupon::query()->where('code', $code)->where('is_active', true)->first();

        if (! $coupon) {
            throw ValidationException::withMessages(['code' => ['This coupon code is invalid.']]);
        }

        $subtotal = $cart->items->sum('total_price_minor');

        if (! $coupon->isValidFor($subtotal)) {
            throw ValidationException::withMessages(['code' => ['This coupon is not valid for your current order.']]);
        }

        $cart->update(['coupon_id' => $coupon->id]);

        return $cart->fresh(['items.productVariant.product', 'items.garment', 'coupon']);
    }

    public function removeCoupon(Cart $cart): Cart
    {
        $cart->update(['coupon_id' => null]);

        return $cart->fresh(['items.productVariant.product', 'items.garment', 'coupon']);
    }
}
