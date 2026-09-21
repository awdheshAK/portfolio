"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Collection } from "@/types/api";
import * as catalogService from "@/services/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getErrorMessage } from "@/lib/http";

export function CollectionDetailClient({ slug }: { slug: string }) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    catalogService
      .getCollectionBySlug(slug)
      .then(setCollection)
      .catch((err) => setError(getErrorMessage(err, "This collection couldn't be found.")));
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState title="Collection not found" description={error} actionLabel="Browse collections" actionHref="/collections" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-56 w-full rounded-xl" />
        <ProductGridSkeleton />
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-56 w-full sm:h-72">
        <Image src={collection.banner_image_url || "/placeholders/collection.svg"} alt={collection.name} fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{collection.name}</h1>
          {collection.description && <p className="mt-2 max-w-xl text-sm text-neutral-200">{collection.description}</p>}
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ProductGrid products={collection.products ?? []} />
      </div>
    </div>
  );
}
