import type { Metadata } from "next";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import * as catalogService from "@/services/catalog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await catalogService.getProductBySlug(slug);
    return {
      title: product.name,
      description: product.short_description || product.description?.slice(0, 155) || `Shop ${product.name}.`,
      alternates: { canonical: `/products/${slug}` },
      openGraph: {
        title: product.name,
        description: product.short_description,
        images: product.images?.[0]?.url ? [{ url: product.images[0].url }] : undefined,
      },
    };
  } catch {
    return {
      title: "Product",
      alternates: { canonical: `/products/${slug}` },
    };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
