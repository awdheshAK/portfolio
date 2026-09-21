"use client";

import type { AdminPosition, AdminPositionPayload } from "@/types/api";
import type { CustomizerResourceService } from "@/components/admin/CustomizerResourceScreen";
import { CustomizerResourceScreen } from "@/components/admin/CustomizerResourceScreen";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { formatMoney } from "@/lib/format";
import type { FieldSpec } from "@/components/admin/GenericConfigForm";

const FIELDS: FieldSpec[] = [
  { kind: "text", name: "label", label: "Label", required: true },
  { kind: "text", name: "slug", label: "Slug (optional — auto-generated if blank)" },
  { kind: "money", name: "price_minor", label: "Price", required: true },
  { kind: "number", name: "x", label: "X position", min: 0, max: 100, help: "0–100, canvas-relative" },
  { kind: "number", name: "y", label: "Y position", min: 0, max: 100, help: "0–100, canvas-relative" },
  { kind: "text", name: "anchor", label: "Anchor (optional)", placeholder: "e.g. center, top-left" },
  { kind: "checkbox", name: "is_active", label: "Active" },
];

/** Shared by the print-positions and embroidery-positions screens, which are identical apart from title and service. */
export function PositionResourcePage({
  title,
  singularLabel,
  newButtonLabel,
  description,
  service,
}: {
  title: string;
  singularLabel: string;
  newButtonLabel: string;
  description: string;
  service: CustomizerResourceService<AdminPosition, AdminPositionPayload>;
}) {
  return (
    <CustomizerResourceScreen<AdminPosition, AdminPositionPayload>
      title={title}
      singularLabel={singularLabel}
      newButtonLabel={newButtonLabel}
      description={description}
      service={service}
      fields={FIELDS}
      getName={(p) => p.label}
      toInitialValues={(item) => ({
        label: item?.label ?? "",
        slug: item?.slug ?? "",
        price_minor: item?.price_minor ?? 0,
        x: item?.x ?? undefined,
        y: item?.y ?? undefined,
        anchor: item?.anchor ?? "",
        is_active: item?.is_active ?? true,
      })}
      buildPayload={(values) => ({
        label: values.label as string,
        slug: (values.slug as string)?.trim() || undefined,
        price_minor: (values.price_minor as number) ?? 0,
        x: values.x as number | undefined,
        y: values.y as number | undefined,
        anchor: (values.anchor as string)?.trim() || undefined,
        is_active: Boolean(values.is_active),
      })}
      columns={[
        { header: "Label", render: (p) => <span className="font-medium text-neutral-900">{p.label}</span> },
        { header: "Price", render: (p) => formatMoney(p.price_minor) },
        { header: "X", render: (p) => (p.x !== null && p.x !== undefined ? p.x : "—") },
        { header: "Y", render: (p) => (p.y !== null && p.y !== undefined ? p.y : "—") },
        { header: "Anchor", render: (p) => p.anchor ?? "—" },
        { header: "Status", render: (p) => <ActiveBadge active={p.is_active} /> },
      ]}
    />
  );
}
