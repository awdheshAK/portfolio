"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Fabric } from "@/types/api";
import * as catalogService from "@/services/catalog";
import { Skeleton, TextLineSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getErrorMessage } from "@/lib/http";

export function FabricDetailClient({ slug }: { slug: string }) {
  const [fabric, setFabric] = useState<Fabric | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    catalogService
      .getFabricBySlug(slug)
      .then(setFabric)
      .catch((err) => setError(getErrorMessage(err, "This fabric couldn't be found.")));
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState title="Fabric not found" description={error} actionLabel="Browse fabrics" actionHref="/fabrics" />
      </div>
    );
  }

  if (!fabric) {
    return (
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <TextLineSkeleton lines={5} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
          <Image src={fabric.image_url || "/placeholders/fabric.svg"} alt={fabric.name} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">{fabric.name}</h1>
          {fabric.description && <p className="mt-3 text-sm leading-relaxed text-neutral-600">{fabric.description}</p>}
          <dl className="mt-6 space-y-2 text-sm">
            {fabric.composition && (
              <div className="flex gap-2">
                <dt className="font-medium text-neutral-900">Composition:</dt>
                <dd className="text-neutral-600">{fabric.composition}</dd>
              </div>
            )}
            {fabric.weight_gsm && (
              <div className="flex gap-2">
                <dt className="font-medium text-neutral-900">Weight:</dt>
                <dd className="text-neutral-600">{fabric.weight_gsm} GSM</dd>
              </div>
            )}
            {fabric.care_instructions && (
              <div className="flex gap-2">
                <dt className="font-medium text-neutral-900">Care:</dt>
                <dd className="text-neutral-600">{fabric.care_instructions}</dd>
              </div>
            )}
          </dl>
          <Link
            href="/customize"
            className="mt-8 inline-flex items-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            Customize a garment
          </Link>
        </div>
      </div>
    </div>
  );
}
