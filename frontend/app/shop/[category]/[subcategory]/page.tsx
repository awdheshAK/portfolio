import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopBrowser } from "@/components/shop/ShopBrowser";
import { ProductGridSkeleton } from "@/components/ui/LoadingSkeleton";

interface Props {
  params: Promise<{ category: string; subcategory: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, subcategory } = await params;
  const title = subcategory.replace(/-/g, " ");
  return {
    title: `${title.charAt(0).toUpperCase()}${title.slice(1)}`,
    description: `Shop our ${title} collection.`,
    alternates: { canonical: `/shop/${category}/${subcategory}` },
  };
}

export default async function ShopSubcategoryPage({ params }: Props) {
  const { category, subcategory } = await params;
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><ProductGridSkeleton /></div>}>
      <ShopBrowser category={category} subcategory={subcategory} />
    </Suspense>
  );
}
