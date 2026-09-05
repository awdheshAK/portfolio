/**
 * HMAC-signed, time-limited URLs for streaming and downloading video assets.
 * Internal storage keys and filesystem paths are never exposed to the
 * client - only opaque signed tokens are. This is the same shape a
 * pre-signed S3 URL would take, so moving to cloud storage later is a
 * drop-in replacement inside getStorageProvider().buildDeliveryPath().
 */
import crypto from 'node:crypto';
import { env } from './env';
import type { StorageBucket } from './storage';

export interface SignedPayload {
  bucket: StorageBucket;
  key: string;
  userId?: string;
  exp: number;
  /** Optional: constrains the token to a single purpose, e.g. "download". */
  purpose?: string;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', env.signedUrlSecret).update(payload).digest('base64url');
}

export function createSignedToken(
  bucket: StorageBucket,
  key: string,
  opts: { userId?: string; ttlSeconds?: number; purpose?: string } = {},
): string {
  const exp = Math.floor(Date.now() / 1000) + (opts.ttlSeconds ?? env.signedUrlTtlSeconds);
  const payload: SignedPayload = { bucket, key, userId: opts.userId, exp, purpose: opts.purpose };
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString('base64url');
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySignedToken(token: string): SignedPayload | null {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload: SignedPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildSignedAssetUrl(
  bucket: StorageBucket,
  key: string,
  opts: { userId?: string; ttlSeconds?: number; purpose?: string } = {},
): string {
  const token = createSignedToken(bucket, key, opts);
  return `/api/files/${bucket}/${encodeURIComponent(key)}?token=${token}`;
}
