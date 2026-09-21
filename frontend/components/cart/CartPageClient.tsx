"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { CartItem } from "@/components/cart/CartItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { getErrorMessage } from "@/lib/http";

export function CartPageClient() {
  const { cart, isLoading, isMutating, applyCoupon, removeCoupon } = useCart();
  const { showToast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setIsApplying(true);
    try {
      await applyCoupon(couponCode.trim());
      showToast({ title: "Coupon applied", variant: "success" });
    } catch (err) {
      showToast({ title: "Couldn't apply coupon", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsApplying(false);
    }
  }

  async function handleRemoveCoupon() {
    try {
      await removeCoupon();
    } catch (err) {
      showToast({ title: "Couldn't remove coupon", description: getErrorMessage(err), variant: "error" });
    }
  }

  if (isLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-neutral-500">Loading your cart…</div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Your cart is empty"
          description="Browse the shop or design something custom to get started."
          actionLabel="Start Shopping"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">Your Cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-neutral-200">
          {cart.items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        <div className="space-y-6">
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <label htmlFor="coupon-code" className="sr-only">
              Coupon code
            </label>
            <input
              id="coupon-code"
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon code"
              className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            />
            <button
              type="submit"
              disabled={isApplying || isMutating}
              className="rounded-md border border-neutral-900 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
            >
              Apply
            </button>
          </form>
          {cart.coupon_code && (
            <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <span>Coupon &ldquo;{cart.coupon_code}&rdquo; applied</span>
              <button type="button" onClick={handleRemoveCoupon} className="underline">
                Remove
              </button>
            </div>
          )}

          <OrderSummary cart={cart} />

          <Link
            href="/checkout"
            className="block w-full rounded-full bg-neutral-900 py-3.5 text-center text-sm font-semibold text-white hover:bg-neutral-700"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
