"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { CustomTextConfig } from "@/types/api";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  drawDashedIndicator,
  drawEmbroideryBadge,
  drawPatchBadge,
  drawPhotoGarment,
  drawVectorGarment,
  inferGarmentKind,
  loadImage,
} from "@/lib/canvas-garment";

export interface GarmentPreviewProps {
  garmentImageUrl?: string | null;
  garmentName?: string | null;
  colorHex: string;
  logoUrl?: string | null;
  logoPosition?: { x: number; y: number } | null;
  text?: CustomTextConfig | null;
  textPosition?: { x: number; y: number };
  printLabel?: string | null;
  printPosition?: { x: number; y: number } | null;
  embroidery?: { label: string; threadColor: string; position: { x: number; y: number } } | null;
  patches?: Array<{ id: number; name: string }>;
  className?: string;
}

/**
 * The customizer's live preview. Every prop change re-runs the full draw
 * pass — there is no static "fake" preview image. Layer order:
 *   garment (photo+multiply overlay, or a procedural vector fallback when no
 *   photo is available/loads) -> print placement indicator -> uploaded logo
 *   -> custom text -> embroidery badge -> patch badges.
 */
export const GarmentPreview = forwardRef<HTMLCanvasElement, GarmentPreviewProps>(function GarmentPreview(props, forwardedRef) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useImperativeHandle(forwardedRef, () => canvasRef.current as HTMLCanvasElement);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;

    async function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = "#faf9f6";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const kind = inferGarmentKind(props.garmentName);
      let garmentPath: Path2D;

      if (props.garmentImageUrl) {
        try {
          const img = await loadImage(props.garmentImageUrl);
          if (cancelled) return;
          garmentPath = drawPhotoGarment(ctx, img, CANVAS_WIDTH, CANVAS_HEIGHT, props.colorHex);
        } catch {
          if (cancelled) return;
          garmentPath = drawVectorGarment(ctx, kind, CANVAS_WIDTH, CANVAS_HEIGHT, props.colorHex);
        }
      } else {
        garmentPath = drawVectorGarment(ctx, kind, CANVAS_WIDTH, CANVAS_HEIGHT, props.colorHex);
      }
      if (cancelled) return;

      // Print / graphic placement indicator (shown even before a logo is
      // uploaded, so the user can see where it will go).
      if (props.printPosition && !props.logoUrl) {
        drawDashedIndicator(
          ctx,
          props.printPosition.x * CANVAS_WIDTH,
          props.printPosition.y * CANVAS_HEIGHT,
          90,
          70,
          props.printLabel || "Print area"
        );
      }

      // Uploaded logo / graphic, clipped to the garment silhouette and
      // anchored at the chosen print position (defaults to chest-center).
      if (props.logoUrl) {
        try {
          const logoImg = await loadImage(props.logoUrl);
          if (cancelled) return;
          const anchor = props.logoPosition || props.printPosition || { x: 0.5, y: 0.3 };
          const maxDim = CANVAS_WIDTH * 0.22;
          const scale = Math.min(maxDim / logoImg.width, maxDim / logoImg.height);
          const w = logoImg.width * scale;
          const h = logoImg.height * scale;
          const cx = anchor.x * CANVAS_WIDTH;
          const cy = anchor.y * CANVAS_HEIGHT;
          ctx.save();
          ctx.clip(garmentPath);
          ctx.drawImage(logoImg, cx - w / 2, cy - h / 2, w, h);
          ctx.restore();
        } catch {
          /* logo failed to load — skip drawing it, rest of preview continues */
        }
      }

      // Custom text.
      if (props.text && props.text.content.trim()) {
        const anchor = props.textPosition || { x: 0.5, y: 0.62 };
        const cx = anchor.x * CANVAS_WIDTH;
        const cy = anchor.y * CANVAS_HEIGHT;
        ctx.save();
        ctx.clip(garmentPath);
        ctx.translate(cx, cy);
        ctx.rotate((props.text.rotation * Math.PI) / 180);
        const weight = props.text.bold ? "700" : "400";
        const style = props.text.italic ? "italic" : "normal";
        ctx.font = `${style} ${weight} ${props.text.size}px ${props.text.font}`;
        ctx.fillStyle = props.text.color;
        ctx.textAlign = props.text.align;
        ctx.textBaseline = "middle";
        ctx.fillText(props.text.content, 0, 0);
        ctx.restore();
      }

      // Embroidery badge indicator.
      if (props.embroidery) {
        drawEmbroideryBadge(
          ctx,
          props.embroidery.position.x * CANVAS_WIDTH,
          props.embroidery.position.y * CANVAS_HEIGHT,
          props.embroidery.threadColor,
          props.embroidery.label
        );
      }

      // Patch badges, stacked along the top-right.
      if (props.patches && props.patches.length > 0) {
        props.patches.forEach((patch, i) => {
          drawPatchBadge(ctx, CANVAS_WIDTH * 0.86, CANVAS_HEIGHT * 0.12 + i * 38, patch.name);
        });
      }
    }

    draw();

    return () => {
      cancelled = true;
    };
    // Deliberately depends on primitive fields (below) rather than the
    // logoPosition/text/printPosition/embroidery/textPosition objects
    // themselves: the parent recreates those object literals on every
    // render, so depending on the objects would redraw the canvas far more
    // than necessary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.garmentImageUrl,
    props.garmentName,
    props.colorHex,
    props.logoUrl,
    props.logoPosition?.x,
    props.logoPosition?.y,
    props.text?.content,
    props.text?.font,
    props.text?.size,
    props.text?.color,
    props.text?.bold,
    props.text?.italic,
    props.text?.align,
    props.text?.rotation,
    props.textPosition?.x,
    props.textPosition?.y,
    props.printLabel,
    props.printPosition?.x,
    props.printPosition?.y,
    props.embroidery?.label,
    props.embroidery?.threadColor,
    props.embroidery?.position.x,
    props.embroidery?.position.y,
    props.patches,
  ]);

  return (
    <div className={props.className}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        role="img"
        aria-label="Live preview of your customized garment"
        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm"
      />
    </div>
  );
});
