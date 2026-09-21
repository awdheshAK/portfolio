import type { Metadata } from "next";
import { CollectionsGridClient } from "@/components/collections/CollectionsGridClient";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse our curated seasonal and themed clothing collections.",
  alternates: { canonical: "/collections" },
};

export default function CollectionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">Collections</h1>
      <div className="mt-8">
        <CollectionsGridClient />
      </div>
    </div>
  );
}
