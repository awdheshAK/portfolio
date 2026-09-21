"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Customer } from "@/types/api";
import * as customersService from "@/services/admin/customers";
import { DisabledBadge, OrderStatusBadge } from "@/components/admin/StatusBadge";
import { TextLineSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatMoney } from "@/lib/format";
import { getErrorMessage } from "@/lib/http";

const MEASUREMENT_FIELDS: Array<{ key: keyof NonNullable<Customer["measurements"]>[number]; label: string }> = [
  { key: "height", label: "Height" },
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "hip", label: "Hip" },
  { key: "shoulder", label: "Shoulder" },
  { key: "sleeve_length", label: "Sleeve length" },
  { key: "neck", label: "Neck" },
  { key: "inseam", label: "Inseam" },
  { key: "outseam", label: "Outseam" },
  { key: "garment_length", label: "Garment length" },
];

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customersService
      .getAdminCustomer(Number(params.id))
      .then(setCustomer)
      .catch((err) => setError(getErrorMessage(err, "Unable to load this customer.")));
  }, [params.id]);

  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!customer) return <TextLineSkeleton lines={10} />;

  return (
    <div className="max-w-4xl">
      <Link href="/admin/customers" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back to customers
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900">{customer.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {customer.email}
            {customer.phone ? ` · ${customer.phone}` : ""}
          </p>
        </div>
        <DisabledBadge disabled={customer.is_disabled} />
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-500">
        <span>{customer.orders_count ?? 0} orders</span>
        <span>{customer.designs_count ?? 0} saved designs</span>
        <span>{customer.addresses_count ?? 0} addresses</span>
        <span>{customer.measurements_count ?? 0} measurement profiles</span>
        <span>Joined {formatDate(customer.created_at)}</span>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Recent orders</h2>
        <div className="mt-3">
          {!customer.recent_orders || customer.recent_orders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {customer.recent_orders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-neutral-900 hover:underline">
                          {order.order_number ?? `#${order.id}`}
                        </Link>
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

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Addresses</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {!customer.addresses || customer.addresses.length === 0 ? (
            <EmptyState title="No saved addresses" />
          ) : (
            customer.addresses.map((address) => (
              <div key={address.id} className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
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
            ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Measurement profiles</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {!customer.measurements || customer.measurements.length === 0 ? (
            <EmptyState title="No saved measurements" />
          ) : (
            customer.measurements.map((m) => (
              <div key={m.id} className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
                <p className="font-medium text-neutral-900">{m.label}</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-neutral-600">
                  {MEASUREMENT_FIELDS.filter((f) => m[f.key] !== null && m[f.key] !== undefined).map((f) => (
                    <div key={String(f.key)} className="flex justify-between gap-2">
                      <dt className="text-neutral-400">{f.label}</dt>
                      <dd>{m[f.key]} cm</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
