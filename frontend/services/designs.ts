import { apiFetch } from "@/lib/http";
import type { Design, DesignConfiguration } from "@/types/api";

export interface SaveDesignPayload {
  name: string;
  configuration: DesignConfiguration;
  preview_image_url?: string;
}

export function getDesigns(): Promise<Design[]> {
  return apiFetch<Design[]>("/designs");
}

export function saveDesign(payload: SaveDesignPayload): Promise<Design> {
  return apiFetch<Design>("/designs", { method: "POST", json: payload });
}

export function getDesign(id: number): Promise<Design> {
  return apiFetch<Design>(`/designs/${id}`);
}

export function updateDesign(id: number, payload: Partial<SaveDesignPayload>): Promise<Design> {
  return apiFetch<Design>(`/designs/${id}`, { method: "PUT", json: payload });
}

export function deleteDesign(id: number): Promise<null> {
  return apiFetch<null>(`/designs/${id}`, { method: "DELETE" });
}
