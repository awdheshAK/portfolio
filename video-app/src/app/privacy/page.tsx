export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-sm text-surface-500 leading-relaxed">
        We store the minimum data required to operate the platform: your account details, uploaded video metadata,
        and engagement events (views, downloads, watch history) tied to your account. Watch history, search history,
        and favorites are private to your account and are never shown to other users - they are only used to power
        your personal recommendations. IP addresses are hashed before storage and used only for rate limiting and
        abuse prevention.
      </p>
    </div>
  );
}
