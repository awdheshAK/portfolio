"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { DashboardStats } from "@/types/api";
import * as dashboardService from "@/services/admin/dashboard";
import { formatDate, formatMoney } from "@/lib/format";
import { OrderStatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextLineSkeleton } from "@/components/ui/LoadingSkeleton";
import { getErrorMessage } from "@/lib/http";
import { cn } from "@/lib/cn";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardService
      .getDashboardStats()
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err, "Unable to load the dashboard.")));
  }, []);

  if (error) {
    return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  }

  if (!stats) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5">
              <TextLineSkeleton lines={2} />
            </div>
          ))}
        </div>
        <TextLineSkeleton lines={8} />
      </div>
    );
  }

  const lowStockRows = stats.low_stock.flatMap((product) =>
    (product.variants ?? []).map((variant) => ({
      key: `${product.id}-${variant.id ?? variant.sku}`,
      productName: product.name,
      productId: product.id,
      sku: variant.sku,
      stock: variant.stock ?? 0,
    }))
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">An overview of store activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Revenue" value={formatMoney(stats.revenue_minor)} />
        <StatTile label="Total orders" value={stats.orders_count.toLocaleString("en-IN")} />
        <StatTile
          label="Pending orders"
          value={stats.pending_orders_count.toLocaleString("en-IN")}
          href="/admin/orders?status=pending_payment"
        />
        <StatTile label="Customers" value={stats.customers_count.toLocaleString("en-IN")} href="/admin/customers" />
        <StatTile label="Products" value={stats.products_count.toLocaleString("en-IN")} href="/admin/products" />
      </div>

      <OrderStatusBreakdown orders={stats.recent_orders} />

      <section>
        <h2 className="text-lg font-semibold text-neutral-900">Low stock</h2>
        <p className="mt-1 text-sm text-neutral-500">Variants at or below the low-stock threshold.</p>
        <div className="mt-4">
          {lowStockRows.length === 0 ? (
            <EmptyState title="Nothing running low" description="Every variant is comfortably stocked." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Variant SKU</th>
                    <th className="px-4 py-3">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {lowStockRows.map((row) => (
                    <tr key={row.key} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <Link href="/admin/products" className="font-medium text-neutral-900 hover:underline">
                          {row.productName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600">{row.sku}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                            row.stock <= 0
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                          )}
                        >
                          {row.stock} left
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-900">Recent orders</h2>
        <div className="mt-4">
          {stats.recent_orders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
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
                  {stats.recent_orders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-neutral-900 hover:underline">
                          {order.order_number ?? `#${order.id}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {order.user?.name ?? order.shipping_address?.full_name ?? "—"}
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
        </div>
      </section>
    </div>
  );
}

function StatTile({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 font-serif text-2xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
  if (!href) return content;
  return (
    <Link href={href} className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900">
      {content}
    </Link>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-amber-400",
  payment_confirmed: "bg-blue-400",
  processing: "bg-blue-500",
  customization_review: "bg-purple-400",
  production: "bg-purple-500",
  quality_check: "bg-purple-600",
  ready_to_ship: "bg-teal-400",
  shipped: "bg-teal-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-neutral-400",
  refunded: "bg-red-400",
};

function OrderStatusBreakdown({ orders }: { orders: DashboardStats["recent_orders"] }) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orders) {
      map.set(order.status, (map.get(order.status) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  if (counts.length === 0) return null;
  const total = orders.length;

  return (
    <section>
      <h2 className="text-lg font-semibold text-neutral-900">Recent order status mix</h2>
      <p className="mt-1 text-sm text-neutral-500">Distribution across the {total} most recent orders.</p>
      <div className="mt-4 space-y-2 rounded-lg border border-neutral-200 bg-white p-5">
        {counts.map(([status, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={status} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate capitalize text-neutral-700">{status.replace(/_/g, " ")}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={cn("h-full rounded-full", STATUS_COLORS[status] ?? "bg-neutral-400")}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-neutral-500">
                {count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
