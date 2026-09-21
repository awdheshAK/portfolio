"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MEASUREMENT_FIELDS, type MeasurementProfile } from "@/config/customizer";
import { deleteMeasurementProfile, loadMeasurementProfiles, upsertMeasurementProfile } from "@/services/measurements";
import { EmptyState } from "@/components/ui/EmptyState";

export default function MeasurementsPage() {
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [editing, setEditing] = useState<MeasurementProfile | null>(null);

  useEffect(() => {
    setProfiles(loadMeasurementProfiles());
  }, []);

  function handleSave() {
    if (!editing || !editing.name.trim()) return;
    const profile: MeasurementProfile = { ...editing, id: editing.id || editing.name.trim().toLowerCase().replace(/\s+/g, "-") };
    setProfiles(upsertMeasurementProfile(profile));
    setEditing(null);
  }

  function handleDelete(id: string) {
    setProfiles(deleteMeasurementProfile(id));
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500">
        Saved locally in this browser and available to select from in the customizer&apos;s Measurements step.
      </p>

      {profiles.length === 0 && !editing && (
        <EmptyState title="No saved measurement profiles" description="Create one to speed up future orders." actionLabel="Go to Customizer" actionHref="/customize" />
      )}

      <div className="space-y-3">
        {profiles.map((profile) => (
          <div key={profile.id} className="rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">{profile.name}</p>
              <div className="flex gap-3 text-sm">
                <button type="button" onClick={() => setEditing(profile)} className="font-medium text-neutral-700 underline">
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(profile.id)} className="text-neutral-500 underline hover:text-red-600">
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-neutral-500 sm:grid-cols-6">
              {MEASUREMENT_FIELDS.map((field) => (
                <span key={field.key}>
                  {field.label}: {profile.values[field.key] ?? "—"} {field.unit}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editing ? (
        <div className="rounded-lg border border-neutral-200 p-4">
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-medium text-neutral-900">Profile name</span>
            <input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            />
          </label>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {MEASUREMENT_FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">
                  {field.label} ({field.unit})
                </span>
                <input
                  type="number"
                  value={editing.values[field.key] ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, values: { ...editing.values, [field.key]: e.target.value ? Number(e.target.value) : undefined } })
                  }
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700">
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700">
              Save profile
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing({ id: "", name: "", values: {} })}
          className="rounded-full border border-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
        >
          + New profile
        </button>
      )}

      <p className="text-sm text-neutral-500">
        Ready to use these? <Link href="/customize" className="font-medium text-neutral-900 underline">Start customizing →</Link>
      </p>
    </div>
  );
}
