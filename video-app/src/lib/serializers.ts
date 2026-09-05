import { buildSignedAssetUrl } from './signedUrl';

type VideoWithRelations = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  visibility: string;
  status: string;
  durationSec: number | null;
  width: number | null;
  height: number | null;
  thumbnailKey: string | null;
  previewKey: string | null;
  language: string | null;
  chapters: unknown;
  aiGenerated: boolean;
  viewCount: number;
  downloadCount: number;
  likeCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  owner: { id: string; name: string; username: string; avatarUrl: string | null };
  category: { id: string; name: string; slug: string } | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
  files?: { id: string; kind: string; label: string; storageKey: string; sizeBytes: bigint; mimeType: string }[];
};

export function serializeVideoCard(video: VideoWithRelations, userId?: string) {
  return {
    id: video.id,
    title: video.title,
    slug: video.slug,
    durationSec: video.durationSec,
    thumbnailUrl: video.thumbnailKey ? buildSignedAssetUrl('thumbnails', video.thumbnailKey, { userId, ttlSeconds: 3600 }) : null,
    previewUrl: video.previewKey ? buildSignedAssetUrl('previews', video.previewKey, { userId, ttlSeconds: 3600 }) : null,
    viewCount: video.viewCount,
    publishedAt: video.publishedAt,
    createdAt: video.createdAt,
    owner: { username: video.owner.username, name: video.owner.name, avatarUrl: video.owner.avatarUrl },
    category: video.category,
  };
}

export function serializeVideoDetail(video: VideoWithRelations, userId?: string) {
  const renditions = (video.files ?? [])
    .filter((f) => f.kind === 'RENDITION' || f.kind === 'ORIGINAL')
    .map((f) => ({
      id: f.id,
      label: f.label,
      kind: f.kind,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes.toString(),
      streamUrl: buildSignedAssetUrl('transcoded', f.storageKey, { userId, purpose: 'stream', ttlSeconds: 3600 }),
    }));

  // Original files live in the `videos` bucket, not `transcoded`.
  const originalFile = (video.files ?? []).find((f) => f.kind === 'ORIGINAL');
  const fixedRenditions = renditions.map((r) => {
    if (r.kind === 'ORIGINAL' && originalFile) {
      return { ...r, streamUrl: buildSignedAssetUrl('videos', originalFile.storageKey, { userId, purpose: 'stream', ttlSeconds: 3600 }) };
    }
    return r;
  });

  return {
    ...serializeVideoCard(video, userId),
    description: video.description,
    visibility: video.visibility,
    status: video.status,
    width: video.width,
    height: video.height,
    language: video.language,
    chapters: video.chapters,
    aiGenerated: video.aiGenerated,
    downloadCount: video.downloadCount,
    likeCount: video.likeCount,
    tags: video.tags.map((t) => t.tag),
    renditions: fixedRenditions,
  };
}
