import { apiFetch } from "@/lib/http";
import type { AddCartItemPayload, Cart } from "@/types/api";

export function getCart(): Promise<Cart> {
  return apiFetch<Cart>("/cart");
}

export function addCartItem(payload: AddCartItemPayload): Promise<Cart> {
  return apiFetch<Cart>("/cart/items", { method: "POST", json: payload });
}

export function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  return apiFetch<Cart>(`/cart/items/${itemId}`, { method: "PATCH", json: { quantity } });
}

export function removeCartItem(itemId: number): Promise<Cart> {
  return apiFetch<Cart>(`/cart/items/${itemId}`, { method: "DELETE" });
}

export function applyCoupon(code: string): Promise<Cart> {
  return apiFetch<Cart>("/cart/coupon", { method: "POST", json: { code } });
}

export function removeCoupon(): Promise<Cart> {
  return apiFetch<Cart>("/cart/coupon", { method: "DELETE" });
}
