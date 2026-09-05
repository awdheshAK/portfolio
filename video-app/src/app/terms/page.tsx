export const metadata = { title: 'Terms of Use' };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 prose dark:prose-invert">
      <h1 className="text-2xl font-bold mb-4">Terms of Use</h1>
      <p className="text-sm text-surface-500 leading-relaxed">
        This is a demonstration video sharing platform. By uploading content you confirm you own the rights to it or
        have permission to share it, and that it complies with applicable laws. Content that violates copyright,
        contains malware, or breaches our content policy will be removed. See our moderation and reporting tools for
        how violations are handled.
      </p>
    </div>
  );
}
