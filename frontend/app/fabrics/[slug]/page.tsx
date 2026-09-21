import type { Metadata } from "next";
import { FabricDetailClient } from "@/components/fabrics/FabricDetailClient";
import * as catalogService from "@/services/catalog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const fabric = await catalogService.getFabricBySlug(slug);
    return {
      title: fabric.name,
      description: fabric.description?.slice(0, 155) || `Learn about our ${fabric.name} fabric.`,
      alternates: { canonical: `/fabrics/${slug}` },
    };
  } catch {
    return { title: "Fabric", alternates: { canonical: `/fabrics/${slug}` } };
  }
}

export default async function FabricDetailPage({ params }: Props) {
  const { slug } = await params;
  return <FabricDetailClient slug={slug} />;
}
