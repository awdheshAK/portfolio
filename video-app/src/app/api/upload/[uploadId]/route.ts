import { NextResponse } from 'next/server';
import { requireUser, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { readUploadSession, deleteUploadSession } from '@/lib/uploadSession';

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { uploadId: string } }) => {
  const user = await requireUser();
  const session = await readUploadSession(params.uploadId);
  if (!session) throw new ApiError('Upload session not found.', 404);
  if (session.userId !== user.id) throw new ApiError('Forbidden.', 403);

  return NextResponse.json({ receivedBytes: session.receivedBytes, fileSize: session.fileSize });
});

export const DELETE = withErrorHandling(async (_req: Request, { params }: { params: { uploadId: string } }) => {
  const user = await requireUser();
  const session = await readUploadSession(params.uploadId);
  if (!session) return NextResponse.json({ success: true });
  if (session.userId !== user.id) throw new ApiError('Forbidden.', 403);

  await deleteUploadSession(params.uploadId);
  return NextResponse.json({ success: true });
});
