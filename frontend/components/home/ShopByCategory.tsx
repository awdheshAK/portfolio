"use client";

import { useEffect, useState } from "react";
import { CategoryCard } from "@/components/product/CategoryCard";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import * as catalogService from "@/services/catalog";
import type { Category } from "@/types/api";

export function ShopByCategory() {
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    let active = true;
    catalogService
      .getCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (categories && categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">Shop by Category</h2>
      </div>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {(categories || Array.from({ length: 5 })).map((category, i) =>
          category ? (
            <CategoryCard key={(category as Category).id} category={category as Category} />
          ) : (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="mx-auto h-3 w-2/3" />
            </div>
          )
        )}
      </div>
    </section>
  );
}
