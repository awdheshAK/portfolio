"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Collection } from "@/types/api";
import * as catalogService from "@/services/catalog";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getErrorMessage } from "@/lib/http";

export function CollectionsGridClient() {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    catalogService
      .getCollections()
      .then(setCollections)
      .catch((err) => setError(getErrorMessage(err, "Unable to load collections right now.")));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!collections) {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (collections.length === 0) return <EmptyState title="No collections yet" description="Check back soon." />;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {collections.map((collection) => (
        <Link key={collection.id} href={`/collections/${collection.slug}`} className="group relative block overflow-hidden rounded-xl">
          <div className="relative h-64 w-full">
            <Image
              src={collection.banner_image_url || "/placeholders/collection.svg"}
              alt={collection.name}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h2 className="font-serif text-xl font-semibold">{collection.name}</h2>
          </div>
        </Link>
      ))}
    </div>
  );
}
