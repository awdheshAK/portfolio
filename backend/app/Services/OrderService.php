<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(protected RazorpayService $razorpay) {}

    /**
     * Create an order from the given cart, snapshotting all pricing and
     * decrementing stock, then create a matching Razorpay order.
     *
     * @return array{order: Order, razorpay_order_id: string, razorpay_key_id: string, amount_minor: int, currency: string}
     */
    public function checkout(User $user, Cart $cart, array $data): array
    {
        $cart->loadMissing(['items.productVariant.product', 'coupon']);

        if ($cart->items->isEmpty()) {
            throw ValidationException::withMessages(['cart' => ['Your cart is empty.']]);
        }

        $shippingAddress = $this->resolveAddress($user, $data);
        $billingAddress = ($data['billing_same_as_shipping'] ?? true)
            ? $shippingAddress
            : ($data['billing_address'] ?? $shippingAddress);

        return DB::transaction(function () use ($user, $cart, $data, $shippingAddress, $billingAddress) {
            // Re-validate stock for physical product lines before committing.
            foreach ($cart->items as $item) {
                if ($item->type === 'product' && $item->productVariant) {
                    $variant = ProductVariant::query()->lockForUpdate()->find($item->productVariant->id);

                    if (! $variant || ! $variant->inStock($item->quantity)) {
                        throw ValidationException::withMessages([
                            'cart' => ["'{$item->name_snapshot}' no longer has enough stock."],
                        ]);
                    }
                }
            }

            $subtotalMinor = $cart->subtotalMinor();
            $discountMinor = $cart->discountMinor();
            $shippingMinor = 0;
            $totalMinor = max(0, $subtotalMinor - $discountMinor + $shippingMinor);

            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'user_id' => $user->id,
                'coupon_id' => $cart->coupon_id,
                'status' => OrderStatus::PendingPayment->value,
                'subtotal_minor' => $subtotalMinor,
                'discount_minor' => $discountMinor,
                'shipping_minor' => $shippingMinor,
                'total_minor' => $totalMinor,
                'currency' => PricingService::CURRENCY,
                'shipping_address' => $shippingAddress,
                'billing_address' => $billingAddress,
                'notes' => $data['notes'] ?? null,
                'placed_at' => now(),
            ]);

            foreach ($cart->items as $item) {
                $order->items()->create([
                    'type' => $item->type,
                    'product_variant_id' => $item->product_variant_id,
                    'product_id' => $item->productVariant?->product_id,
                    'name_snapshot' => $item->name_snapshot,
                    'design_configuration' => $item->design_configuration,
                    'quantity' => $item->quantity,
                    'unit_price_minor' => $item->unit_price_minor,
                    'total_price_minor' => $item->total_price_minor,
                ]);

                if ($item->type === 'product' && $item->product_variant_id) {
                    ProductVariant::query()->where('id', $item->product_variant_id)
                        ->decrement('stock', $item->quantity);
                }
            }

            if ($cart->coupon) {
                $cart->coupon->increment('used_count');
            }

            $razorpayOrder = $this->razorpay->createOrder(
                $order->total_minor,
                $order->currency,
                $order->order_number,
                ['app_order_id' => (string) $order->id]
            );

            Payment::create([
                'order_id' => $order->id,
                'gateway' => 'razorpay',
                'gateway_order_id' => $razorpayOrder['id'],
                'status' => Payment::STATUS_CREATED,
                'amount_minor' => $order->total_minor,
                'currency' => $order->currency,
                'raw_response' => $razorpayOrder,
            ]);

            // Empty the cart now that it has become an order.
            $cart->items()->delete();
            $cart->update(['coupon_id' => null]);

            return [
                'order' => $order->fresh(['items', 'payments']),
                'razorpay_order_id' => $razorpayOrder['id'],
                'razorpay_key_id' => config('services.razorpay.key'),
                'amount_minor' => $order->total_minor,
                'currency' => $order->currency,
            ];
        });
    }

    protected function resolveAddress(User $user, array $data): array
    {
        if (! empty($data['shipping_address_id'])) {
            $address = Address::query()->where('user_id', $user->id)->find($data['shipping_address_id']);

            if (! $address) {
                throw ValidationException::withMessages(['shipping_address_id' => ['The selected address is invalid.']]);
            }

            return $address->only(['label', 'full_name', 'phone', 'line1', 'line2', 'city', 'state', 'postal_code', 'country']);
        }

        if (! empty($data['shipping_address']) && is_array($data['shipping_address'])) {
            return $data['shipping_address'];
        }

        throw ValidationException::withMessages(['shipping_address_id' => ['A shipping address is required.']]);
    }

    protected function generateOrderNumber(): string
    {
        return 'CCP-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
    }
}
