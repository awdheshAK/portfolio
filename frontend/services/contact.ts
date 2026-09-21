import { apiFetch } from "@/lib/http";

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * ASSUMPTION: docs/API_CONTRACT.md does not define a contact endpoint. This
 * posts to POST /api/v1/contact, the conventional path — the backend needs
 * that route added (accepting { name, email, subject, message } and
 * returning the standard { success, message } envelope) for this form to
 * work end-to-end.
 */
export function submitContactForm(payload: ContactPayload): Promise<null> {
  return apiFetch<null>("/contact", { method: "POST", json: payload, auth: false, guestCart: false });
}
