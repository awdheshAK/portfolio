export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-serif text-2xl font-semibold text-neutral-900">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-neutral-600">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}
