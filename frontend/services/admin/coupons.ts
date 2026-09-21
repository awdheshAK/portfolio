import { apiFetch } from "@/lib/http";
import type { Coupon, CouponPayload } from "@/types/api";

export function getAdminCoupons(): Promise<Coupon[]> {
  return apiFetch<Coupon[]>("/admin/coupons");
}

export function createAdminCoupon(payload: CouponPayload): Promise<Coupon> {
  return apiFetch<Coupon>("/admin/coupons", { method: "POST", json: payload });
}

export function updateAdminCoupon(id: number, payload: CouponPayload): Promise<Coupon> {
  return apiFetch<Coupon>(`/admin/coupons/${id}`, { method: "PUT", json: payload });
}

export function deleteAdminCoupon(id: number): Promise<null> {
  return apiFetch<null>(`/admin/coupons/${id}`, { method: "DELETE" });
}
