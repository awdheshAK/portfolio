"use client";

import { useEffect, useState } from "react";
import { MEASUREMENT_FIELDS, type MeasurementProfile, type MeasurementValues } from "@/config/customizer";
import { deleteMeasurementProfile, loadMeasurementProfiles, upsertMeasurementProfile } from "@/services/measurements";

export function MeasurementForm({
  values,
  onChange,
}: {
  values: MeasurementValues;
  onChange: (next: MeasurementValues) => void;
}) {
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("custom");
  const [newProfileName, setNewProfileName] = useState("");

  useEffect(() => {
    setProfiles(loadMeasurementProfiles());
  }, []);

  function applyProfile(id: string) {
    setSelectedProfileId(id);
    if (id === "custom") return;
    const profile = profiles.find((p) => p.id === id);
    if (profile) onChange(profile.values);
  }

  function handleSaveProfile() {
    if (!newProfileName.trim()) return;
    const profile: MeasurementProfile = { id: newProfileName.trim().toLowerCase().replace(/\s+/g, "-"), name: newProfileName.trim(), values };
    const next = upsertMeasurementProfile(profile);
    setProfiles(next);
    setSelectedProfileId(profile.id);
    setNewProfileName("");
  }

  function handleDeleteProfile(id: string) {
    const next = deleteMeasurementProfile(id);
    setProfiles(next);
    if (selectedProfileId === id) setSelectedProfileId("custom");
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="measurement-profile" className="mb-1 block text-sm font-medium text-neutral-900">
          Saved profile
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="measurement-profile"
            value={selectedProfileId}
            onChange={(e) => applyProfile(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            <option value="custom">Custom measurements</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {selectedProfileId !== "custom" && (
            <button
              type="button"
              onClick={() => handleDeleteProfile(selectedProfileId)}
              className="text-xs font-medium text-neutral-500 underline hover:text-red-600"
            >
              Delete profile
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-neutral-400">Profiles like &ldquo;Office Fit&rdquo; or &ldquo;Gym Fit&rdquo; are saved in this browser.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {MEASUREMENT_FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={`measurement-${field.key}`} className="mb-1 block text-xs font-medium text-neutral-700">
              {field.label} ({field.unit})
            </label>
            <input
              id={`measurement-${field.key}`}
              type="number"
              min={0}
              step={0.5}
              value={values[field.key] ?? ""}
              onChange={(e) => {
                setSelectedProfileId("custom");
                onChange({ ...values, [field.key]: e.target.value ? Number(e.target.value) : undefined });
              }}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4">
        <input
          type="text"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          placeholder="Name this profile, e.g. Office Fit"
          className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={!newProfileName.trim()}
          className="rounded-full border border-neutral-900 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
        >
          Save as profile
        </button>
      </div>
    </div>
  );
}
