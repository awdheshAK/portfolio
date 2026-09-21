"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import * as catalogService from "@/services/catalog";
import type { Fabric } from "@/types/api";

export function PopularFabrics() {
  const [fabrics, setFabrics] = useState<Fabric[] | null>(null);

  useEffect(() => {
    let active = true;
    catalogService
      .getFabrics()
      .then((data) => active && setFabrics(data.slice(0, 6)))
      .catch(() => active && setFabrics([]));
    return () => {
      active = false;
    };
  }, []);

  if (fabrics && fabrics.length === 0) return null;

  return (
    <section className="bg-neutral-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">Popular Fabrics</h2>
          <Link href="/fabrics" className="text-sm font-medium text-neutral-700 underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {(fabrics || Array.from({ length: 6 })).map((fabric, i) =>
            fabric ? (
              <Link key={(fabric as Fabric).id} href={`/fabrics/${(fabric as Fabric).slug}`} className="group block">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
                  <Image
                    src={(fabric as Fabric).image_url || "/placeholders/fabric.svg"}
                    alt={(fabric as Fabric).name}
                    fill
                    sizes="(min-width: 1024px) 16vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 text-center text-sm font-medium text-neutral-900">{(fabric as Fabric).name}</p>
              </Link>
            ) : (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="mx-auto h-3 w-2/3" />
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
