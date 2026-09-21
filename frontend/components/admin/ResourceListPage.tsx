"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextLineSkeleton } from "@/components/ui/LoadingSkeleton";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage, getFieldErrors } from "@/lib/http";
import { cn } from "@/lib/cn";

export interface ResourceColumn<T> {
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

export interface ResourceFormRenderProps<T> {
  initial?: T;
  onSubmit: (payload: unknown) => void;
  isSubmitting: boolean;
  fieldErrors: Record<string, string[]>;
}

/**
 * A shared list + create/edit-modal + delete-confirm shell for the small
 * admin CRUD resources (categories, collections, coupons, and the six
 * customizer option types). Each resource supplies its own columns, its own
 * form body (field shapes differ too much to generalize further) and its
 * own service calls; this component owns the loading/error/empty states,
 * the modal lifecycle, optimistic list updates and toasts so those don't
 * get reimplemented six different ways.
 */
export function ResourceListPage<T>({
  title,
  singularLabel,
  description,
  newButtonLabel,
  columns,
  getId,
  getName,
  fetchAll,
  createItem,
  updateItem,
  deleteItem,
  renderForm,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  /** Human label for one item, e.g. "fabric" — used in toasts and the delete confirm. */
  singularLabel: string;
  description?: string;
  newButtonLabel: string;
  columns: ResourceColumn<T>[];
  getId: (item: T) => number;
  getName: (item: T) => string;
  fetchAll: () => Promise<T[]>;
  createItem: (payload: unknown) => Promise<T>;
  updateItem: (id: number, payload: unknown) => Promise<T>;
  deleteItem: (id: number) => Promise<unknown>;
  renderForm: (props: ResourceFormRenderProps<T>) => React.ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
}) {
  const { showToast } = useToast();
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<T | "new" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    fetchAll()
      .then(setItems)
      .catch((err) => setError(getErrorMessage(err, `Unable to load ${title.toLowerCase()}.`)));
  }, [fetchAll, title]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(payload: unknown) {
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      if (modalItem === "new") {
        const created = await createItem(payload);
        setItems((prev) => (prev ? [created, ...prev] : [created]));
        showToast({ title: `${capitalize(singularLabel)} created`, variant: "success" });
      } else if (modalItem) {
        const id = getId(modalItem);
        const updated = await updateItem(id, payload);
        setItems((prev) => prev?.map((it) => (getId(it) === id ? updated : it)) ?? prev);
        showToast({ title: `${capitalize(singularLabel)} updated`, variant: "success" });
      }
      setModalItem(null);
    } catch (err) {
      const fe = getFieldErrors(err);
      if (fe) setFieldErrors(fe);
      showToast({ title: "Couldn't save", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const id = getId(deleteTarget);
      await deleteItem(id);
      setItems((prev) => prev?.filter((it) => getId(it) !== id) ?? prev);
      showToast({ title: `${capitalize(singularLabel)} deleted`, variant: "success" });
      setDeleteTarget(null);
    } catch (err) {
      showToast({ title: "Couldn't delete", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            setFieldErrors({});
            setModalItem("new");
          }}
          className="shrink-0 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          {newButtonLabel}
        </button>
      </div>

      <div className="mt-6">
        {error && (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}
        {!error && items === null && <TextLineSkeleton lines={5} />}
        {!error && items !== null && items.length === 0 && (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
        {!error && items !== null && items.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
                <tr>
                  {columns.map((col) => (
                    <th key={col.header} className={cn("px-4 py-3", col.className)}>
                      {col.header}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <tr key={getId(item)} className="hover:bg-neutral-50">
                    {columns.map((col) => (
                      <td key={col.header} className={cn("px-4 py-3 align-middle", col.className)}>
                        {col.render(item)}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setFieldErrors({});
                          setModalItem(item);
                        }}
                        className="mr-4 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
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

      <Modal
        isOpen={modalItem !== null}
        onClose={() => setModalItem(null)}
        title={modalItem === "new" ? newButtonLabel : `Edit ${singularLabel}`}
      >
        {modalItem !== null &&
          renderForm({
            initial: modalItem === "new" ? undefined : modalItem,
            onSubmit: handleSubmit,
            isSubmitting,
            fieldErrors,
          })}
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={`Delete ${deleteTarget ? getName(deleteTarget) : singularLabel}?`}
        description="This can't be undone."
        isSubmitting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
