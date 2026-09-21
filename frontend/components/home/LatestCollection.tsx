"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as catalogService from "@/services/catalog";
import type { Collection } from "@/types/api";
import { Skeleton } from "@/components/ui/LoadingSkeleton";

export function LatestCollection() {
  const [collection, setCollection] = useState<Collection | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    catalogService
      .getCollections()
      .then((data) => active && setCollection(data[0] ?? null))
      .catch(() => active && setCollection(null));
    return () => {
      active = false;
    };
  }, []);

  if (collection === null) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {collection === undefined ? (
        <Skeleton className="h-72 w-full rounded-2xl sm:h-96" />
      ) : (
        <Link href={`/collections/${collection.slug}`} className="group relative block overflow-hidden rounded-2xl">
          <div className="relative h-72 w-full sm:h-96">
            <Image
              src={collection.banner_image_url || "/placeholders/collection.svg"}
              alt={collection.name}
              fill
              sizes="100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-200">Latest Collection</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">{collection.name}</h2>
            <span className="mt-4 inline-block border-b border-white pb-0.5 text-sm font-medium">Explore the collection</span>
          </div>
        </Link>
      )}
    </section>
  );
}
