"use client";

import { useState } from "react";
import type { AdminCollection, AdminCollectionPayload } from "@/types/api";
import * as collectionsService from "@/services/admin/collections";
import { ResourceListPage } from "@/components/admin/ResourceListPage";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { ProductPicker, type PickedProduct } from "@/components/admin/ProductPicker";
import { FormField } from "@/components/auth/FormField";

export default function AdminCollectionsPage() {
  return (
    <ResourceListPage<AdminCollection>
      title="Collections"
      singularLabel="collection"
      description="Curated groups of products featured across the storefront."
      newButtonLabel="New Collection"
      getId={(c) => c.id}
      getName={(c) => c.name}
      fetchAll={collectionsService.getAdminCollections}
      createItem={(payload) => collectionsService.createAdminCollection(payload as AdminCollectionPayload)}
      updateItem={(id, payload) => collectionsService.updateAdminCollection(id, payload as AdminCollectionPayload)}
      deleteItem={collectionsService.deleteAdminCollection}
      emptyTitle="No collections yet"
      emptyDescription="Create a collection to feature a curated set of products."
      columns={[
        { header: "Name", render: (c) => <span className="font-medium text-neutral-900">{c.name}</span> },
        { header: "Slug", render: (c) => <span className="text-neutral-500">{c.slug}</span> },
        { header: "Products", render: (c) => c.product_ids?.length ?? c.products?.length ?? 0 },
        { header: "Status", render: (c) => <ActiveBadge active={c.is_active} /> },
      ]}
      renderForm={({ initial, onSubmit, isSubmitting, fieldErrors }) => (
        <CollectionForm initial={initial} onSubmit={onSubmit} isSubmitting={isSubmitting} fieldErrors={fieldErrors} />
      )}
    />
  );
}

function CollectionForm({
  initial,
  onSubmit,
  isSubmitting,
  fieldErrors,
}: {
  initial?: AdminCollection;
  onSubmit: (payload: AdminCollectionPayload) => void;
  isSubmitting: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [products, setProducts] = useState<PickedProduct[]>(
    initial?.products?.map((p) => ({ id: p.id, name: p.name })) ?? []
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      is_active: isActive,
      product_ids: products.map((p) => p.id),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Name" error={fieldErrors.name?.[0]}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </FormField>
      <FormField label="Slug (optional — auto-generated if blank)" error={fieldErrors.slug?.[0]}>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </FormField>
      <FormField label="Description" error={fieldErrors.description?.[0]}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </FormField>
      <FormField label="Image URL" error={fieldErrors.image_url?.[0]}>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </FormField>
      <div>
        <ProductPicker selected={products} onChange={setProducts} />
        {fieldErrors.product_ids && <p className="mt-1 text-xs text-red-600">{fieldErrors.product_ids[0]}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-800">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
        Active
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save collection"}
        </button>
      </div>
    </form>
  );
}
