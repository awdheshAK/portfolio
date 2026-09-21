"use client";

import { useEffect, useState } from "react";
import type { WishlistItem } from "@/types/api";
import * as wishlistService from "@/services/wishlist";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductGridSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getErrorMessage } from "@/lib/http";

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    wishlistService
      .getWishlist()
      .then(setItems)
      .catch((err) => setError(getErrorMessage(err, "Unable to load your wishlist.")));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!items) return <ProductGridSkeleton count={4} />;
  if (items.length === 0) {
    return <EmptyState title="Your wishlist is empty" description="Save products you love to find them here later." actionLabel="Browse products" actionHref="/shop" />;
  }

  return <ProductGrid products={items.map((item) => item.product)} />;
}
