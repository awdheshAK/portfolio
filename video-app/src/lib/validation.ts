/**
 * File validation that never trusts the browser-supplied filename or MIME
 * type. We sniff the actual container format from magic bytes before
 * accepting an upload, then generate a random internal filename ourselves.
 */
import { randomUUID } from 'node:crypto';

export type DetectedContainer = 'mp4' | 'mov' | 'webm' | 'avi' | 'mkv' | 'unknown';

export const ALLOWED_CONTAINERS: DetectedContainer[] = ['mp4', 'mov', 'webm', 'avi', 'mkv'];

/**
 * Sniffs the first bytes of a file to determine its real container format.
 * This intentionally ignores the client-provided filename/extension and
 * `Content-Type` header, both of which are attacker-controlled.
 */
export function detectContainer(buffer: Buffer): DetectedContainer {
  if (buffer.length < 12) return 'unknown';

  // WebM / Matroska: EBML header 0x1A45DFA3
  if (buffer.readUInt32BE(0) === 0x1a45dfa3) {
    // Distinguish webm vs mkv by scanning for the DocType string.
    const slice = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('latin1');
    if (slice.includes('webm')) return 'webm';
    if (slice.includes('matroska')) return 'mkv';
    return 'mkv';
  }

  // RIFF....AVI  (AVI container)
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 11) === 'AVI') {
    return 'avi';
  }

  // ISO base media (MP4/MOV): bytes 4-8 are "ftyp"
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12).toLowerCase();
    const quicktimeBrands = ['qt  ', 'moov'];
    if (quicktimeBrands.includes(brand)) return 'mov';
    return 'mp4';
  }

  // Some .mov files use "moov"/"free"/"wide" as the first atom instead of ftyp
  const firstAtom = buffer.toString('ascii', 4, 8);
  if (['moov', 'free', 'wide', 'skip', 'mdat'].includes(firstAtom)) {
    return 'mov';
  }

  return 'unknown';
}

export function isAllowedContainer(container: DetectedContainer): boolean {
  return ALLOWED_CONTAINERS.includes(container);
}

const CONTAINER_MIME: Record<DetectedContainer, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  unknown: 'application/octet-stream',
};

export function mimeForContainer(container: DetectedContainer): string {
  return CONTAINER_MIME[container];
}

/** Internal filename - never derived from user input. */
export function generateInternalFilename(container: DetectedContainer): string {
  return `${randomUUID()}.${container === 'unknown' ? 'bin' : container}`;
}

export function generateInternalImageFilename(ext: 'jpg' | 'png' | 'webp' = 'jpg'): string {
  return `${randomUUID()}.${ext}`;
}

const IMAGE_MAGIC: { sig: number[]; ext: 'jpg' | 'png' | 'webp' }[] = [
  { sig: [0xff, 0xd8, 0xff], ext: 'jpg' },
  { sig: [0x89, 0x50, 0x4e, 0x47], ext: 'png' },
  { sig: [0x52, 0x49, 0x46, 0x46], ext: 'webp' }, // RIFF....WEBP, refined below
];

export function detectImage(buffer: Buffer): 'jpg' | 'png' | 'webp' | 'unknown' {
  for (const { sig, ext } of IMAGE_MAGIC) {
    if (buffer.length >= sig.length && sig.every((b, i) => buffer[i] === b)) {
      if (ext === 'webp' && buffer.toString('ascii', 8, 12) !== 'WEBP') continue;
      return ext;
    }
  }
  return 'unknown';
}

/** Strips ASCII control characters without relying on a control-char regex literal. */
export function sanitizeTextField(input: string, maxLen: number): string {
  let out = '';
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x20 && code !== 0x7f) out += ch;
  }
  return out.trim().slice(0, maxLen);
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 80) || randomUUID().slice(0, 8)
  );
}
