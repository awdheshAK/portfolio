"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Order } from "@/types/api";
import * as ordersService from "@/services/orders";
import { formatDate, formatMoney } from "@/lib/format";
import { TextLineSkeleton } from "@/components/ui/LoadingSkeleton";
import { getErrorMessage } from "@/lib/http";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ordersService
      .getOrder(Number(params.id))
      .then(setOrder)
      .catch((err) => setError(getErrorMessage(err, "Unable to load this order.")));
  }, [params.id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!order) return <TextLineSkeleton lines={6} />;

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back to orders
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-neutral-900">Order #{order.id}</h2>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize text-neutral-700">
          {order.status.replace(/_/g, " ")}
        </span>
      </div>
      <p className="mt-1 text-sm text-neutral-500">Placed on {formatDate(order.created_at)}</p>

      <div className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4 p-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100">
              <Image
                src={item.product?.images?.[0]?.url || item.preview_image_url || "/placeholders/product.svg"}
                alt={item.product?.name || "Custom garment"}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900">{item.product?.name || "Custom design"}</p>
                <p className="text-xs text-neutral-500">Qty {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-neutral-900">{formatMoney(item.total_price_minor, order.currency)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
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
      </div>

      {order.shipping_address && (
        <div className="mt-8 rounded-lg border border-neutral-200 p-4 text-sm">
          <p className="font-medium text-neutral-900">Shipping Address</p>
          <p className="mt-1 text-neutral-600">
            {order.shipping_address.full_name}
            <br />
            {order.shipping_address.line1}
            {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ""}
            <br />
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
          </p>
        </div>
      )}
    </div>
  );
}
