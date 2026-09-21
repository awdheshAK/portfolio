// Guest cart token: a client-generated UUID persisted in localStorage and
// sent as the `X-Guest-Cart-Token` header so guests can use the cart before
// logging in, per docs/API_CONTRACT.md.

const GUEST_TOKEN_KEY = "ccp_guest_cart_token";

function generateUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator for environments without crypto.randomUUID.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getGuestCartToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function ensureGuestCartToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let token = window.localStorage.getItem(GUEST_TOKEN_KEY);
    if (!token) {
      token = generateUuid();
      window.localStorage.setItem(GUEST_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return null;
  }
}

export function clearGuestCartToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
