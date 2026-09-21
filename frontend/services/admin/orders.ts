import { apiFetch } from "@/lib/http";
import type { AdminOrder, OrderStatus, Paginated } from "@/types/api";

export function getAdminOrders(params: { status?: OrderStatus | ""; page?: number } = {}): Promise<Paginated<AdminOrder>> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  search.set("page", String(params.page ?? 1));
  return apiFetch<Paginated<AdminOrder>>(`/admin/orders?${search.toString()}`);
}

export function getAdminOrder(id: number): Promise<AdminOrder> {
  return apiFetch<AdminOrder>(`/admin/orders/${id}`);
}

export function updateAdminOrderStatus(id: number, status: OrderStatus): Promise<AdminOrder> {
  return apiFetch<AdminOrder>(`/admin/orders/${id}/status`, { method: "PATCH", json: { status } });
}
