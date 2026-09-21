"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductGridSkeleton } from "@/components/ui/LoadingSkeleton";
import { Pagination } from "@/components/ui/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import * as catalogService from "@/services/catalog";
import type { Product, ProductListParams } from "@/types/api";
import { getErrorMessage } from "@/lib/http";
import { cn } from "@/lib/cn";

const SORT_OPTIONS: Array<{ value: NonNullable<ProductListParams["sort"]>; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const COLOR_OPTIONS = [
  { label: "Black", value: "black", hex: "#111111" },
  { label: "White", value: "white", hex: "#f5f5f5" },
  { label: "Navy", value: "navy", hex: "#1c2a4a" },
  { label: "Grey", value: "grey", hex: "#8a8a8a" },
  { label: "Beige", value: "beige", hex: "#d8c9a8" },
  { label: "Red", value: "red", hex: "#b3261e" },
];

export function ShopBrowser({ category, subcategory }: { category?: string; subcategory?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [fabricOptions, setFabricOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const sort = (searchParams.get("sort") as ProductListParams["sort"]) || "newest";
  const color = searchParams.get("color") || "";
  const size = searchParams.get("size") || "";
  const fabric = searchParams.get("fabric") || "";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";
  const page = Number(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";

  const debouncedMinPrice = useDebounce(minPrice, 400);
  const debouncedMaxPrice = useDebounce(maxPrice, 400);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (!("page" in updates)) next.delete("page");
      router.push(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    const categorySlug = subcategory || category;
    catalogService
      .getProducts({
        category: categorySlug,
        sort,
        color: color || undefined,
        size: size || undefined,
        fabric: fabric || undefined,
        min_price: debouncedMinPrice ? Number(debouncedMinPrice) * 100 : undefined,
        max_price: debouncedMaxPrice ? Number(debouncedMaxPrice) * 100 : undefined,
        search: search || undefined,
        page,
      })
      .then((res) => {
        if (!active) return;
        setProducts(res.data);
        setMeta(res.meta);
        const fabrics = Array.from(new Set(res.data.map((p) => p.fabric?.name).filter(Boolean))) as string[];
        setFabricOptions(fabrics);
      })
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err, "Unable to load products right now."));
        setProducts([]);
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [category, subcategory, sort, color, size, fabric, debouncedMinPrice, debouncedMaxPrice, search, page]);

  const activeFilterCount = useMemo(
    () => [color, size, fabric, minPrice, maxPrice].filter(Boolean).length,
    [color, size, fabric, minPrice, maxPrice]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">
            {subcategory ? titleCase(subcategory) : category ? titleCase(category) : "All Products"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{meta.total} products</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen((v) => !v)}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-900 lg:hidden"
            aria-expanded={isFilterPanelOpen}
            aria-controls="shop-filters"
          >
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            Sort
            <select
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside id="shop-filters" className={cn("space-y-8", isFilterPanelOpen ? "block" : "hidden lg:block")}>
          <FilterGroup label="Color">
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateParams({ color: color === opt.value ? undefined : opt.value })}
                  aria-pressed={color === opt.value}
                  title={opt.label}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
                    color === opt.value ? "border-neutral-900" : "border-white ring-1 ring-neutral-200"
                  )}
                  style={{ backgroundColor: opt.hex }}
                >
                  <span className="sr-only">{opt.label}</span>
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Size">
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateParams({ size: size === opt ? undefined : opt })}
                  aria-pressed={size === opt}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
                    size === opt ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </FilterGroup>

          {fabricOptions.length > 0 && (
            <FilterGroup label="Fabric">
              <div className="flex flex-col gap-2">
                {fabricOptions.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="radio"
                      name="fabric"
                      checked={fabric === opt}
                      onChange={() => updateParams({ fabric: opt })}
                      className="h-4 w-4"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </FilterGroup>
          )}

          <FilterGroup label="Price (₹)">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => updateParams({ min_price: e.target.value || undefined })}
                placeholder="Min"
                className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              />
              <span className="text-neutral-400">–</span>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => updateParams({ max_price: e.target.value || undefined })}
                placeholder="Max"
                className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              />
            </div>
          </FilterGroup>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => updateParams({ color: undefined, size: undefined, fabric: undefined, min_price: undefined, max_price: undefined })}
              className="text-sm font-medium text-neutral-600 underline hover:text-neutral-900"
            >
              Clear all filters
            </button>
          )}
        </aside>

        <div>
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
          ) : isLoading ? (
            <ProductGridSkeleton />
          ) : (
            <>
              <ProductGrid products={products} />
              <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={(p) => updateParams({ page: String(p) })} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-neutral-900">{label}</h3>
      {children}
    </div>
  );
}

function titleCase(value: string): string {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
