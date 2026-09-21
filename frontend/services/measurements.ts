import { DEFAULT_MEASUREMENT_PROFILES, type MeasurementProfile } from "@/config/customizer";

// ASSUMPTION: docs/API_CONTRACT.md has no measurement-profile endpoints, so
// saved measurement profiles ("Office Fit", "Gym Fit", ...) are persisted in
// localStorage for this MVP. Recommend the backend add
// GET/POST/PUT/DELETE /api/v1/measurements so profiles sync across devices.

const STORAGE_KEY = "ccp_measurement_profiles";

export function loadMeasurementProfiles(): MeasurementProfile[] {
  if (typeof window === "undefined") return DEFAULT_MEASUREMENT_PROFILES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MEASUREMENT_PROFILES;
    const parsed = JSON.parse(raw) as MeasurementProfile[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_MEASUREMENT_PROFILES;
    return parsed;
  } catch {
    return DEFAULT_MEASUREMENT_PROFILES;
  }
}

export function saveMeasurementProfiles(profiles: MeasurementProfile[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    /* ignore */
  }
}

export function upsertMeasurementProfile(profile: MeasurementProfile): MeasurementProfile[] {
  const profiles = loadMeasurementProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  const next = idx >= 0 ? [...profiles.slice(0, idx), profile, ...profiles.slice(idx + 1)] : [...profiles, profile];
  saveMeasurementProfiles(next);
  return next;
}

export function deleteMeasurementProfile(id: string): MeasurementProfile[] {
  const next = loadMeasurementProfiles().filter((p) => p.id !== id);
  saveMeasurementProfiles(next);
  return next;
}
