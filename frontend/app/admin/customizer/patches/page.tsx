"use client";

import Image from "next/image";
import type { AdminPatch, AdminPatchPayload } from "@/types/api";
import { adminPatches } from "@/services/admin/customizerResources";
import { CustomizerResourceScreen } from "@/components/admin/CustomizerResourceScreen";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { formatMoney } from "@/lib/format";
import type { FieldSpec } from "@/components/admin/GenericConfigForm";

const FIELDS: FieldSpec[] = [
  { kind: "text", name: "name", label: "Name", required: true },
  { kind: "text", name: "slug", label: "Slug (optional — auto-generated if blank)" },
  { kind: "text", name: "type", label: "Type (optional)", placeholder: "e.g. woven, embroidered" },
  { kind: "money", name: "price_minor", label: "Price", required: true },
  { kind: "text", name: "image_url", label: "Image URL (optional)", placeholder: "https://…" },
  { kind: "checkbox", name: "is_active", label: "Active" },
];

export default function AdminPatchesPage() {
  return (
    <CustomizerResourceScreen<AdminPatch, AdminPatchPayload>
      title="Patches"
      singularLabel="patch"
      newButtonLabel="New Patch"
      description="Patch add-ons available in the garment customizer."
      service={adminPatches}
      fields={FIELDS}
      getName={(p) => p.name}
      toInitialValues={(item) => ({
        name: item?.name ?? "",
        slug: item?.slug ?? "",
        type: item?.type ?? "",
        price_minor: item?.price_minor ?? 0,
        image_url: item?.image_url ?? "",
        is_active: item?.is_active ?? true,
      })}
      buildPayload={(values) => ({
        name: values.name as string,
        slug: (values.slug as string)?.trim() || undefined,
        type: (values.type as string)?.trim() || undefined,
        price_minor: (values.price_minor as number) ?? 0,
        image_url: (values.image_url as string)?.trim() || undefined,
        is_active: Boolean(values.is_active),
      })}
      columns={[
        {
          header: "Name",
          render: (p) => (
            <span className="inline-flex items-center gap-2 font-medium text-neutral-900">
              {p.image_url && (
                <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded bg-neutral-100">
                  <Image src={p.image_url} alt="" fill sizes="24px" className="object-cover" />
                </span>
              )}
              {p.name}
            </span>
          ),
        },
        { header: "Type", render: (p) => p.type ?? "—" },
        { header: "Price", render: (p) => formatMoney(p.price_minor) },
        { header: "Status", render: (p) => <ActiveBadge active={p.is_active} /> },
      ]}
    />
  );
}
