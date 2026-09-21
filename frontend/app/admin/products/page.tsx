"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { AdminProduct, AdminProductPayload, Category, CustomizerOptions } from "@/types/api";
import * as productsService from "@/services/admin/products";
import * as catalogService from "@/services/catalog";
import * as customizerService from "@/services/customizer";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { ProductForm } from "@/components/admin/ProductForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductGridSkeleton } from "@/components/ui/LoadingSkeleton";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage, getFieldErrors } from "@/lib/http";
import { formatMoney } from "@/lib/format";

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customizerOptions, setCustomizerOptions] = useState<CustomizerOptions | null>(null);

  const [modalItem, setModalItem] = useState<AdminProduct | "new" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback((targetPage: number) => {
    setError(null);
    productsService
      .getAdminProducts(targetPage)
      .then((res) => {
        setProducts(res.data);
        setPage(res.meta.current_page);
        setLastPage(res.meta.last_page);
      })
      .catch((err) => setError(getErrorMessage(err, "Unable to load products.")));
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  useEffect(() => {
    catalogService.getCategories().then(setCategories).catch(() => setCategories([]));
    customizerService.getCustomizerOptions().then(setCustomizerOptions).catch(() => setCustomizerOptions(null));
  }, []);

  async function handleSubmit(payload: AdminProductPayload) {
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      if (modalItem === "new") {
        await productsService.createAdminProduct(payload);
        showToast({ title: "Product created", variant: "success" });
      } else if (modalItem) {
        await productsService.updateAdminProduct(modalItem.id, payload);
        showToast({ title: "Product updated", variant: "success" });
      }
      setModalItem(null);
      load(page);
    } catch (err) {
      const fe = getFieldErrors(err);
      if (fe) setFieldErrors(fe);
      showToast({ title: "Couldn't save product", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await productsService.deleteAdminProduct(deleteTarget.id);
      showToast({ title: "Product deleted", variant: "success" });
      setDeleteTarget(null);
      setProducts((prev) => prev?.filter((p) => p.id !== deleteTarget.id) ?? prev);
    } catch (err) {
      showToast({ title: "Couldn't delete product", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900">Products</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage the catalog customers browse and buy from.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFieldErrors({});
            setModalItem("new");
          }}
          className="shrink-0 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          New Product
        </button>
      </div>

      <div className="mt-6">
        {error && <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!error && products === null && <ProductGridSkeleton count={4} />}
        {!error && products !== null && products.length === 0 && (
          <EmptyState title="No products yet" description="Create your first product to start selling." />
        )}
        {!error && products !== null && products.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => {
                  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock ?? 0), 0) ?? 0;
                  return (
                    <tr key={product.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                            <Image
                              src={product.images?.[0]?.url || "/placeholders/product.svg"}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </span>
                          <span className="font-medium text-neutral-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{product.category?.name ?? "—"}</td>
                      <td className="px-4 py-3 font-medium text-neutral-900">{formatMoney(product.base_price_minor)}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {product.variants?.length ? `${totalStock} across ${product.variants.length} variant${product.variants.length === 1 ? "" : "s"}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <ActiveBadge active={product.is_active} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setFieldErrors({});
                            setModalItem(product);
                          }}
                          className="mr-4 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={page} lastPage={lastPage} onPageChange={load} />
      </div>

      <Modal
        isOpen={modalItem !== null}
        onClose={() => setModalItem(null)}
        title={modalItem === "new" ? "New Product" : "Edit Product"}
        className="max-w-3xl"
      >
        {modalItem !== null && (
          <ProductForm
            key={modalItem === "new" ? "new" : modalItem.id}
            initial={modalItem === "new" ? undefined : modalItem}
            categories={categories}
            customizerOptions={customizerOptions}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            fieldErrors={fieldErrors}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={`Delete ${deleteTarget?.name ?? "product"}?`}
        description="This can't be undone."
        isSubmitting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
