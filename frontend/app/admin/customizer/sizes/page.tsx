"use client";

import type { AdminSize, AdminSizePayload } from "@/types/api";
import { adminSizes } from "@/services/admin/customizerResources";
import { CustomizerResourceScreen } from "@/components/admin/CustomizerResourceScreen";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { formatMoney } from "@/lib/format";
import type { FieldSpec } from "@/components/admin/GenericConfigForm";

const FIELDS: FieldSpec[] = [
  { kind: "text", name: "label", label: "Label (e.g. S, M, L, XL)", required: true },
  { kind: "text", name: "slug", label: "Slug (optional — auto-generated if blank)" },
  { kind: "money", name: "price_delta_minor", label: "Price adjustment" },
  { kind: "number", name: "sort_order", label: "Sort order" },
  { kind: "checkbox", name: "is_active", label: "Active" },
];

export default function AdminSizesPage() {
  return (
    <CustomizerResourceScreen<AdminSize, AdminSizePayload>
      title="Sizes"
      singularLabel="size"
      newButtonLabel="New Size"
      description="Size choices available in the garment customizer."
      service={adminSizes}
      fields={FIELDS}
      getName={(s) => s.label}
      toInitialValues={(item) => ({
        label: item?.label ?? "",
        slug: item?.slug ?? "",
        price_delta_minor: item?.price_delta_minor ?? 0,
        sort_order: item?.sort_order ?? 0,
        is_active: item?.is_active ?? true,
      })}
      buildPayload={(values) => ({
        label: values.label as string,
        slug: (values.slug as string)?.trim() || undefined,
        price_delta_minor: (values.price_delta_minor as number) ?? 0,
        sort_order: (values.sort_order as number | undefined) ?? undefined,
        is_active: Boolean(values.is_active),
      })}
      columns={[
        { header: "Label", render: (s) => <span className="font-medium text-neutral-900">{s.label}</span> },
        { header: "Price adjustment", render: (s) => formatMoney(s.price_delta_minor) },
        { header: "Sort order", render: (s) => s.sort_order ?? "—" },
        { header: "Status", render: (s) => <ActiveBadge active={s.is_active} /> },
      ]}
    />
  );
}
