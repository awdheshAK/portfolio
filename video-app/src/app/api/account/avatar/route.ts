import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { requireUser, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { detectImage, generateInternalImageFilename } from '@/lib/validation';
import { getStorageProvider } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { buildSignedAssetUrl } from '@/lib/signedUrl';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new ApiError('Missing file.', 400);
  if (file.size > MAX_AVATAR_BYTES) throw new ApiError('Avatar image exceeds 5MB.', 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (detectImage(buffer) === 'unknown') throw new ApiError('Unsupported image format. Use JPG, PNG, or WebP.', 415);

  const normalized = await sharp(buffer).resize(256, 256, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();

  const storage = getStorageProvider();
  const key = generateInternalImageFilename('jpg');
  await storage.put('thumbnails', key, normalized);

  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: key } });

  return NextResponse.json({ avatarUrl: buildSignedAssetUrl('thumbnails', key, { userId: user.id, ttlSeconds: 86400 }) });
});
