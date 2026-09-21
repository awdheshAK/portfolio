"use client";

import type { AdminColor, AdminColorPayload } from "@/types/api";
import { adminColors } from "@/services/admin/customizerResources";
import { CustomizerResourceScreen } from "@/components/admin/CustomizerResourceScreen";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { formatMoney } from "@/lib/format";
import type { FieldSpec } from "@/components/admin/GenericConfigForm";

const FIELDS: FieldSpec[] = [
  { kind: "text", name: "name", label: "Name", required: true },
  { kind: "text", name: "slug", label: "Slug (optional — auto-generated if blank)" },
  { kind: "color", name: "hex", label: "Color", required: true },
  { kind: "money", name: "price_delta_minor", label: "Price adjustment" },
  { kind: "checkbox", name: "is_active", label: "Active" },
];

export default function AdminColorsPage() {
  return (
    <CustomizerResourceScreen<AdminColor, AdminColorPayload>
      title="Colors"
      singularLabel="color"
      newButtonLabel="New Color"
      description="Color choices available in the garment customizer."
      service={adminColors}
      fields={FIELDS}
      getName={(c) => c.name}
      toInitialValues={(item) => ({
        name: item?.name ?? "",
        slug: item?.slug ?? "",
        hex: item?.hex ?? "#000000",
        price_delta_minor: item?.price_delta_minor ?? 0,
        is_active: item?.is_active ?? true,
      })}
      buildPayload={(values) => ({
        name: values.name as string,
        slug: (values.slug as string)?.trim() || undefined,
        hex: values.hex as string,
        price_delta_minor: (values.price_delta_minor as number) ?? 0,
        is_active: Boolean(values.is_active),
      })}
      columns={[
        {
          header: "Name",
          render: (c) => (
            <span className="inline-flex items-center gap-2 font-medium text-neutral-900">
              <span className="h-4 w-4 shrink-0 rounded-full border border-neutral-300" style={{ backgroundColor: c.hex }} aria-hidden="true" />
              {c.name}
            </span>
          ),
        },
        { header: "Hex", render: (c) => <span className="font-mono text-xs text-neutral-500">{c.hex}</span> },
        { header: "Price adjustment", render: (c) => formatMoney(c.price_delta_minor) },
        { header: "Status", render: (c) => <ActiveBadge active={c.is_active} /> },
      ]}
    />
  );
}
