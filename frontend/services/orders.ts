import { apiFetch } from "@/lib/http";
import type { CheckoutPayload, CheckoutResponse, Order } from "@/types/api";

export function checkout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>("/orders/checkout", { method: "POST", json: payload });
}

export function getOrders(): Promise<Order[]> {
  return apiFetch<Order[]>("/orders");
}

export function getOrder(id: number): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`);
}
