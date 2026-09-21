import { apiFetch } from "@/lib/http";
import type { Customer, Paginated } from "@/types/api";

export function getAdminCustomers(params: { search?: string; page?: number } = {}): Promise<Paginated<Customer>> {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  search.set("page", String(params.page ?? 1));
  return apiFetch<Paginated<Customer>>(`/admin/customers?${search.toString()}`);
}

export function getAdminCustomer(id: number): Promise<Customer> {
  return apiFetch<Customer>(`/admin/customers/${id}`);
}

export function disableAdminCustomer(id: number): Promise<null> {
  return apiFetch<null>(`/admin/customers/${id}`, { method: "DELETE" });
}

export function restoreAdminCustomer(id: number): Promise<Customer> {
  return apiFetch<Customer>(`/admin/customers/${id}/restore`, { method: "POST" });
}
