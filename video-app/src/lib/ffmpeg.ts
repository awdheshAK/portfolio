/**
 * Thin wrapper around the ffmpeg/ffprobe CLI binaries. We shell out rather
 * than depend on a native binding so the only system requirement is having
 * ffmpeg installed (as documented in the README).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { env } from './env';

const execFileAsync = promisify(execFile);

export interface ProbeResult {
  durationSec: number;
  width: number | null;
  height: number | null;
  videoCodec: string | null;
  audioCodec: string | null;
  bitrateKbps: number | null;
  format: string | null;
}

export async function probeVideo(filePath: string): Promise<ProbeResult> {
  const { stdout } = await execFileAsync(env.ffprobePath, [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    filePath,
  ]);

  const data = JSON.parse(stdout);
  const videoStream = (data.streams || []).find((s: any) => s.codec_type === 'video');
  const audioStream = (data.streams || []).find((s: any) => s.codec_type === 'audio');

  return {
    durationSec: Number(data.format?.duration ?? videoStream?.duration ?? 0),
    width: videoStream?.width ?? null,
    height: videoStream?.height ?? null,
    videoCodec: videoStream?.codec_name ?? null,
    audioCodec: audioStream?.codec_name ?? null,
    bitrateKbps: data.format?.bit_rate ? Math.round(Number(data.format.bit_rate) / 1000) : null,
    format: data.format?.format_name ?? null,
  };
}

export async function extractThumbnail(input: string, output: string, atSec: number): Promise<void> {
  await execFileAsync(env.ffmpegPath, [
    '-y',
    '-ss',
    String(Math.max(0, atSec)),
    '-i',
    input,
    '-frames:v',
    '1',
    '-vf',
    'scale=640:-2',
    '-q:v',
    '3',
    output,
  ]);
}

export async function extractPreview(input: string, output: string, startSec: number, durationSec = 4): Promise<void> {
  // Short muted looping preview clip (webm) used for hover-preview on cards.
  await execFileAsync(env.ffmpegPath, [
    '-y',
    '-ss',
    String(Math.max(0, startSec)),
    '-i',
    input,
    '-t',
    String(durationSec),
    '-an',
    '-vf',
    'scale=480:-2',
    '-c:v',
    'libvpx-vp9',
    '-b:v',
    '400k',
    output,
  ]);
}

export interface RenditionSpec {
  label: '1080p' | '720p' | '480p' | '360p';
  height: number;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
}

export const RENDITIONS: RenditionSpec[] = [
  { label: '1080p', height: 1080, videoBitrateKbps: 4500, audioBitrateKbps: 160 },
  { label: '720p', height: 720, videoBitrateKbps: 2500, audioBitrateKbps: 128 },
  { label: '480p', height: 480, videoBitrateKbps: 1200, audioBitrateKbps: 128 },
  { label: '360p', height: 360, videoBitrateKbps: 700, audioBitrateKbps: 96 },
];

export async function transcodeRendition(
  input: string,
  output: string,
  spec: RenditionSpec,
  onProgress?: (fractionDone: number) => void,
  totalDurationSec?: number,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const args = [
      '-y',
      '-i',
      input,
      '-vf',
      `scale=-2:${spec.height}`,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-b:v',
      `${spec.videoBitrateKbps}k`,
      '-maxrate',
      `${Math.round(spec.videoBitrateKbps * 1.2)}k`,
      '-bufsize',
      `${spec.videoBitrateKbps * 2}k`,
      '-c:a',
      'aac',
      '-b:a',
      `${spec.audioBitrateKbps}k`,
      '-movflags',
      '+faststart',
      '-progress',
      'pipe:1',
      '-nostats',
      output,
    ];

    const child = require('node:child_process').spawn(env.ffmpegPath, args);
    let stderr = '';

    child.stdout?.on('data', (chunk: Buffer) => {
      if (!onProgress || !totalDurationSec) return;
      const text = chunk.toString();
      const match = text.match(/out_time_ms=(\d+)/);
      if (match) {
        const outTimeSec = Number(match[1]) / 1_000_000;
        onProgress(Math.min(1, outTimeSec / totalDurationSec));
      }
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code: number) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

/** Generate a plausible chapter list from duration when no AI transcript is available. */
export function heuristicChapters(durationSec: number): { title: string; startSec: number }[] {
  if (durationSec < 60) return [{ title: 'Full video', startSec: 0 }];
  const chapterCount = Math.min(6, Math.max(2, Math.floor(durationSec / 180)));
  const chapters = [];
  for (let i = 0; i < chapterCount; i++) {
    chapters.push({
      title: `Chapter ${i + 1}`,
      startSec: Math.floor((durationSec / chapterCount) * i),
    });
  }
  return chapters;
}
