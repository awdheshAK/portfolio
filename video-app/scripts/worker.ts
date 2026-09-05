/**
 * Video processing worker.
 *
 * Polls the VideoProcessingJob table for queued jobs and runs the FFmpeg
 * pipeline (probe -> thumbnail -> preview -> transcode renditions -> AI
 * metadata) outside of any HTTP request. Run alongside `npm run dev` with:
 *
 *   npm run worker
 *
 * This keeps heavy video processing off the request/response cycle, as
 * required for large uploads. Swapping this DB-polling loop for a real queue
 * consumer (BullMQ, SQS, etc.) later does not require changing the
 * enqueue side (`src/lib/queue.ts`).
 */
import path from 'node:path';
import fsp from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import { probeVideo, extractThumbnail, extractPreview, transcodeRendition, RENDITIONS } from '../src/lib/ffmpeg';
import { getStorageProvider } from '../src/lib/storage';
import { generateVideoMetadata } from '../src/lib/ai';
import { env } from '../src/lib/env';

const prisma = new PrismaClient();
const storage = getStorageProvider();

async function claimNextJob() {
  // Simple optimistic claim: find a queued job, then attempt to flip it to
  // PROBING; if another worker beat us to it the updateMany count will be 0.
  const job = await prisma.videoProcessingJob.findFirst({
    where: { status: 'QUEUED' },
    orderBy: { createdAt: 'asc' },
    include: { video: { include: { owner: true, category: true } } },
  });
  if (!job) return null;

  const claimed = await prisma.videoProcessingJob.updateMany({
    where: { id: job.id, status: 'QUEUED' },
    data: { status: 'PROBING', startedAt: new Date(), attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return null;

  return job;
}

async function updateProgress(jobId: string, progress: number, step: string) {
  await prisma.videoProcessingJob.update({ where: { id: jobId }, data: { progress, step } });
}

async function processJob(job: Awaited<ReturnType<typeof claimNextJob>>) {
  if (!job) return;
  const { video } = job;
  const tmpDir = path.resolve(env.localStorageRoot, 'tmp', `job-${job.id}`);
  await fsp.mkdir(tmpDir, { recursive: true });

  try {
    const originalFile = await prisma.videoFile.findFirst({ where: { videoId: video.id, kind: 'ORIGINAL' } });
    if (!originalFile) throw new Error('Original file record missing.');

    const originalPath = storage.resolvePath('videos', originalFile.storageKey);

    // --- Probe ---
    await updateProgress(job.id, 5, 'Probing video metadata');
    const probe = await probeVideo(originalPath);

    await prisma.video.update({
      where: { id: video.id },
      data: { durationSec: probe.durationSec, width: probe.width, height: probe.height },
    });

    // --- Thumbnail ---
    await prisma.videoProcessingJob.update({ where: { id: job.id }, data: { status: 'GENERATING_THUMBNAIL' } });
    await updateProgress(job.id, 20, 'Generating thumbnail');

    const thumbPath = path.join(tmpDir, 'thumb.jpg');
    const thumbAt = Math.min(Math.max(probe.durationSec * 0.1, 1), Math.max(probe.durationSec - 1, 1));
    await extractThumbnail(originalPath, thumbPath, thumbAt);
    const thumbKey = await storage.putFromLocalFile('thumbnails', `${video.id}-thumb.jpg`, thumbPath);

    const previewPath = path.join(tmpDir, 'preview.webm');
    await extractPreview(originalPath, previewPath, thumbAt, Math.min(4, Math.max(1, probe.durationSec - thumbAt)));
    const previewKey = await storage.putFromLocalFile('previews', `${video.id}-preview.webm`, previewPath);

    await prisma.video.update({ where: { id: video.id }, data: { thumbnailKey: thumbKey, previewKey } });

    // --- Transcode renditions applicable to the source resolution ---
    await prisma.videoProcessingJob.update({ where: { id: job.id }, data: { status: 'TRANSCODING' } });

    const applicable = RENDITIONS.filter((r) => !probe.height || r.height <= probe.height + 40);
    const renditionsToRun = applicable.length ? applicable : [RENDITIONS[RENDITIONS.length - 1]];

    for (let i = 0; i < renditionsToRun.length; i++) {
      const spec = renditionsToRun[i];
      const outPath = path.join(tmpDir, `${spec.label}.mp4`);
      await transcodeRendition(originalPath, outPath, spec, (fraction) => {
        const overall = 40 + ((i + fraction) / renditionsToRun.length) * 50;
        updateProgress(job.id, Math.round(overall), `Transcoding ${spec.label}`).catch(() => {});
      }, probe.durationSec);

      const stat = await fsp.stat(outPath);
      const renditionKey = await storage.putFromLocalFile('transcoded', `${video.id}-${spec.label}.mp4`, outPath);

      await prisma.videoFile.create({
        data: {
          videoId: video.id,
          kind: 'RENDITION',
          label: spec.label,
          storageKey: renditionKey,
          mimeType: 'video/mp4',
          sizeBytes: BigInt(stat.size),
          bitrateKbps: spec.videoBitrateKbps,
        },
      });
    }

    // --- AI metadata (best-effort; never fails the job) ---
    await updateProgress(job.id, 95, 'Generating AI metadata');
    try {
      const metadata = await generateVideoMetadata(originalFile.storageKey, probe, video.category?.name);
      await prisma.video.update({
        where: { id: video.id },
        data: {
          language: metadata.language,
          chapters: metadata.chapters as any,
          aiGenerated: true,
          aiMetadata: metadata as any,
          description: video.description || metadata.description,
        },
      });
    } catch (err) {
      console.error(`[worker] AI metadata generation failed for video ${video.id}:`, err);
    }

    await prisma.video.update({ where: { id: video.id }, data: { status: 'READY' } });
    await prisma.videoProcessingJob.update({
      where: { id: job.id },
      data: { status: 'COMPLETED', progress: 100, step: 'Completed', finishedAt: new Date() },
    });

    await prisma.notification.create({
      data: {
        userId: video.ownerId,
        type: 'VIDEO_READY',
        title: 'Your video has finished processing',
        body: `"${video.title}" is ready. You can now publish it.`,
      },
    });

    console.log(`[worker] Completed job ${job.id} for video ${video.id}`);
  } catch (err: any) {
    console.error(`[worker] Job ${job.id} failed:`, err);
    await prisma.videoProcessingJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', errorMessage: String(err.message ?? err).slice(0, 1000), finishedAt: new Date() },
    });
    await prisma.video.update({ where: { id: video.id }, data: { status: 'FAILED' } });
    await prisma.notification.create({
      data: {
        userId: video.ownerId,
        type: 'VIDEO_FAILED',
        title: 'Video processing failed',
        body: `"${video.title}" could not be processed. Please try re-uploading.`,
      },
    });
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  }
}

async function loop() {
  console.log('[worker] StreamVault processing worker started. Polling for jobs...');
  const concurrency = env.processingConcurrency;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const jobs = await Promise.all(Array.from({ length: concurrency }, () => claimNextJob()));
    const activeJobs = jobs.filter(Boolean);

    if (activeJobs.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, env.processingWorkerPollMs));
      continue;
    }

    await Promise.all(activeJobs.map((job) => processJob(job)));
  }
}

loop().catch((err) => {
  console.error('[worker] Fatal error:', err);
  process.exit(1);
});
