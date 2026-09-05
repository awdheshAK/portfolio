import { NextResponse } from 'next/server';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { requireUser, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { readUploadSession, deleteUploadSession, partPath } from '@/lib/uploadSession';
import { detectContainer, isAllowedContainer, mimeForContainer, generateInternalFilename, slugify } from '@/lib/validation';
import { getStorageProvider } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { enqueueProcessingJob } from '@/lib/queue';
import { env } from '@/lib/env';
import { logAudit, ipFromRequest } from '@/lib/audit';

const Schema = z.object({ uploadId: z.string() });

async function streamChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError('Missing uploadId.', 400);

  const session = await readUploadSession(parsed.data.uploadId);
  if (!session) throw new ApiError('Upload session not found or already completed.', 404);
  if (session.userId !== user.id) throw new ApiError('Forbidden.', 403);

  if (session.receivedBytes !== session.fileSize) {
    throw new ApiError('Upload incomplete: not all chunks were received.', 400);
  }

  const filePath = partPath(session.uploadId);

  const fd = await fsp.open(filePath, 'r');
  const headerBuf = Buffer.alloc(4096);
  await fd.read(headerBuf, 0, 4096, 0);
  await fd.close();

  const container = detectContainer(headerBuf);
  if (!isAllowedContainer(container)) {
    await deleteUploadSession(session.uploadId);
    throw new ApiError('Unsupported video format. Allowed formats: MP4, MOV, WebM, AVI, MKV.', 415);
  }

  if (session.fileSize > env.maxUploadSizeBytes) {
    await deleteUploadSession(session.uploadId);
    throw new ApiError('File exceeds maximum allowed size.', 413);
  }

  const checksum = await streamChecksum(filePath);
  const duplicate = await prisma.videoFile.findFirst({ where: { checksum, kind: 'ORIGINAL' }, select: { videoId: true } });

  const internalFilename = generateInternalFilename(container);
  const storage = getStorageProvider();
  const storageKey = await storage.putFromLocalFile('videos', internalFilename, filePath);

  const baseSlug = slugify(session.title);
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.video.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const video = await prisma.video.create({
    data: {
      title: session.title,
      slug,
      description: session.description,
      ownerId: user.id,
      categoryId: session.categoryId || undefined,
      visibility: session.visibility,
      status: 'PROCESSING',
      moderationFlag: Boolean(duplicate),
      moderationNote: duplicate ? `Duplicate of video ${duplicate.videoId} (identical checksum).` : undefined,
      tags: session.tags.length
        ? {
            create: await Promise.all(
              session.tags.map(async (name) => {
                const tagSlug = slugify(name);
                const tag = await prisma.tag.upsert({
                  where: { slug: tagSlug },
                  update: {},
                  create: { name, slug: tagSlug },
                });
                return { tagId: tag.id };
              }),
            ),
          }
        : undefined,
      files: {
        create: {
          kind: 'ORIGINAL',
          label: 'original',
          storageKey,
          mimeType: mimeForContainer(container),
          sizeBytes: BigInt(session.fileSize),
          checksum,
        },
      },
    },
  });

  await enqueueProcessingJob(video.id, user.id);
  await deleteUploadSession(session.uploadId);
  await logAudit({ userId: user.id, action: 'video.upload', targetType: 'Video', targetId: video.id, ip: ipFromRequest(req) });

  return NextResponse.json({ videoId: video.id, slug: video.slug, flaggedDuplicate: Boolean(duplicate) });
});
