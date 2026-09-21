"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { AdminOrder, Address, OrderStatus } from "@/types/api";
import * as ordersService from "@/services/admin/orders";
import { OrderStatusBadge } from "@/components/admin/StatusBadge";
import { TextLineSkeleton } from "@/components/ui/LoadingSkeleton";
import { useToast } from "@/hooks/useToast";
import { formatDateTime, formatMoney } from "@/lib/format";
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

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<OrderStatus | "">("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  useEffect(() => {
    ordersService
      .getAdminOrder(Number(params.id))
      .then((data) => {
        setOrder(data);
        setStatusDraft(data.status);
      })
      .catch((err) => setError(getErrorMessage(err, "Unable to load this order.")));
  }, [params.id]);

  async function handleSaveStatus() {
    if (!order || !statusDraft || statusDraft === order.status) return;
    setIsSavingStatus(true);
    try {
      const updated = await ordersService.updateAdminOrderStatus(order.id, statusDraft);
      setOrder(updated);
      setStatusDraft(updated.status);
      showToast({ title: "Order status updated", variant: "success" });
    } catch (err) {
      showToast({ title: "Couldn't update status", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsSavingStatus(false);
    }
  }

  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!order) return <TextLineSkeleton lines={10} />;

  return (
    <div className="max-w-4xl">
      <Link href="/admin/orders" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900">{order.order_number ?? `Order #${order.id}`}</h1>
          <p className="mt-1 text-sm text-neutral-500">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Update status</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value as OrderStatus)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSaveStatus}
            disabled={isSavingStatus || statusDraft === order.status}
            className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
          >
            {isSavingStatus ? "Saving…" : "Save status"}
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Customer</h2>
          {order.user ? (
            <div className="mt-3 text-sm">
              <p className="font-medium text-neutral-900">{order.user.name}</p>
              <p className="text-neutral-500">{order.user.email}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-neutral-400">
              Not available from this order record — see {order.shipping_address?.full_name ?? "the shipping address"} below.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Payment</h2>
          {order.payments && order.payments.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {order.payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3">
                  <span className="capitalize text-neutral-700">
                    {payment.gateway} · {payment.status}
                  </span>
                  <span className="font-medium text-neutral-900">{formatMoney(payment.amount_minor, payment.currency)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-neutral-400">No payment records available for this order yet.</p>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <AddressBlock title="Shipping address" address={order.shipping_address} />
        <AddressBlock
          title="Billing address"
          address={order.billing_same_as_shipping ? order.shipping_address : order.billing_address}
        />
      </section>

      {order.notes && (
        <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Order notes</h2>
          <p className="mt-2 text-sm text-neutral-700">{order.notes}</p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Items</h2>
        <div className="mt-3 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {order.items.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  <Image
                    src={item.product?.images?.[0]?.url || item.preview_image_url || "/placeholders/product.svg"}
                    alt={item.product?.name || "Custom garment"}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.product?.name || "Custom design"}</p>
                    <p className="text-xs text-neutral-500">
                      Qty {item.quantity} · {formatMoney(item.unit_price_minor, order.currency)} each
                    </p>
                    {item.design_configuration && (
                      <span className="mt-1 inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-800">
                        Custom design
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-neutral-900">{formatMoney(item.total_price_minor, order.currency)}</p>
                </div>
              </div>
              {item.design_configuration && (
                <details className="mt-3 rounded-md bg-neutral-50 p-3">
                  <summary className="cursor-pointer text-xs font-medium text-neutral-600">View design configuration</summary>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs text-neutral-600">
                    {JSON.stringify(item.design_configuration, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal</span>
          <span>{formatMoney(order.subtotal_minor, order.currency)}</span>
        </div>
        {!!order.shipping_minor && (
          <div className="flex justify-between text-neutral-600">
            <span>Shipping</span>
            <span>{formatMoney(order.shipping_minor, order.currency)}</span>
          </div>
        )}
        {!!order.discount_minor && (
          <div className="flex justify-between text-emerald-700">
            <span>Discount</span>
            <span>−{formatMoney(order.discount_minor, order.currency)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-neutral-200 pt-1 font-semibold text-neutral-900">
          <span>Total</span>
          <span>{formatMoney(order.total_minor, order.currency)}</span>
        </div>
      </section>
    </div>
  );
}

function AddressBlock({ title, address }: { title: string; address?: Address | null }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
      {address ? (
        <div className="mt-3 text-sm text-neutral-700">
          <p className="font-medium text-neutral-900">{address.full_name}</p>
          <p>
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
          </p>
          <p>
            {address.city}, {address.state} {address.postal_code}
          </p>
          <p>{address.country}</p>
          <p className="mt-1 text-neutral-500">{address.phone}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-400">Not provided.</p>
      )}
    </div>
  );
}
