"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Order } from "@/types/api";
import * as ordersService from "@/services/orders";
import { formatMoney } from "@/lib/format";
import { getErrorMessage } from "@/lib/http";

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    ordersService
      .getOrder(Number(orderId))
      .then(setOrder)
      .catch((err) => setError(getErrorMessage(err, "We couldn't load your order confirmation.")));
  }, [orderId]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div>
      <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">Payment confirmed</h1>
      <p className="mt-2 text-neutral-600">Thank you — your order has been placed and payment verified.</p>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {order && (
        <div className="mt-8 rounded-xl border border-neutral-200 p-6 text-left">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-900">Order #{order.id}</p>
            <p className="text-sm capitalize text-neutral-500">{order.status.replace(/_/g, " ")}</p>
          </div>
          <p className="mt-2 text-sm text-neutral-600">Total paid: {formatMoney(order.total_minor, order.currency)}</p>
        </div>
      )}

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/account/orders" className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-700">
          View My Orders
        </Link>
        <Link href="/shop" className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 hover:border-neutral-900">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
