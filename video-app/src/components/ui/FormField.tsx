export default function FormField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block mb-4">
      <span className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/50 transition-shadow"
      />
    </label>
  );
}
