import { apiFetch } from "@/lib/http";
import type { AdminCollection, AdminCollectionPayload } from "@/types/api";

export function getAdminCollections(): Promise<AdminCollection[]> {
  return apiFetch<AdminCollection[]>("/admin/collections");
}

export function createAdminCollection(payload: AdminCollectionPayload): Promise<AdminCollection> {
  return apiFetch<AdminCollection>("/admin/collections", { method: "POST", json: payload });
}

export function updateAdminCollection(id: number, payload: AdminCollectionPayload): Promise<AdminCollection> {
  return apiFetch<AdminCollection>(`/admin/collections/${id}`, { method: "PUT", json: payload });
}

export function deleteAdminCollection(id: number): Promise<null> {
  return apiFetch<null>(`/admin/collections/${id}`, { method: "DELETE" });
}
