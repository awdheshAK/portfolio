"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "@/components/cart/CartItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMoney } from "@/lib/format";

export function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, isLoading } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDrawerOpen) return;
    panelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[95]">
      <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl focus:outline-none"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Your Cart</h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-neutral-500">Loading your cart…</p>
          ) : cart.items.length === 0 ? (
            <EmptyState title="Your cart is empty" description="Browse the shop or start a custom design." className="my-8 border-0 bg-transparent" />
          ) : (
            <div className="divide-y divide-neutral-100">
              {cart.items.map((item) => (
                <CartItem key={item.id} item={item} compact />
              ))}
            </div>
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="border-t border-neutral-200 px-5 py-4">
            <div className="mb-4 flex items-center justify-between text-sm font-semibold text-neutral-900">
              <span>Subtotal</span>
              <span>{formatMoney(cart.subtotal_minor, cart.currency)}</span>
            </div>
            <Link
              href="/cart"
              onClick={closeDrawer}
              className="block w-full rounded-full border border-neutral-900 py-3 text-center text-sm font-medium text-neutral-900 hover:bg-neutral-100"
            >
              View Cart
            </Link>
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="mt-2 block w-full rounded-full bg-neutral-900 py-3 text-center text-sm font-medium text-white hover:bg-neutral-700"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
