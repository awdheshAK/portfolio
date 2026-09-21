"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Design } from "@/types/api";
import * as designsService from "@/services/designs";
import { useToast } from "@/hooks/useToast";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductGridSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/http";

export default function DesignsPage() {
  const [designs, setDesigns] = useState<Design[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    designsService
      .getDesigns()
      .then(setDesigns)
      .catch((err) => setError(getErrorMessage(err, "Unable to load your saved designs.")));
  }, []);

  async function handleDelete(id: number) {
    try {
      await designsService.deleteDesign(id);
      setDesigns((prev) => prev?.filter((d) => d.id !== id) ?? null);
    } catch (err) {
      showToast({ title: "Couldn't delete design", description: getErrorMessage(err), variant: "error" });
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!designs) return <ProductGridSkeleton count={4} />;
  if (designs.length === 0) {
    return (
      <EmptyState title="No saved designs" description="Anything you save from the customizer will show up here." actionLabel="Start Customizing" actionHref="/customize" />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {designs.map((design) => (
        <div key={design.id} className="rounded-xl border border-neutral-200 p-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
            <Image src={design.preview_image_url || "/placeholders/product.svg"} alt={design.name} fill sizes="240px" className="object-cover" unoptimized />
          </div>
          <p className="mt-3 text-sm font-semibold text-neutral-900">{design.name}</p>
          {design.created_at && <p className="text-xs text-neutral-500">Saved {formatDate(design.created_at)}</p>}
          <div className="mt-3 flex gap-3 text-sm">
            <Link href="/customize" className="font-medium text-neutral-900 underline">
              Start a new design
            </Link>
            <button type="button" onClick={() => handleDelete(design.id)} className="text-neutral-500 underline hover:text-red-600">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
