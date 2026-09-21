"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductGridSkeleton } from "@/components/ui/LoadingSkeleton";
import * as catalogService from "@/services/catalog";
import type { Product } from "@/types/api";

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    catalogService
      .getProducts({ sort: "newest" })
      .then((res) => {
        if (active) setProducts(res.data.slice(0, 8));
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (failed) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">Featured Products</h2>
        <Link href="/shop" className="text-sm font-medium text-neutral-700 underline-offset-4 hover:underline">
          View all
        </Link>
      </div>
      {products ? <ProductGrid products={products} /> : <ProductGridSkeleton />}
    </section>
  );
}
