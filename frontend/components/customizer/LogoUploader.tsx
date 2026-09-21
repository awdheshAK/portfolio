"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { validateDesignAssetFile, uploadDesignAsset } from "@/services/uploads";
import { getErrorMessage } from "@/lib/http";
import { LOGO_UPLOAD_ACCEPTED_TYPES } from "@/config/customizer";

export interface LogoState {
  previewUrl: string | null;
  uploadedUrl: string | null;
  isUploading: boolean;
  error: string | null;
}

export function LogoUploader({ state, onChange }: { state: LogoState; onChange: (next: LogoState) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    return () => {
      if (state.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(state.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(file: File) {
    const validation = validateDesignAssetFile(file);
    if (!validation.valid) {
      onChange({ ...state, error: validation.message || "Invalid file." });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    onChange({ previewUrl, uploadedUrl: null, isUploading: true, error: null });
    try {
      const asset = await uploadDesignAsset(file);
      onChange({ previewUrl, uploadedUrl: asset.url, isUploading: false, error: null });
    } catch (err) {
      onChange({
        previewUrl,
        uploadedUrl: null,
        isUploading: false,
        error: getErrorMessage(err, "Upload failed. You can still preview locally, but you'll need to retry before saving."),
      });
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    if (state.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(state.previewUrl);
    onChange({ previewUrl: null, uploadedUrl: null, isUploading: false, error: null });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragActive ? "border-neutral-900 bg-neutral-50" : "border-neutral-300"
        }`}
      >
        {state.previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <Image src={state.previewUrl} alt="Uploaded logo preview" fill sizes="96px" className="object-contain" unoptimized />
            </div>
            {state.isUploading && <p className="text-xs text-neutral-500">Uploading…</p>}
            {state.uploadedUrl && !state.isUploading && <p className="text-xs text-emerald-700">Uploaded</p>}
            <button type="button" onClick={handleRemove} className="text-xs font-medium text-neutral-600 underline hover:text-neutral-900">
              Remove and choose another
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-600">Drag and drop your logo or graphic here, or</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full border border-neutral-900 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
            >
              Browse files
            </button>
            <p className="text-xs text-neutral-400">PNG, JPG, WEBP or SVG — up to 5MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={LOGO_UPLOAD_ACCEPTED_TYPES.join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="sr-only"
          aria-label="Upload logo or graphic"
        />
      </div>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
