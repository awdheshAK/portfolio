import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopBrowser } from "@/components/shop/ShopBrowser";
import { ProductGridSkeleton } from "@/components/ui/LoadingSkeleton";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const title = category.replace(/-/g, " ");
  return {
    title: `${title.charAt(0).toUpperCase()}${title.slice(1)}`,
    description: `Shop our ${title} collection.`,
    alternates: { canonical: `/shop/${category}` },
  };
}

export default async function ShopCategoryPage({ params }: Props) {
  const { category } = await params;
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><ProductGridSkeleton /></div>}>
      <ShopBrowser category={category} />
    </Suspense>
  );
}
