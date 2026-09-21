"use client";

import { adminEmbroideryPositions } from "@/services/admin/customizerResources";
import { PositionResourcePage } from "@/components/admin/PositionResourcePage";

export default function AdminEmbroideryPositionsPage() {
  return (
    <PositionResourcePage
      title="Embroidery Positions"
      singularLabel="embroidery position"
      newButtonLabel="New Embroidery Position"
      description="Placements available for embroidered designs on a garment."
      service={adminEmbroideryPositions}
    />
  );
}
