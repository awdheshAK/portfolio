import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopBrowser } from "@/components/shop/ShopBrowser";
import { ProductGridSkeleton } from "@/components/ui/LoadingSkeleton";

export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Browse our full range of premium ready-to-wear clothing, filterable by category, size, color, fabric and price.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><ProductGridSkeleton /></div>}>
      <ShopBrowser />
    </Suspense>
  );
}
