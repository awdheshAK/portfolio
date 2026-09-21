"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import * as catalogService from "@/services/catalog";
import { getErrorMessage } from "@/lib/http";

export interface PickedProduct {
  id: number;
  name: string;
}

/**
 * A searchable multi-select over the public GET /products?search= endpoint
 * (per the API contract's guidance for the collection product picker).
 * Selection is tracked as {id, name} pairs so already-selected products stay
 * visible as chips even after the search query changes.
 */
export function ProductPicker({
  selected,
  onChange,
  label = "Products",
}: {
  selected: PickedProduct[];
  onChange: (next: PickedProduct[]) => void;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const [results, setResults] = useState<PickedProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    setError(null);
    catalogService
      .getProducts({ search: debounced, page: 1 })
      .then((res) => {
        if (!cancelled) setResults(res.data.map((p) => ({ id: p.id, name: p.name })));
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "Search failed."));
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const selectedIds = new Set(selected.map((p) => p.id));

  function toggle(product: PickedProduct) {
    if (selectedIds.has(product.id)) {
      onChange(selected.filter((p) => p.id !== product.id));
    } else {
      onChange([...selected, product]);
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-neutral-900">{label}</span>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products by name…"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      />
      {isSearching && <p className="mt-1 text-xs text-neutral-400">Searching…</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {results.length > 0 && (
        <ul className="mt-2 max-h-40 overflow-y-auto rounded-md border border-neutral-200">
          {results.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => toggle(product)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                <span>{product.name}</span>
                <span className="text-xs text-neutral-400">{selectedIds.has(product.id) ? "Remove" : "Add"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {selected.length === 0 && <p className="text-xs text-neutral-400">No products selected yet.</p>}
        {selected.map((product) => (
          <span
            key={product.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800"
          >
            {product.name}
            <button
              type="button"
              onClick={() => toggle(product)}
              aria-label={`Remove ${product.name}`}
              className="text-neutral-500 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
