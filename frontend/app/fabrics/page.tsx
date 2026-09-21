import type { Metadata } from "next";
import { FabricsGridClient } from "@/components/fabrics/FabricsGridClient";

export const metadata: Metadata = {
  title: "Fabrics",
  description: "Explore the premium fabrics available for our ready-to-wear and custom garments.",
  alternates: { canonical: "/fabrics" },
};

export default function FabricsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">Fabrics</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Every garment starts with the right fabric. Browse our curated range, each quality-checked for comfort and durability.
      </p>
      <div className="mt-8">
        <FabricsGridClient />
      </div>
    </div>
  );
}
