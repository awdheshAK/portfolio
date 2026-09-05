import AiToolsClient from '@/components/admin/AiToolsClient';
import { env } from '@/lib/env';

export default function AdminAiToolsPage() {
  const providerLabel = env.anthropicApiKey ? 'Anthropic (Claude)' : 'Local heuristic engine (no external API calls)';
  return <AiToolsClient providerLabel={providerLabel} />;
}
