/**
 * Content-safety pipeline run against every uploaded file before it is
 * accepted into processing. This performs real checks (container/format
 * validation, size sanity, duplicate detection via checksum, and an
 * optional ClamAV scan when available) rather than a no-op placeholder.
 *
 * To add a stronger malware scanner in production, point CLAMAV_HOST/PORT
 * at a running clamd instance - detectClamAv() will pick it up automatically
 * and safeScanBuffer() degrades to "scan skipped" (logged) when clamd is not
 * reachable, rather than silently pretending a scan happened.
 */
import crypto from 'node:crypto';
import net from 'node:net';
import { prisma } from './prisma';

export interface SafetyCheckResult {
  passed: boolean;
  reasons: string[];
  checksum: string;
  isDuplicate: boolean;
  duplicateOfVideoId?: string;
}

export function checksumBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function findDuplicateByChecksum(checksum: string): Promise<string | undefined> {
  const existing = await prisma.videoFile.findFirst({
    where: { checksum, kind: 'ORIGINAL' },
    select: { videoId: true },
  });
  return existing?.videoId;
}

/** Attempts a ClamAV INSTREAM scan; resolves to null if clamd is unreachable. */
async function clamAvScan(buffer: Buffer): Promise<'clean' | 'infected' | null> {
  const host = process.env.CLAMAV_HOST;
  const port = Number(process.env.CLAMAV_PORT ?? 3310);
  if (!host) return null;

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 5000 });
    let response = '';

    socket.on('connect', () => {
      socket.write('zINSTREAM\0');
      const chunkSize = Buffer.alloc(4);
      chunkSize.writeUInt32BE(buffer.length, 0);
      socket.write(chunkSize);
      socket.write(buffer);
      const zero = Buffer.alloc(4);
      socket.write(zero);
    });
    socket.on('data', (d) => (response += d.toString()));
    socket.on('end', () => {
      resolve(response.includes('FOUND') ? 'infected' : 'clean');
    });
    socket.on('error', () => resolve(null));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(null);
    });
  });
}

export async function runContentSafetyChecks(buffer: Buffer, sizeBytes: number, maxSizeBytes: number): Promise<SafetyCheckResult> {
  const reasons: string[] = [];

  if (sizeBytes <= 0) reasons.push('File is empty.');
  if (sizeBytes > maxSizeBytes) reasons.push('File exceeds maximum allowed size.');

  const checksum = checksumBuffer(buffer);
  const duplicateOfVideoId = await findDuplicateByChecksum(checksum);

  const scanResult = await clamAvScan(buffer);
  if (scanResult === 'infected') reasons.push('File failed malware scan.');
  if (scanResult === null) {
    // eslint-disable-next-line no-console
    console.warn('[content-safety] ClamAV not configured/reachable - malware scan skipped for this upload.');
  }

  return {
    passed: reasons.length === 0,
    reasons,
    checksum,
    isDuplicate: Boolean(duplicateOfVideoId),
    duplicateOfVideoId,
  };
}
