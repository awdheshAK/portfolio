import type { Metadata } from "next";
import { CollectionDetailClient } from "@/components/collections/CollectionDetailClient";
import * as catalogService from "@/services/catalog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const collection = await catalogService.getCollectionBySlug(slug);
    return {
      title: collection.name,
      description: collection.description?.slice(0, 155) || `Shop the ${collection.name} collection.`,
      alternates: { canonical: `/collections/${slug}` },
      openGraph: collection.banner_image_url ? { images: [{ url: collection.banner_image_url }] } : undefined,
    };
  } catch {
    return { title: "Collection", alternates: { canonical: `/collections/${slug}` } };
  }
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  return <CollectionDetailClient slug={slug} />;
}
