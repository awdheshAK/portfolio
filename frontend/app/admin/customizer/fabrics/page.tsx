"use client";

import type { AdminFabric, AdminFabricPayload } from "@/types/api";
import { adminFabrics } from "@/services/admin/customizerResources";
import { CustomizerResourceScreen } from "@/components/admin/CustomizerResourceScreen";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { formatMoney } from "@/lib/format";
import type { FieldSpec } from "@/components/admin/GenericConfigForm";

const FIELDS: FieldSpec[] = [
  { kind: "text", name: "name", label: "Name", required: true },
  { kind: "text", name: "slug", label: "Slug (optional — auto-generated if blank)" },
  { kind: "textarea", name: "description", label: "Description" },
  { kind: "money", name: "price_delta_minor", label: "Price adjustment" },
  { kind: "checkbox", name: "is_active", label: "Active" },
];

export default function AdminFabricsPage() {
  return (
    <CustomizerResourceScreen<AdminFabric, AdminFabricPayload>
      title="Fabrics"
      singularLabel="fabric"
      newButtonLabel="New Fabric"
      description="Fabric choices available in the garment customizer."
      service={adminFabrics}
      fields={FIELDS}
      getName={(f) => f.name}
      toInitialValues={(item) => ({
        name: item?.name ?? "",
        slug: item?.slug ?? "",
        description: item?.description ?? "",
        price_delta_minor: item?.price_delta_minor ?? 0,
        is_active: item?.is_active ?? true,
      })}
      buildPayload={(values) => ({
        name: values.name as string,
        slug: (values.slug as string)?.trim() || undefined,
        description: (values.description as string)?.trim() || undefined,
        price_delta_minor: (values.price_delta_minor as number) ?? 0,
        is_active: Boolean(values.is_active),
      })}
      columns={[
        { header: "Name", render: (f) => <span className="font-medium text-neutral-900">{f.name}</span> },
        { header: "Slug", render: (f) => <span className="text-neutral-500">{f.slug}</span> },
        { header: "Price adjustment", render: (f) => formatMoney(f.price_delta_minor) },
        { header: "Status", render: (f) => <ActiveBadge active={f.is_active} /> },
      ]}
    />
  );
}
