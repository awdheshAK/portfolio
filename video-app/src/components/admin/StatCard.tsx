export default function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-surface-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-surface-400">{hint}</p>}
    </div>
  );
}
