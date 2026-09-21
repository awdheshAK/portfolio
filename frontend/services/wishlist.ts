import { apiFetch } from "@/lib/http";
import type { WishlistItem } from "@/types/api";

export function getWishlist(): Promise<WishlistItem[]> {
  return apiFetch<WishlistItem[]>("/wishlist");
}

export function addToWishlist(productId: number): Promise<WishlistItem[]> {
  return apiFetch<WishlistItem[]>("/wishlist", { method: "POST", json: { product_id: productId } });
}

export function removeFromWishlist(productId: number): Promise<WishlistItem[]> {
  return apiFetch<WishlistItem[]>(`/wishlist/${productId}`, { method: "DELETE" });
}
