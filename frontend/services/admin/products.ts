import { apiFetch } from "@/lib/http";
import type { AdminProduct, AdminProductPayload, Paginated } from "@/types/api";

// NOTE: there is no admin `GET /products/{id}` (the route is registered with
// `apiResource(...)->except(['show'])`), so editing reuses the AdminProduct
// object already held in the list page's state rather than re-fetching it —
// see components/admin/ProductFormModal.tsx.

export function getAdminProducts(page = 1): Promise<Paginated<AdminProduct>> {
  return apiFetch<Paginated<AdminProduct>>(`/admin/products?page=${page}`);
}

export function createAdminProduct(payload: AdminProductPayload): Promise<AdminProduct> {
  return apiFetch<AdminProduct>("/admin/products", { method: "POST", json: payload });
}

export function updateAdminProduct(id: number, payload: AdminProductPayload): Promise<AdminProduct> {
  return apiFetch<AdminProduct>(`/admin/products/${id}`, { method: "PUT", json: payload });
}

export function deleteAdminProduct(id: number): Promise<null> {
  return apiFetch<null>(`/admin/products/${id}`, { method: "DELETE" });
}
