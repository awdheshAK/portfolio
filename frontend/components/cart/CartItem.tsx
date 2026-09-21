"use client";

import Image from "next/image";
import { useState } from "react";
import type { CartItem as CartItemType } from "@/types/api";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/http";

export function CartItem({ item, compact = false }: { item: CartItemType; compact?: boolean }) {
  const { updateItem, removeItem, isMutating } = useCart();
  const { showToast } = useToast();
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const image = item.product?.images?.[0]?.url || item.preview_image_url || "/placeholders/product.svg";
  const name = item.product?.name || item.design_configuration?.text?.content || "Custom garment";

  async function handleQuantityChange(next: number) {
    if (next < 1) return;
    setLocalQuantity(next);
    try {
      await updateItem(item.id, next);
    } catch (err) {
      setLocalQuantity(item.quantity);
      showToast({ title: "Couldn't update quantity", description: getErrorMessage(err), variant: "error" });
    }
  }

  async function handleRemove() {
    try {
      await removeItem(item.id);
    } catch (err) {
      showToast({ title: "Couldn't remove item", description: getErrorMessage(err), variant: "error" });
    }
  }

  return (
    <div className="flex gap-4 py-4">
      <div className={`relative shrink-0 overflow-hidden rounded-lg bg-neutral-100 ${compact ? "h-16 w-16" : "h-24 w-24"}`}>
        <Image src={image} alt={name} fill sizes="120px" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">{name}</p>
            {item.type === "custom" && <p className="text-xs text-neutral-500">Custom design</p>}
            {item.variant_label && <p className="text-xs text-neutral-500">{item.variant_label}</p>}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isMutating}
            className="text-xs font-medium text-neutral-500 underline hover:text-neutral-900 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-full border border-neutral-300">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => handleQuantityChange(localQuantity - 1)}
              disabled={isMutating || localQuantity <= 1}
              className="px-2.5 py-1 text-sm text-neutral-700 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              −
            </button>
            <span className="min-w-6 text-center text-sm" aria-live="polite">
              {localQuantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => handleQuantityChange(localQuantity + 1)}
              disabled={isMutating}
              className="px-2.5 py-1 text-sm text-neutral-700 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              +
            </button>
          </div>
          <p className="text-sm font-semibold text-neutral-900">{formatMoney(item.total_price_minor)}</p>
        </div>
      </div>
    </div>
  );
}
