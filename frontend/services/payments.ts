import { apiFetch } from "@/lib/http";
import type { Order, RazorpayVerifyPayload } from "@/types/api";

/**
 * Verifies the Razorpay payment server-side (HMAC signature check) and
 * returns the updated order. The frontend must never mark an order as paid
 * on its own — only this call, when it succeeds, means payment happened.
 */
export function verifyRazorpayPayment(payload: RazorpayVerifyPayload): Promise<Order> {
  return apiFetch<Order>("/payments/razorpay/verify", { method: "POST", json: payload });
}
