/**
 * Tracks in-progress chunked uploads on disk so uploads survive a page
 * refresh (resumable uploads). Each session is a small JSON sidecar plus the
 * growing binary file being assembled in storage/tmp.
 */
import fsp from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from './env';

export interface UploadSessionMeta {
  uploadId: string;
  userId: string;
  fileSize: number;
  receivedBytes: number;
  originalName: string;
  title: string;
  description?: string;
  tags: string[];
  categoryId?: string;
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  createdAt: string;
}

function tmpDir(): string {
  return path.resolve(env.localStorageRoot, 'tmp');
}

function sidecarPath(uploadId: string): string {
  return path.join(tmpDir(), `${uploadId}.json`);
}

export function partPath(uploadId: string): string {
  return path.join(tmpDir(), `${uploadId}.part`);
}

export async function createUploadSession(data: Omit<UploadSessionMeta, 'uploadId' | 'receivedBytes' | 'createdAt'>): Promise<UploadSessionMeta> {
  await fsp.mkdir(tmpDir(), { recursive: true });
  const uploadId = randomUUID();
  const meta: UploadSessionMeta = {
    ...data,
    uploadId,
    receivedBytes: 0,
    createdAt: new Date().toISOString(),
  };
  await fsp.writeFile(sidecarPath(uploadId), JSON.stringify(meta));
  await fsp.writeFile(partPath(uploadId), Buffer.alloc(0));
  return meta;
}

export async function readUploadSession(uploadId: string): Promise<UploadSessionMeta | null> {
  try {
    const raw = await fsp.readFile(sidecarPath(uploadId), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeUploadSession(meta: UploadSessionMeta): Promise<void> {
  await fsp.writeFile(sidecarPath(meta.uploadId), JSON.stringify(meta));
}

export async function appendChunk(uploadId: string, offset: number, chunk: Buffer): Promise<void> {
  const fh = await fsp.open(partPath(uploadId), 'r+');
  try {
    await fh.write(chunk, 0, chunk.length, offset);
  } finally {
    await fh.close();
  }
}

export async function deleteUploadSession(uploadId: string): Promise<void> {
  await Promise.allSettled([fsp.unlink(sidecarPath(uploadId)), fsp.unlink(partPath(uploadId))]);
}
