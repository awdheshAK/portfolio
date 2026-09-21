"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Fabric } from "@/types/api";
import * as catalogService from "@/services/catalog";
import { ProductGridSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getErrorMessage } from "@/lib/http";

export function FabricsGridClient() {
  const [fabrics, setFabrics] = useState<Fabric[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    catalogService
      .getFabrics()
      .then(setFabrics)
      .catch((err) => setError(getErrorMessage(err, "Unable to load fabrics right now.")));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!fabrics) return <ProductGridSkeleton />;
  if (fabrics.length === 0) return <EmptyState title="No fabrics listed yet" description="Check back soon." />;

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {fabrics.map((fabric) => (
        <Link key={fabric.id} href={`/fabrics/${fabric.slug}`} className="group block">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
            <Image
              src={fabric.image_url || "/placeholders/fabric.svg"}
              alt={fabric.name}
              fill
              sizes="(min-width: 1024px) 22vw, 45vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <p className="mt-2 text-sm font-medium text-neutral-900">{fabric.name}</p>
          {fabric.composition && <p className="text-xs text-neutral-500">{fabric.composition}</p>}
        </Link>
      ))}
    </div>
  );
}
