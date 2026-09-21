"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types/api";
import { DiscountBadge, PriceDisplay } from "@/components/product/PriceDisplay";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import * as wishlistService from "@/services/wishlist";
import { getErrorMessage } from "@/lib/http";

export function ProductCard({ product }: { product: Product }) {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlistBusy, setIsWishlistBusy] = useState(false);

  const image = product.images?.[0];
  const defaultVariant = product.variants?.[0];

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    try {
      await addItem({
        type: "product",
        product_variant_id: defaultVariant?.id,
        quantity: 1,
      });
      showToast({ title: "Added to cart", description: product.name, variant: "success" });
    } catch (err) {
      showToast({ title: "Couldn't add to cart", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsAdding(false);
    }
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast({ title: "Please sign in", description: "Log in to save items to your wishlist.", variant: "info" });
      return;
    }
    setIsWishlistBusy(true);
    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(product.id);
        setIsWishlisted(false);
      } else {
        await wishlistService.addToWishlist(product.id);
        setIsWishlisted(true);
      }
    } catch (err) {
      showToast({ title: "Wishlist update failed", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsWishlistBusy(false);
    }
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block focus-visible:outline-none">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100">
        <Image
          src={image?.url || "/placeholders/product.svg"}
          alt={image?.alt || product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <DiscountBadge priceMinor={product.price_minor} salePriceMinor={product.sale_price_minor} />
        <button
          type="button"
          onClick={handleWishlist}
          disabled={isWishlistBusy}
          aria-pressed={isWishlisted}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm transition-colors hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          <span aria-hidden="true">{isWishlisted ? "♥" : "♡"}</span>
        </button>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/60 to-transparent p-3 transition-transform duration-300 group-hover:translate-y-0 group-focus-within:translate-y-0">
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isAdding}
            className="pointer-events-auto w-full rounded-full bg-white py-2 text-xs font-semibold uppercase tracking-wide text-neutral-900 transition-colors hover:bg-neutral-100 disabled:opacity-60"
          >
            {isAdding ? "Adding…" : "Quick add"}
          </button>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium text-neutral-900 group-hover:underline">{product.name}</h3>
        <PriceDisplay priceMinor={product.price_minor} salePriceMinor={product.sale_price_minor} size="sm" />
        {product.colors?.length > 0 && (
          <div className="flex gap-1 pt-1">
            {product.colors.slice(0, 5).map((color) => (
              <span
                key={color.id}
                title={color.name}
                className="h-3.5 w-3.5 rounded-full border border-neutral-200"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
