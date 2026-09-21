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

export function requestPasswordReset(email: string): Promise<null> {
  return apiFetch<null>("/auth/forgot-password", { method: "POST", json: { email }, auth: false });
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export function resetPassword(payload: ResetPasswordPayload): Promise<null> {
  return apiFetch<null>("/auth/reset-password", { method: "POST", json: payload, auth: false });
}
