import { apiFetch } from "@/lib/http";
import type { CustomizerOptions, Garment, PriceBreakdown, PriceRequestPayload } from "@/types/api";

export function getGarments(): Promise<Garment[]> {
  return apiFetch<Garment[]>("/customizer/garments", { auth: false, guestCart: false });
}

export function getCustomizerOptions(): Promise<CustomizerOptions> {
  return apiFetch<CustomizerOptions>("/customizer/options", { auth: false, guestCart: false });
}

/**
 * The backend is the ONLY source of truth for price. The frontend never
 * computes or displays a final price it calculated itself — this call is
 * made on every relevant customizer change and its response is what's shown.
 */
export function getCustomizerPrice(payload: PriceRequestPayload): Promise<PriceBreakdown> {
  return apiFetch<PriceBreakdown>("/customizer/price", { method: "POST", json: payload, auth: false });
}
