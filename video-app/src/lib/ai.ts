/**
 * AI feature abstraction.
 *
 * All AI-powered features (metadata generation, natural-language search
 * parsing, recommendations) go through this module. When ANTHROPIC_API_KEY
 * is configured, requests are sent to Claude. When it isn't (the local dev
 * default), a fully-functional heuristic implementation runs instead - this
 * is a real, working local fallback, not a stub that shows an alert.
 */
import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';
import { heuristicChapters, type ProbeResult } from './ffmpeg';

export interface GeneratedMetadata {
  titleSuggestions: string[];
  description: string;
  tags: string[];
  language: string;
  chapters: { title: string; startSec: number }[];
}

function client(): Anthropic | null {
  if (!env.anthropicApiKey) return null;
  return new Anthropic({ apiKey: env.anthropicApiKey });
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'on', 'for', 'with', 'is', 'are', 'this', 'that',
  'video', 'mp4', 'mov', 'final', 'copy', 'edit', 'export', 'new',
]);

function wordsFromFilename(originalName: string): string[] {
  return originalName
    .replace(/\.[a-z0-9]+$/i, '')
    .split(/[-_.\s]+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Local, dependency-free heuristic metadata generator. */
function localGenerateMetadata(originalName: string, probe: ProbeResult, categoryName?: string): GeneratedMetadata {
  const words = wordsFromFilename(originalName);
  const base = words.length ? titleCase(words.join(' ')) : 'Untitled Upload';
  const minutes = Math.round(probe.durationSec / 60);

  const titleSuggestions = [
    base,
    `${base} - Full Video`,
    minutes > 0 ? `${base} (${minutes} min)` : base,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const tags = Array.from(new Set([...words, categoryName?.toLowerCase()].filter(Boolean))) as string[];

  const description = [
    `${base}.`,
    probe.width && probe.height ? `Filmed in ${probe.width}x${probe.height}.` : null,
    minutes > 0 ? `Runtime approximately ${minutes} minute${minutes === 1 ? '' : 's'}.` : null,
    categoryName ? `Category: ${categoryName}.` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    titleSuggestions,
    description,
    tags: tags.slice(0, 8),
    language: 'en',
    chapters: heuristicChapters(probe.durationSec),
  };
}

export async function generateVideoMetadata(
  originalName: string,
  probe: ProbeResult,
  categoryName?: string,
): Promise<GeneratedMetadata> {
  const anthropic = client();
  if (!anthropic) return localGenerateMetadata(originalName, probe, categoryName);

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `A user uploaded a video file named "${originalName}" (duration ${Math.round(
            probe.durationSec,
          )}s, resolution ${probe.width}x${probe.height}${categoryName ? `, category ${categoryName}` : ''}).
Respond with ONLY minified JSON matching this TypeScript type, no prose:
{"titleSuggestions": string[3], "description": string, "tags": string[up to 8], "language": string (ISO 639-1), "chapters": {"title": string, "startSec": number}[]}`,
        },
      ],
    });
    const text = msg.content.find((b) => b.type === 'text')?.text ?? '{}';
    const parsed = JSON.parse(text.trim());
    return {
      titleSuggestions: parsed.titleSuggestions ?? [originalName],
      description: parsed.description ?? '',
      tags: parsed.tags ?? [],
      language: parsed.language ?? 'en',
      chapters: parsed.chapters ?? heuristicChapters(probe.durationSec),
    };
  } catch {
    return localGenerateMetadata(originalName, probe, categoryName);
  }
}

export interface ParsedSearchIntent {
  keywords: string[];
  minDurationSec?: number;
  maxDurationSec?: number;
  uploadedAfter?: Date;
  sortBy?: 'newest' | 'popular' | 'views';
}

/**
 * Rule-based natural-language query parser. Handles the example queries from
 * the product spec ("uploaded this week", "longer than 20 minutes",
 * "popular videos about X") without any external API call.
 */
export function parseSearchIntent(query: string): ParsedSearchIntent {
  const q = query.toLowerCase();
  const result: ParsedSearchIntent = { keywords: [] };

  const longerMatch = q.match(/longer than (\d+)\s*(minute|min|hour)/);
  if (longerMatch) {
    const n = Number(longerMatch[1]);
    result.minDurationSec = longerMatch[2].startsWith('hour') ? n * 3600 : n * 60;
  }
  const shorterMatch = q.match(/(shorter|less) than (\d+)\s*(minute|min|hour)/);
  if (shorterMatch) {
    const n = Number(shorterMatch[2]);
    result.maxDurationSec = shorterMatch[3].startsWith('hour') ? n * 3600 : n * 60;
  }

  if (/\bthis week\b/.test(q)) {
    result.uploadedAfter = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  } else if (/\btoday\b/.test(q)) {
    result.uploadedAfter = new Date(Date.now() - 24 * 3600 * 1000);
  } else if (/\bthis month\b/.test(q)) {
    result.uploadedAfter = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  }

  if (/\bpopular\b|\btrending\b|\bmost viewed\b/.test(q)) result.sortBy = 'popular';
  else if (/\bnewest\b|\blatest\b|\brecent\b/.test(q)) result.sortBy = 'newest';

  let cleaned = q
    .replace(/(show me|find|search for|videos?|about|longer than|shorter than|less than)/g, ' ')
    .replace(/\d+\s*(minute|min|hour)s?/g, ' ')
    .replace(/(this week|today|this month|popular|trending|most viewed|newest|latest|recent)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  result.keywords = Array.from(new Set(cleaned));
  return result;
}
