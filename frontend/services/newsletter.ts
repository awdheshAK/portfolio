import { apiFetch } from "@/lib/http";

/**
 * ASSUMPTION: docs/API_CONTRACT.md does not define a newsletter endpoint.
 * This posts to POST /api/v1/newsletter/subscribe — the backend needs that
 * route added (accepting { email }) for this form to work end-to-end.
 */
export function subscribeToNewsletter(email: string): Promise<null> {
  return apiFetch<null>("/newsletter/subscribe", { method: "POST", json: { email }, auth: false, guestCart: false });
}
