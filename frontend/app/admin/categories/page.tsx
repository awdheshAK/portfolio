"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminCategory, AdminCategoryPayload } from "@/types/api";
import * as categoriesService from "@/services/admin/categories";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextLineSkeleton } from "@/components/ui/LoadingSkeleton";
import { FormField } from "@/components/auth/FormField";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage, getFieldErrors } from "@/lib/http";
import { cn } from "@/lib/cn";

interface FlatCategory extends AdminCategory {
  depth: number;
}

function flatten(categories: AdminCategory[], depth = 0): FlatCategory[] {
  const out: FlatCategory[] = [];
  for (const category of categories) {
    out.push({ ...category, depth });
    if (category.children?.length) out.push(...flatten(category.children, depth + 1));
  }
  return out;
}

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeOverrides, setActiveOverrides] = useState<Record<number, boolean>>({});
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [modalItem, setModalItem] = useState<AdminCategory | "new" | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    categoriesService
      .getAdminCategories()
      .then(setCategories)
      .catch((err) => setError(getErrorMessage(err, "Unable to load categories.")));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flat = useMemo(() => (categories ? flatten(categories) : []), [categories]);

  function isActive(category: AdminCategory): boolean {
    return activeOverrides[category.id] ?? category.is_active ?? true;
  }

  async function toggleActive(category: AdminCategory) {
    const next = !isActive(category);
    setTogglingId(category.id);
    try {
      await categoriesService.updateAdminCategory(category.id, { name: category.name, is_active: next });
      setActiveOverrides((prev) => ({ ...prev, [category.id]: next }));
      showToast({ title: next ? "Category activated" : "Category deactivated", variant: "success" });
    } catch (err) {
      showToast({ title: "Couldn't update category", description: getErrorMessage(err), variant: "error" });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSubmit(payload: AdminCategoryPayload) {
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      if (modalItem === "new") {
        await categoriesService.createAdminCategory(payload);
        showToast({ title: "Category created", variant: "success" });
      } else if (modalItem) {
        await categoriesService.updateAdminCategory(modalItem.id, payload);
        setActiveOverrides((prev) => ({ ...prev, [modalItem.id]: payload.is_active ?? true }));
        showToast({ title: "Category updated", variant: "success" });
      }
      setModalItem(null);
      load();
    } catch (err) {
      const fe = getFieldErrors(err);
      if (fe) setFieldErrors(fe);
      showToast({ title: "Couldn't save category", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await categoriesService.deleteAdminCategory(deleteTarget.id);
      showToast({ title: "Category deleted", variant: "success" });
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast({ title: "Couldn't delete category", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900">Categories</h1>
          <p className="mt-1 text-sm text-neutral-500">Organize the shop&apos;s category tree.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFieldErrors({});
            setModalItem("new");
          }}
          className="shrink-0 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          New Category
        </button>
      </div>

      <div className="mt-6">
        {error && <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!error && categories === null && <TextLineSkeleton lines={5} />}
        {!error && categories !== null && flat.length === 0 && (
          <EmptyState title="No categories yet" description="Create your first category to start organizing products." />
        )}
        {!error && flat.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {flat.map((category) => (
                  <tr key={category.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <span style={{ paddingLeft: `${category.depth * 1.25}rem` }} className="inline-flex items-center gap-2">
                        {category.depth > 0 && <span className="text-neutral-300">↳</span>}
                        {category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{category.slug}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActive(category)}
                        disabled={togglingId === category.id}
                        className="disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                        aria-label={isActive(category) ? "Deactivate category" : "Activate category"}
                      >
                        <ActiveBadge active={isActive(category)} />
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setFieldErrors({});
                          setModalItem(category);
                        }}
                        className="mr-4 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(category)}
                        className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalItem !== null} onClose={() => setModalItem(null)} title={modalItem === "new" ? "New Category" : "Edit Category"}>
        {modalItem !== null && (
          <CategoryForm
            key={modalItem === "new" ? "new" : modalItem.id}
            initial={modalItem === "new" ? undefined : modalItem}
            parentOptions={flat.filter((c) => (modalItem === "new" ? true : c.id !== modalItem.id))}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            fieldErrors={fieldErrors}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={`Delete ${deleteTarget?.name ?? "category"}?`}
        description="This can't be undone."
        isSubmitting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function CategoryForm({
  initial,
  parentOptions,
  onSubmit,
  isSubmitting,
  fieldErrors,
}: {
  initial?: AdminCategory;
  parentOptions: FlatCategory[];
  onSubmit: (payload: AdminCategoryPayload) => void;
  isSubmitting: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [parentId, setParentId] = useState<string>(initial?.parent_id ? String(initial.parent_id) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sort_order !== undefined ? String(initial.sort_order) : "0");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      slug: slug.trim() || undefined,
      parent_id: parentId ? Number(parentId) : null,
      description: description.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      sort_order: sortOrder.trim() ? Number(sortOrder) : undefined,
      is_active: isActive,
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
      <FormField label="Parent category" error={fieldErrors.parent_id?.[0]}>
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          <option value="">None (top-level)</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {"— ".repeat(c.depth)}
              {c.name}
            </option>
          ))}
        </select>
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
      <FormField label="Sort order" error={fieldErrors.sort_order?.[0]}>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-neutral-800">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
        Active
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
          )}
        >
          {isSubmitting ? "Saving…" : "Save category"}
        </button>
      </div>
    </form>
  );
}
