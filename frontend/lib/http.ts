import { getApiUrl } from "./env";
import { getAuthToken } from "./auth-token";
import { ensureGuestCartToken } from "./guest-cart-token";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  json?: unknown;
  formData?: FormData;
  /** Attach `Authorization: Bearer <token>` when a token is present. Default true. */
  auth?: boolean;
  /** Attach `X-Guest-Cart-Token` when no auth token is present. Default true. */
  guestCart?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Base URL override, mainly for testing. */
  baseUrl?: string;
}

/**
 * Thin fetch wrapper matching docs/API_CONTRACT.md:
 * - all routes are prefixed /api/v1
 * - success responses are unwrapped from { success, message, data }
 * - 422 responses throw ApiError with `.errors` populated
 * - other non-2xx responses throw ApiError with `.message`
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const {
    method = "GET",
    json,
    formData,
    auth = true,
    guestCart = true,
    headers,
    signal,
    baseUrl,
  } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (!formData && json !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  let usedAuth = false;
  if (auth) {
    const token = getAuthToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
      usedAuth = true;
    }
  }

  if (guestCart && !usedAuth) {
    const token = ensureGuestCartToken();
    if (token) finalHeaders["X-Guest-Cart-Token"] = token;
  }

  const url = `${baseUrl || getApiUrl()}/api/v1${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: formData ?? (json !== undefined ? JSON.stringify(json) : undefined),
      signal,
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Please check your connection and try again.",
      0
    );
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  const body = payload as { success?: boolean; message?: string; data?: T; errors?: Record<string, string[]> } | null;

  if (!res.ok) {
    const message = body?.message || res.statusText || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body?.errors);
  }

  if (body && typeof body === "object" && "data" in body) {
    return body.data as T;
  }

  return payload as T;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function getFieldErrors(err: unknown): Record<string, string[]> | undefined {
  if (isApiError(err)) return err.errors;
  return undefined;
}

export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isApiError(err)) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}
