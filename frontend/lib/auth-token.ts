// Token storage for the Sanctum bearer token.
//
// Tradeoff: a pure SPA fetch client (no Next.js server session) cannot set a
// real httpOnly cookie, since the browser — not our server — makes the API
// calls. We store the token in localStorage rather than injecting it via
// innerHTML/DOM strings, keep it out of the URL and logs, and always send it
// over Authorization headers (never rendered into markup). This is an
// accepted MVP tradeoff; a production hardening pass would proxy auth
// through a Next.js Route Handler that sets a real httpOnly cookie instead.

const TOKEN_KEY = "ccp_auth_token";
const USER_KEY = "ccp_auth_user";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable (private mode, etc.) */
  }
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

export function getStoredUserJson(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export function setStoredUserJson(json: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USER_KEY, json);
  } catch {
    /* ignore */
  }
}
