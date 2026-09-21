import { apiFetch } from "@/lib/http";
import type { Address, AddressPayload } from "@/types/api";

export function getAddresses(): Promise<Address[]> {
  return apiFetch<Address[]>("/addresses");
}

export function createAddress(payload: AddressPayload): Promise<Address> {
  return apiFetch<Address>("/addresses", { method: "POST", json: payload });
}

export function updateAddress(id: number, payload: AddressPayload): Promise<Address> {
  return apiFetch<Address>(`/addresses/${id}`, { method: "PUT", json: payload });
}

export function deleteAddress(id: number): Promise<null> {
  return apiFetch<null>(`/addresses/${id}`, { method: "DELETE" });
}
