"use client";

import type { CustomTextConfig } from "@/types/api";
import { CUSTOMIZER_FONTS, CUSTOM_TEXT_MAX_LENGTH } from "@/config/customizer";
import { cn } from "@/lib/cn";

const SWATCHES = ["#171717", "#ffffff", "#b3261e", "#1c2a4a", "#d4af37", "#2e7d32"];

export function TextEditor({ value, onChange }: { value: CustomTextConfig; onChange: (next: CustomTextConfig) => void }) {
  function update<K extends keyof CustomTextConfig>(key: K, val: CustomTextConfig[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="custom-text-content" className="mb-1 block text-sm font-medium text-neutral-900">
          Text
        </label>
        <input
          id="custom-text-content"
          type="text"
          value={value.content}
          maxLength={CUSTOM_TEXT_MAX_LENGTH}
          onChange={(e) => update("content", e.target.value)}
          placeholder="e.g. Your name or a short slogan"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
        <p className="mt-1 text-right text-xs text-neutral-400">
          {value.content.length}/{CUSTOM_TEXT_MAX_LENGTH}
        </p>
      </div>

      <div>
        <label htmlFor="custom-text-font" className="mb-1 block text-sm font-medium text-neutral-900">
          Font
        </label>
        <select
          id="custom-text-font"
          value={value.font}
          onChange={(e) => update("font", e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          {CUSTOMIZER_FONTS.map((font) => (
            <option key={font.id} value={font.family} style={{ fontFamily: font.family }}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="custom-text-size" className="mb-1 block text-sm font-medium text-neutral-900">
            Size: {value.size}px
          </label>
          <input
            id="custom-text-size"
            type="range"
            min={14}
            max={64}
            value={value.size}
            onChange={(e) => update("size", Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="custom-text-rotation" className="mb-1 block text-sm font-medium text-neutral-900">
            Rotation: {value.rotation}°
          </label>
          <input
            id="custom-text-rotation"
            type="range"
            min={-45}
            max={45}
            value={value.rotation}
            onChange={(e) => update("rotation", Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-neutral-900">Color</p>
        <div className="flex flex-wrap items-center gap-2">
          {SWATCHES.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => update("color", hex)}
              aria-label={`Text color ${hex}`}
              aria-pressed={value.color === hex}
              className={cn(
                "h-7 w-7 rounded-full border-2",
                value.color === hex ? "border-neutral-900" : "border-white ring-1 ring-neutral-200"
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
          <input
            type="color"
            value={value.color}
            onChange={(e) => update("color", e.target.value)}
            aria-label="Custom text color"
            className="h-7 w-9 cursor-pointer rounded border border-neutral-300"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input type="checkbox" checked={value.bold} onChange={(e) => update("bold", e.target.checked)} className="h-4 w-4" />
          Bold
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input type="checkbox" checked={value.italic} onChange={(e) => update("italic", e.target.checked)} className="h-4 w-4" />
          Italic
        </label>
        <div className="flex items-center gap-1 rounded-md border border-neutral-300 p-0.5">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => update("align", align)}
              aria-pressed={value.align === align}
              className={cn(
                "rounded px-2 py-1 text-xs capitalize",
                value.align === align ? "bg-neutral-900 text-white" : "text-neutral-600"
              )}
            >
              {align}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
