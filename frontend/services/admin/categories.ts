import { apiFetch } from "@/lib/http";
import type { AdminCategory, AdminCategoryPayload } from "@/types/api";

export function getAdminCategories(): Promise<AdminCategory[]> {
  return apiFetch<AdminCategory[]>("/admin/categories");
}

export function createAdminCategory(payload: AdminCategoryPayload): Promise<AdminCategory> {
  return apiFetch<AdminCategory>("/admin/categories", { method: "POST", json: payload });
}

export function updateAdminCategory(id: number, payload: AdminCategoryPayload): Promise<AdminCategory> {
  return apiFetch<AdminCategory>(`/admin/categories/${id}`, { method: "PUT", json: payload });
}

export function deleteAdminCategory(id: number): Promise<null> {
  return apiFetch<null>(`/admin/categories/${id}`, { method: "DELETE" });
}
