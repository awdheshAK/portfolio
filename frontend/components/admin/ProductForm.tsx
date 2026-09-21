"use client";

import { useState } from "react";
import type { AdminProduct, AdminProductPayload, Category, CustomizerOptions } from "@/types/api";
import { FormField } from "@/components/auth/FormField";
import { MoneyField } from "@/components/admin/MoneyField";

interface ImageRow {
  key: string;
  url: string;
  alt_text: string;
}

interface VariantRow {
  key: string;
  id?: number;
  color_id: string;
  size_id: string;
  sku: string;
  price_delta_minor: number;
  stock: number;
}

let localKeySeq = 0;
function nextKey(): string {
  localKeySeq += 1;
  return `row-${localKeySeq}`;
}

function flattenCategories(categories: Category[], depth = 0): Array<{ id: number; name: string; depth: number }> {
  const out: Array<{ id: number; name: string; depth: number }> = [];
  for (const category of categories) {
    out.push({ id: category.id, name: category.name, depth });
    if (category.children?.length) out.push(...flattenCategories(category.children, depth + 1));
  }
  return out;
}

export function ProductForm({
  initial,
  categories,
  customizerOptions,
  onSubmit,
  isSubmitting,
  fieldErrors,
}: {
  initial?: AdminProduct;
  categories: Category[];
  customizerOptions: CustomizerOptions | null;
  onSubmit: (payload: AdminProductPayload) => void;
  isSubmitting: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category?.id ? String(initial.category.id) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [shortDescription, setShortDescription] = useState(initial?.short_description ?? "");
  const [basePriceMinor, setBasePriceMinor] = useState(initial?.base_price_minor ?? 0);
  const [isCustomizable, setIsCustomizable] = useState(initial?.is_customizable ?? false);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [images, setImages] = useState<ImageRow[]>(
    initial?.images?.length
      ? initial.images.map((img) => ({ key: nextKey(), url: img.url, alt_text: img.alt_text ?? "" }))
      : [{ key: nextKey(), url: "", alt_text: "" }]
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    initial?.variants?.map((v) => ({
      key: nextKey(),
      id: v.id,
      color_id: v.color?.id ? String(v.color.id) : "",
      size_id: v.size?.id ? String(v.size.id) : "",
      sku: v.sku ?? "",
      price_delta_minor: v.price_delta_minor ?? 0,
      stock: v.stock ?? 0,
    })) ?? []
  );

  const flatCategories = flattenCategories(categories);

  function updateImage(key: string, patch: Partial<ImageRow>) {
    setImages((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }
  function addImage() {
    setImages((prev) => [...prev, { key: nextKey(), url: "", alt_text: "" }]);
  }
  function removeImage(key: string) {
    setImages((prev) => prev.filter((row) => row.key !== key));
  }

  function updateVariant(key: string, patch: Partial<VariantRow>) {
    setVariants((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }
  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { key: nextKey(), color_id: "", size_id: "", sku: "", price_delta_minor: 0, stock: 0 },
    ]);
  }
  function removeVariant(key: string) {
    setVariants((prev) => prev.filter((row) => row.key !== key));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: AdminProductPayload = {
      category_id: categoryId ? Number(categoryId) : null,
      name,
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      short_description: shortDescription.trim() || undefined,
      base_price_minor: basePriceMinor,
      is_customizable: isCustomizable,
      is_active: isActive,
      is_featured: isFeatured,
      images: images.filter((row) => row.url.trim()).map((row) => ({ url: row.url.trim(), alt_text: row.alt_text.trim() || undefined })),
      variants: variants
        .filter((row) => row.sku.trim())
        .map((row) => ({
          id: row.id,
          color_id: row.color_id ? Number(row.color_id) : null,
          size_id: row.size_id ? Number(row.size_id) : null,
          sku: row.sku.trim(),
          price_delta_minor: row.price_delta_minor,
          stock: row.stock,
        })),
    };
    onSubmit(payload);
  }

  const inputClass =
    "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" error={fieldErrors.name?.[0]}>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        </FormField>
        <FormField label="Slug (optional — auto-generated if blank)" error={fieldErrors.slug?.[0]}>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
        </FormField>
      </div>

      <FormField label="Category" error={fieldErrors.category_id?.[0]}>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
          <option value="">No category</option>
          {flatCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {"— ".repeat(c.depth)}
              {c.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Short description" error={fieldErrors.short_description?.[0]}>
        <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className={inputClass} />
      </FormField>

      <FormField label="Description" error={fieldErrors.description?.[0]}>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} />
      </FormField>

      <MoneyField
        label="Base price"
        initialMinor={basePriceMinor}
        onChange={setBasePriceMinor}
        required
        error={fieldErrors.base_price_minor?.[0]}
      />

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input type="checkbox" checked={isCustomizable} onChange={(e) => setIsCustomizable(e.target.checked)} className="h-4 w-4" />
          Customizable
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4" />
          Featured
        </label>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-neutral-200 p-4">
        <legend className="px-1 text-sm font-medium text-neutral-900">Images</legend>
        {images.map((row, idx) => (
          <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
            <FormField label={idx === 0 ? "Image URL" : ""} error={fieldErrors[`images.${idx}.url`]?.[0]}>
              <input
                value={row.url}
                onChange={(e) => updateImage(row.key, { url: e.target.value })}
                placeholder="https://…"
                className={inputClass}
              />
            </FormField>
            <FormField label={idx === 0 ? "Alt text" : ""} error={fieldErrors[`images.${idx}.alt_text`]?.[0]}>
              <input
                value={row.alt_text}
                onChange={(e) => updateImage(row.key, { alt_text: e.target.value })}
                className={inputClass}
              />
            </FormField>
            <button
              type="button"
              onClick={() => removeImage(row.key)}
              className={idx === 0 ? "mt-6 h-fit text-sm font-medium text-red-600 hover:underline" : "h-fit text-sm font-medium text-red-600 hover:underline"}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addImage} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-900">
          + Add image
        </button>
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-neutral-200 p-4">
        <legend className="px-1 text-sm font-medium text-neutral-900">Variants</legend>
        {variants.map((row, idx) => (
          <div key={row.key} className="grid gap-2 rounded-md border border-neutral-100 p-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-start">
            <FormField label="Color" error={fieldErrors[`variants.${idx}.color_id`]?.[0]}>
              <select value={row.color_id} onChange={(e) => updateVariant(row.key, { color_id: e.target.value })} className={inputClass}>
                <option value="">No color</option>
                {customizerOptions?.colors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Size" error={fieldErrors[`variants.${idx}.size_id`]?.[0]}>
              <select value={row.size_id} onChange={(e) => updateVariant(row.key, { size_id: e.target.value })} className={inputClass}>
                <option value="">No size</option>
                {customizerOptions?.sizes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="SKU" error={fieldErrors[`variants.${idx}.sku`]?.[0]}>
              <input value={row.sku} onChange={(e) => updateVariant(row.key, { sku: e.target.value })} className={inputClass} />
            </FormField>
            <MoneyField
              label="Price delta"
              initialMinor={row.price_delta_minor}
              onChange={(minor) => updateVariant(row.key, { price_delta_minor: minor })}
              error={fieldErrors[`variants.${idx}.price_delta_minor`]?.[0]}
            />
            <FormField label="Stock" error={fieldErrors[`variants.${idx}.stock`]?.[0]}>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={row.stock}
                  onChange={(e) => updateVariant(row.key, { stock: Number(e.target.value) || 0 })}
                  className={inputClass}
                />
                <button type="button" onClick={() => removeVariant(row.key)} className="shrink-0 text-sm font-medium text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            </FormField>
          </div>
        ))}
        <button type="button" onClick={addVariant} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-900">
          + Add variant
        </button>
      </fieldset>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save product"}
        </button>
      </div>
    </form>
  );
}
