"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@/types/api";
import * as ordersService from "@/services/orders";
import { formatDate, formatMoney } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextLineSkeleton } from "@/components/ui/LoadingSkeleton";
import { getErrorMessage } from "@/lib/http";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ordersService
      .getOrders()
      .then(setOrders)
      .catch((err) => setError(getErrorMessage(err, "Unable to load your orders right now.")));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!orders) return <TextLineSkeleton lines={5} />;
  if (orders.length === 0) {
    return <EmptyState title="No orders yet" description="Your order history will show up here." actionLabel="Start shopping" actionHref="/shop" />;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/account/orders/${order.id}`}
          className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-900"
        >
          <div>
            <p className="text-sm font-semibold text-neutral-900">Order #{order.id}</p>
            <p className="text-xs text-neutral-500">{formatDate(order.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-neutral-900">{formatMoney(order.total_minor, order.currency)}</p>
            <p className="text-xs capitalize text-neutral-500">{order.status.replace(/_/g, " ")}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
