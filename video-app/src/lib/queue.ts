/**
 * Queue-based processing abstraction.
 *
 * `enqueueProcessingJob` just writes a row to VideoProcessingJob with status
 * QUEUED. The actual work happens out-of-band in `scripts/worker.ts`, which
 * polls for queued jobs and runs them with FFmpeg - video processing never
 * runs inside a request/response cycle.
 *
 * This DB-polling queue is intentionally dependency-light for local dev. The
 * enqueue/consume shape matches a real queue (e.g. BullMQ + Redis): swapping
 * the implementation later does not require changing any caller of
 * `enqueueProcessingJob`.
 */
import { prisma } from './prisma';

export async function enqueueProcessingJob(videoId: string, requestedById?: string) {
  return prisma.videoProcessingJob.create({
    data: {
      videoId,
      requestedById,
      status: 'QUEUED',
    },
  });
}
