"use client";

import { adminPrintPositions } from "@/services/admin/customizerResources";
import { PositionResourcePage } from "@/components/admin/PositionResourcePage";

export default function AdminPrintPositionsPage() {
  return (
    <PositionResourcePage
      title="Print Positions"
      singularLabel="print position"
      newButtonLabel="New Print Position"
      description="Placements available for printed designs on a garment."
      service={adminPrintPositions}
    />
  );
}
