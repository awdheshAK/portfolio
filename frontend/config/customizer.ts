export type CustomizerStepId =
  | "garment"
  | "fabric"
  | "color"
  | "size"
  | "style"
  | "logo"
  | "text"
  | "print"
  | "embroidery"
  | "patches"
  | "measurements"
  | "notes"
  | "review";

export interface CustomizerStepDef {
  id: CustomizerStepId;
  label: string;
  shortLabel: string;
  description: string;
  optional?: boolean;
}

export const CUSTOMIZER_STEPS: CustomizerStepDef[] = [
  { id: "garment", label: "Choose your garment", shortLabel: "Garment", description: "Pick the base garment you want to customize." },
  { id: "fabric", label: "Pick a fabric", shortLabel: "Fabric", description: "Choose the fabric your garment will be made from." },
  { id: "color", label: "Choose a color", shortLabel: "Color", description: "Pick the base color of the garment." },
  { id: "size", label: "Select size", shortLabel: "Size", description: "Choose your size, or use a saved measurement profile." },
  { id: "style", label: "Style details", shortLabel: "Style", description: "Fine-tune the fit and style of your garment." },
  { id: "logo", label: "Upload a logo or graphic", shortLabel: "Logo", description: "Upload artwork to print or embroider on your garment.", optional: true },
  { id: "text", label: "Add custom text", shortLabel: "Text", description: "Add a name, slogan or number.", optional: true },
  { id: "print", label: "Print placement", shortLabel: "Print", description: "Choose where your graphic should be placed.", optional: true },
  { id: "embroidery", label: "Embroidery", shortLabel: "Embroidery", description: "Add embroidery and choose a thread color.", optional: true },
  { id: "patches", label: "Patches & extras", shortLabel: "Patches", description: "Add patches or other finishing touches.", optional: true },
  { id: "measurements", label: "Measurements", shortLabel: "Fit", description: "Confirm your measurements for a perfect fit." },
  { id: "notes", label: "Notes for our team", shortLabel: "Notes", description: "Anything else our production team should know." },
  { id: "review", label: "Review & price", shortLabel: "Review", description: "Review your design, price breakdown and add to cart." },
];

export const LOGO_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const LOGO_UPLOAD_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export const CUSTOM_TEXT_MAX_LENGTH = 40;

export const CUSTOMIZER_FONTS = [
  { id: "sans", label: "Modern Sans", family: "Arial, Helvetica, sans-serif" },
  { id: "serif", label: "Classic Serif", family: "'Times New Roman', Georgia, serif" },
  { id: "script", label: "Script", family: "'Brush Script MT', cursive" },
  { id: "mono", label: "Mono Block", family: "'Courier New', monospace" },
];

export const NOTES_MAX_LENGTH = 500;

/**
 * The API contract's customizer /options endpoint only returns
 * `{ id, label, price_minor }` for print & embroidery positions — no
 * canvas coordinates. Coordinates are inferred here from the label text so
 * the live canvas preview can place artwork sensibly without backend
 * changes. If the backend later adds explicit anchors, prefer those.
 */
export function resolvePositionCoords(label: string): { x: number; y: number } {
  const l = label.toLowerCase();
  if (l.includes("left chest") || (l.includes("left") && l.includes("chest"))) return { x: 0.36, y: 0.28 };
  if (l.includes("right chest") || (l.includes("right") && l.includes("chest"))) return { x: 0.64, y: 0.28 };
  if (l.includes("chest") || l.includes("front center")) return { x: 0.5, y: 0.32 };
  if (l.includes("back") && (l.includes("center") || l.includes("centre"))) return { x: 0.5, y: 0.4 };
  if (l.includes("back")) return { x: 0.5, y: 0.38 };
  if (l.includes("left sleeve")) return { x: 0.18, y: 0.42 };
  if (l.includes("right sleeve")) return { x: 0.82, y: 0.42 };
  if (l.includes("sleeve")) return { x: 0.8, y: 0.42 };
  if (l.includes("pocket")) return { x: 0.4, y: 0.36 };
  if (l.includes("collar")) return { x: 0.5, y: 0.14 };
  if (l.includes("hem") || l.includes("bottom")) return { x: 0.5, y: 0.85 };
  return { x: 0.5, y: 0.3 };
}

export const MEASUREMENT_FIELDS = [
  { key: "chest", label: "Chest", unit: "in" },
  { key: "waist", label: "Waist", unit: "in" },
  { key: "hip", label: "Hip", unit: "in" },
  { key: "shoulder", label: "Shoulder", unit: "in" },
  { key: "sleeveLength", label: "Sleeve Length", unit: "in" },
  { key: "length", label: "Garment Length", unit: "in" },
] as const;

export type MeasurementKey = (typeof MEASUREMENT_FIELDS)[number]["key"];
export type MeasurementValues = Partial<Record<MeasurementKey, number>>;

export interface MeasurementProfile {
  id: string;
  name: string;
  values: MeasurementValues;
}

export const DEFAULT_MEASUREMENT_PROFILES: MeasurementProfile[] = [
  { id: "office-fit", name: "Office Fit", values: { chest: 40, waist: 34, hip: 40, shoulder: 18, sleeveLength: 25, length: 29 } },
  { id: "gym-fit", name: "Gym Fit", values: { chest: 42, waist: 32, hip: 41, shoulder: 19, sleeveLength: 24, length: 27 } },
];
