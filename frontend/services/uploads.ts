import { apiFetch } from "@/lib/http";
import type { UploadedAsset } from "@/types/api";
import { LOGO_UPLOAD_ACCEPTED_TYPES, LOGO_UPLOAD_MAX_SIZE_BYTES } from "@/config/customizer";

export interface FileValidationResult {
  valid: boolean;
  message?: string;
}

export function validateDesignAssetFile(file: File): FileValidationResult {
  if (!LOGO_UPLOAD_ACCEPTED_TYPES.includes(file.type)) {
    return { valid: false, message: "Please upload a PNG, JPG, WEBP or SVG file." };
  }
  if (file.size > LOGO_UPLOAD_MAX_SIZE_BYTES) {
    return { valid: false, message: `File is too large. Maximum size is ${LOGO_UPLOAD_MAX_SIZE_BYTES / (1024 * 1024)}MB.` };
  }
  return { valid: true };
}

/**
 * Uploads a design asset (logo/graphic) via our own backend, which uploads
 * to Cloudinary server-side (signed) and returns the public URL. The
 * frontend never talks to Cloudinary directly and never sees any secret.
 */
export function uploadDesignAsset(file: File): Promise<UploadedAsset> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<UploadedAsset>("/uploads/design-asset", { method: "POST", formData });
}
