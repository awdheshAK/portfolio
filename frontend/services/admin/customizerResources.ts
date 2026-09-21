import { apiFetch } from "@/lib/http";
import type {
  AdminColor,
  AdminColorPayload,
  AdminFabric,
  AdminFabricPayload,
  AdminPatch,
  AdminPatchPayload,
  AdminPosition,
  AdminPositionPayload,
  AdminSize,
  AdminSizePayload,
} from "@/types/api";

/**
 * The six admin "customizer option" resources (fabrics, colors, sizes,
 * print-positions, embroidery-positions, patches) are near-identical CRUD
 * endpoints under /admin/customizer/{resource}. One small factory avoids
 * repeating the same four fetches six times.
 */
function crud<TItem, TPayload>(basePath: string) {
  return {
    list: (): Promise<TItem[]> => apiFetch<TItem[]>(`/admin/customizer/${basePath}`),
    create: (payload: TPayload): Promise<TItem> =>
      apiFetch<TItem>(`/admin/customizer/${basePath}`, { method: "POST", json: payload }),
    update: (id: number, payload: TPayload): Promise<TItem> =>
      apiFetch<TItem>(`/admin/customizer/${basePath}/${id}`, { method: "PUT", json: payload }),
    remove: (id: number): Promise<null> => apiFetch<null>(`/admin/customizer/${basePath}/${id}`, { method: "DELETE" }),
  };
}

export const adminFabrics = crud<AdminFabric, AdminFabricPayload>("fabrics");
export const adminColors = crud<AdminColor, AdminColorPayload>("colors");
export const adminSizes = crud<AdminSize, AdminSizePayload>("sizes");
export const adminPrintPositions = crud<AdminPosition, AdminPositionPayload>("print-positions");
export const adminEmbroideryPositions = crud<AdminPosition, AdminPositionPayload>("embroidery-positions");
export const adminPatches = crud<AdminPatch, AdminPatchPayload>("patches");
