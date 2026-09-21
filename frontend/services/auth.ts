import { apiFetch } from "@/lib/http";
import type { AuthResponse, User } from "@/types/api";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", { method: "POST", json: payload, auth: false });
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", { method: "POST", json: payload, auth: false });
}

export function logout(): Promise<null> {
  return apiFetch<null>("/auth/logout", { method: "POST" });
}

export function getMe(): Promise<User> {
  return apiFetch<User>("/auth/me");
}

/**
 * ASSUMPTION: docs/API_CONTRACT.md does not list a password-reset endpoint.
 * The /forgot-password page needs one, so this calls the most conventional
 * Laravel/Sanctum route name. Flag this to the backend team — either confirm
 * this path or update it once the real route is added.
 */
export function requestPasswordReset(email: string): Promise<null> {
  return apiFetch<null>("/auth/forgot-password", { method: "POST", json: { email }, auth: false });
}
