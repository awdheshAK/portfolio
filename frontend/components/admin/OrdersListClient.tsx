"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AdminOrder, OrderStatus } from "@/types/api";
import * as ordersService from "@/services/admin/orders";
import { OrderStatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextLineSkeleton } from "@/components/ui/LoadingSkeleton";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, formatMoney } from "@/lib/format";
import { getErrorMessage } from "@/lib/http";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending_payment",
  "payment_confirmed",
  "processing",
  "customization_review",
  "production",
  "quality_check",
  "ready_to_ship",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export function OrdersListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") as OrderStatus | null) ?? "";
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setOrders(null);
    ordersService
      .getAdminOrders({ status: status || undefined, page })
      .then((res) => {
        setOrders(res.data);
        setLastPage(res.meta.last_page);
      })
      .catch((err) => setError(getErrorMessage(err, "Unable to load orders.")));
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  function updateQuery(next: { status?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.status !== undefined) {
      if (next.status) params.set("status", next.status);
      else params.delete("status");
      params.set("page", "1");
    }
    if (next.page !== undefined) params.set("page", String(next.page));
    router.push(`/admin/orders?${params.toString()}`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900">Orders</h1>
          <p className="mt-1 text-sm text-neutral-500">Track and update order fulfilment.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          Status
          <select
            value={status}
            onChange={(e) => updateQuery({ status: e.target.value })}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6">
        {error && <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!error && orders === null && <TextLineSkeleton lines={6} />}
        {!error && orders !== null && orders.length === 0 && (
          <EmptyState title="No orders found" description="Try a different status filter." />
        )}
        {!error && orders !== null && orders.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-neutral-900 hover:underline">
                        {order.order_number ?? `#${order.id}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      <div>{order.user?.name ?? order.shipping_address?.full_name ?? "—"}</div>
                      {order.user?.email && <div className="text-xs text-neutral-400">{order.user.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{formatMoney(order.total_minor, order.currency)}</td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={page} lastPage={lastPage} onPageChange={(p) => updateQuery({ page: p })} />
      </div>
    </div>
  );
}
