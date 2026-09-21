import { apiFetch } from "@/lib/http";
import type { Category, Collection, Fabric, Paginated, Product, ProductListParams, Review } from "@/types/api";

export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories", { auth: false, guestCart: false });
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function getProducts(params: ProductListParams = {}): Promise<Paginated<Product>> {
  const qs = buildQuery({
    category: params.category,
    search: params.search,
    sort: params.sort,
    min_price: params.min_price,
    max_price: params.max_price,
    color: params.color,
    size: params.size,
    fabric: params.fabric,
    page: params.page,
  });
  return apiFetch<Paginated<Product>>(`/products${qs}`, { auth: false, guestCart: false });
}

export function getProductBySlug(slug: string): Promise<Product> {
  return apiFetch<Product>(`/products/${encodeURIComponent(slug)}`, { auth: false, guestCart: false });
}

export function getFabrics(): Promise<Fabric[]> {
  return apiFetch<Fabric[]>("/fabrics", { auth: false, guestCart: false });
}

export function getFabricBySlug(slug: string): Promise<Fabric> {
  return apiFetch<Fabric>(`/fabrics/${encodeURIComponent(slug)}`, { auth: false, guestCart: false });
}

export function getCollections(): Promise<Collection[]> {
  return apiFetch<Collection[]>("/collections", { auth: false, guestCart: false });
}

export function getCollectionBySlug(slug: string): Promise<Collection> {
  return apiFetch<Collection>(`/collections/${encodeURIComponent(slug)}`, { auth: false, guestCart: false });
}

export function getProductReviews(productId: number): Promise<Review[]> {
  return apiFetch<Review[]>(`/products/${productId}/reviews`, { auth: false, guestCart: false });
}

export function createProductReview(productId: number, payload: { rating: number; body: string }): Promise<Review> {
  return apiFetch<Review>(`/products/${productId}/reviews`, { method: "POST", json: payload });
}
