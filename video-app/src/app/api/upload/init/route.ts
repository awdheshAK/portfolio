import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { createUploadSession } from '@/lib/uploadSession';
import { env } from '@/lib/env';
import { sanitizeTextField } from '@/lib/validation';

const Schema = z.object({
  fileSize: z.number().positive(),
  originalName: z.string().min(1).max(255),
  title: z.string().min(1).max(150),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(30)).max(20).optional(),
  categoryId: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).default('PRIVATE'),
});

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) {
    throw new ApiError(parsed.error.errors[0]?.message ?? 'Invalid upload request.', 400);
  }
  const data = parsed.data;

  if (data.fileSize > env.maxUploadSizeBytes) {
    throw new ApiError('File exceeds maximum allowed size.', 413);
  }

  const session = await createUploadSession({
    userId: user.id,
    fileSize: data.fileSize,
    originalName: sanitizeTextField(data.originalName, 255),
    title: sanitizeTextField(data.title, 150),
    description: data.description ? sanitizeTextField(data.description, 5000) : undefined,
    tags: (data.tags ?? []).map((t) => sanitizeTextField(t, 30)).filter(Boolean),
    categoryId: data.categoryId,
    visibility: data.visibility,
  });

  return NextResponse.json({
    uploadId: session.uploadId,
    chunkSize: env.uploadChunkSizeBytes,
  });
});
