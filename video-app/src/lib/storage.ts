/**
 * Storage abstraction.
 *
 * Every part of the application reads/writes video assets through this
 * module instead of touching the filesystem directly. Today only the local
 * disk provider is implemented, but the interface already matches what an
 * S3-compatible provider needs (put/get/delete/stat + a way to mint a
 * public-ish URL). Switching STORAGE_DRIVER=s3 and implementing
 * `S3StorageProvider` (kept as a stub below) is the only change required to
 * move to cloud object storage + CDN - no callers need to change.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { env } from './env';

export type StorageBucket = 'videos' | 'thumbnails' | 'previews' | 'transcoded' | 'tmp';

export interface StorageProvider {
  /** Persist a buffer/stream under bucket/key. Returns the storage key. */
  put(bucket: StorageBucket, key: string, data: Buffer): Promise<string>;
  /**
   * Move/upload a large file already sitting on local disk (e.g. an
   * assembled chunked upload) into the given bucket/key without buffering it
   * fully in memory. The local provider does an `fs.rename`; a cloud
   * provider would stream the file into a multipart upload instead.
   */
  putFromLocalFile(bucket: StorageBucket, key: string, localPath: string): Promise<string>;
  /** Open a read stream for a stored object. */
  createReadStream(bucket: StorageBucket, key: string, range?: { start: number; end?: number }): fs.ReadStream;
  /** Absolute path helper - local provider only; cloud providers should not expose this. */
  resolvePath(bucket: StorageBucket, key: string): string;
  stat(bucket: StorageBucket, key: string): Promise<{ size: number } | null>;
  delete(bucket: StorageBucket, key: string): Promise<void>;
  exists(bucket: StorageBucket, key: string): Promise<boolean>;
  /**
   * Build a URL that clients can use to fetch the object. In local mode this
   * points at our own signed-URL API route; in cloud mode this would return
   * a pre-signed S3/CloudFront URL instead - the caller doesn't need to know
   * which.
   */
  buildDeliveryPath(bucket: StorageBucket, key: string): string;
}

class LocalStorageProvider implements StorageProvider {
  private root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
    for (const bucket of ['videos', 'thumbnails', 'previews', 'transcoded', 'tmp'] as StorageBucket[]) {
      fs.mkdirSync(path.join(this.root, bucket), { recursive: true });
    }
  }

  resolvePath(bucket: StorageBucket, key: string): string {
    const safeKey = sanitizeKey(key);
    return path.join(this.root, bucket, safeKey);
  }

  async put(bucket: StorageBucket, key: string, data: Buffer): Promise<string> {
    const dest = this.resolvePath(bucket, key);
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    await fsp.writeFile(dest, data);
    return key;
  }

  async putFromLocalFile(bucket: StorageBucket, key: string, localPath: string): Promise<string> {
    const dest = this.resolvePath(bucket, key);
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    try {
      await fsp.rename(localPath, dest);
    } catch (err: any) {
      // EXDEV: source/dest on different filesystems/devices - fall back to copy+unlink.
      if (err.code === 'EXDEV') {
        await fsp.copyFile(localPath, dest);
        await fsp.unlink(localPath);
      } else {
        throw err;
      }
    }
    return key;
  }

  createReadStream(bucket: StorageBucket, key: string, range?: { start: number; end?: number }): fs.ReadStream {
    const p = this.resolvePath(bucket, key);
    return fs.createReadStream(p, range ? { start: range.start, end: range.end } : undefined);
  }

  async stat(bucket: StorageBucket, key: string): Promise<{ size: number } | null> {
    try {
      const s = await fsp.stat(this.resolvePath(bucket, key));
      return { size: s.size };
    } catch {
      return null;
    }
  }

  async delete(bucket: StorageBucket, key: string): Promise<void> {
    try {
      await fsp.unlink(this.resolvePath(bucket, key));
    } catch {
      // already gone - fine
    }
  }

  async exists(bucket: StorageBucket, key: string): Promise<boolean> {
    return (await this.stat(bucket, key)) !== null;
  }

  buildDeliveryPath(bucket: StorageBucket, key: string): string {
    // Delegated to /api/files which validates signed tokens before serving.
    return `/api/files/${bucket}/${encodeURIComponent(key)}`;
  }
}

/**
 * Stub for the future cloud provider. Implementing this (using the AWS SDK
 * v3 S3 client) and returning it from `getStorageProvider()` when
 * STORAGE_DRIVER=s3 completes the migration to object storage + CDN.
 */
class S3StorageProvider implements StorageProvider {
  put(): Promise<string> {
    throw new Error('S3StorageProvider not configured. Implement using @aws-sdk/client-s3.');
  }
  putFromLocalFile(): Promise<string> {
    throw new Error('S3StorageProvider not configured. Implement a multipart upload from the local file.');
  }
  createReadStream(): fs.ReadStream {
    throw new Error('S3StorageProvider not configured.');
  }
  resolvePath(): string {
    throw new Error('S3StorageProvider does not expose filesystem paths.');
  }
  stat(): Promise<{ size: number } | null> {
    throw new Error('S3StorageProvider not configured.');
  }
  delete(): Promise<void> {
    throw new Error('S3StorageProvider not configured.');
  }
  exists(): Promise<boolean> {
    throw new Error('S3StorageProvider not configured.');
  }
  buildDeliveryPath(bucket: StorageBucket, key: string): string {
    if (env.s3.cdnBaseUrl) return `${env.s3.cdnBaseUrl}/${bucket}/${key}`;
    return `/api/files/${bucket}/${encodeURIComponent(key)}`;
  }
}

function sanitizeKey(key: string): string {
  // Prevent path traversal - keys must never escape their bucket directory.
  const normalized = path.normalize(key).replace(/^([.]{2}[/\\])+/, '');
  if (normalized.includes('..')) {
    throw new Error('Invalid storage key');
  }
  return normalized;
}

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (provider) return provider;
  provider = env.storageDriver === 's3' ? new S3StorageProvider() : new LocalStorageProvider(env.localStorageRoot);
  return provider;
}
