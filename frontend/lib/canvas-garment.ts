// Procedural garment silhouettes + compositing helpers for the customizer's
// live canvas preview (components/customizer/GarmentPreview.tsx).
//
// Two rendering paths are supported:
//  1. A real garment photo (garment.image_layers.base from the backend) is
//     recolored using canvas globalCompositeOperation ('multiply' blended
//     against the photo, then masked back to the photo's own alpha with
//     'destination-in' so color never bleeds outside the garment).
//  2. A hand-drawn vector silhouette (used when no photo is available, or it
//     fails to load) so the customizer is fully demonstrable offline.
// Either way, a Path2D of the garment outline is produced so logo/text/print
// placements can be clipped to the garment shape.

export type GarmentKind = "tshirt" | "hoodie" | "polo" | "shirt";

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 750;

export function inferGarmentKind(hint: string | undefined | null): GarmentKind {
  const value = (hint || "").toLowerCase();
  if (value.includes("hood")) return "hoodie";
  if (value.includes("polo")) return "polo";
  if (value.includes("shirt") && !value.includes("t-shirt") && !value.includes("tshirt")) return "shirt";
  return "tshirt";
}

/** Builds the garment body outline (front view) as a Path2D, in canvas pixel space. */
export function buildGarmentPath(kind: GarmentKind, w: number, h: number): Path2D {
  const p = new Path2D();
  const hasHood = kind === "hoodie";
  const collarV = kind === "polo";

  const collarLeftX = w * 0.4;
  const collarRightX = w * 0.6;
  const collarY = h * 0.1;
  const shoulderLeftX = w * 0.22;
  const shoulderRightX = w * 0.78;
  const shoulderY = h * 0.15;
  const sleeveOuterLeftX = w * 0.04;
  const sleeveOuterRightX = w * 0.96;
  const sleeveY = h * 0.34;
  const underarmLeftX = w * 0.29;
  const underarmRightX = w * 0.71;
  const underarmY = h * 0.29;
  const hemY = h * 0.92;

  p.moveTo(collarLeftX, collarY);
  if (hasHood) {
    p.quadraticCurveTo(w * 0.32, h * 0.02, w * 0.28, h * 0.08);
    p.quadraticCurveTo(w * 0.24, h * 0.16, w * 0.3, h * 0.19);
  }
  p.lineTo(shoulderLeftX, shoulderY);
  p.lineTo(sleeveOuterLeftX, sleeveY);
  p.quadraticCurveTo(w * 0.14, h * 0.4, w * 0.2, h * 0.4);
  p.lineTo(underarmLeftX, underarmY);
  p.lineTo(underarmLeftX, hemY);
  p.lineTo(underarmRightX, hemY);
  p.lineTo(underarmRightX, underarmY);
  p.lineTo(w * 0.8, h * 0.4);
  p.quadraticCurveTo(w * 0.86, h * 0.4, sleeveOuterRightX, sleeveY);
  p.lineTo(shoulderRightX, shoulderY);
  if (hasHood) {
    p.quadraticCurveTo(w * 0.76, h * 0.16, w * 0.72, h * 0.08);
    p.quadraticCurveTo(w * 0.68, h * 0.02, collarRightX, collarY);
  } else if (collarV) {
    p.lineTo(w * 0.5, h * 0.19);
  }
  p.quadraticCurveTo(w * 0.5, hasHood ? h * 0.02 : h * 0.06, collarLeftX, collarY);
  p.closePath();
  return p;
}

/** Draws a subtle woven-fabric shading so a flat fill still reads as cloth. */
function paintFabricShading(ctx: CanvasRenderingContext2D, path: Path2D, w: number, h: number) {
  ctx.save();
  ctx.clip(path);
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "rgba(255,255,255,0.18)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function drawVectorGarment(ctx: CanvasRenderingContext2D, kind: GarmentKind, w: number, h: number, colorHex: string): Path2D {
  const path = buildGarmentPath(kind, w, h);
  ctx.save();
  ctx.fillStyle = colorHex;
  ctx.fill(path);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.stroke(path);
  ctx.restore();
  paintFabricShading(ctx, path, w, h);

  // A couple of construction lines (collar rib, hem) for visual richness.
  ctx.save();
  ctx.clip(path);
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.38, h * 0.135);
  ctx.lineTo(w * 0.62, h * 0.135);
  ctx.stroke();
  if (kind === "polo") {
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.19);
    ctx.lineTo(w * 0.5, h * 0.3);
    ctx.stroke();
  }
  ctx.restore();
  return path;
}

/**
 * Draws a garment photo recolored via canvas compositing:
 * multiply the chosen color over the photo, then clip that back to the
 * photo's own silhouette using destination-in so color never bleeds onto
 * the transparent background around the garment.
 */
export function drawPhotoGarment(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, colorHex: string): Path2D {
  const scale = Math.min(w / img.width, h / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = (w - drawW) / 2;
  const dy = (h - drawH) / 2;

  ctx.save();
  ctx.drawImage(img, dx, dy, drawW, drawH);

  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = colorHex;
  ctx.fillRect(dx, dy, drawW, drawH);

  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(img, dx, dy, drawW, drawH);

  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  // Approximate outline for clipping logo/text placements to the garment.
  const path = buildGarmentPath("tshirt", w, h);
  return path;
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export function drawDashedIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string
) {
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "rgba(23,23,23,0.55)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(23,23,23,0.75)";
  ctx.font = "11px var(--font-sans, sans-serif)";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + h / 2 + 14);
  ctx.restore();
}

export function drawEmbroideryBadge(ctx: CanvasRenderingContext2D, x: number, y: number, threadColor: string, label: string) {
  ctx.save();
  const radius = 22;
  const gradient = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, radius);
  gradient.addColorStop(0, lighten(threadColor, 0.35));
  gradient.addColorStop(1, threadColor);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(23,23,23,0.8)";
  ctx.font = "11px var(--font-sans, sans-serif)";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + radius + 14);
  ctx.restore();
}

export function drawPatchBadge(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  ctx.save();
  const w = 46;
  const h = 30;
  ctx.fillStyle = "#f5f0e6";
  ctx.strokeStyle = "rgba(23,23,23,0.4)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#171717";
  ctx.font = "9px var(--font-sans, sans-serif)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(truncate(label, 8), x, y + 1);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function lighten(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const num = parseInt(normalized, 16);
  const r = Math.min(255, ((num >> 16) & 255) + 255 * amount);
  const g = Math.min(255, ((num >> 8) & 255) + 255 * amount);
  const b = Math.min(255, (num & 255) + 255 * amount);
  return `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
}
