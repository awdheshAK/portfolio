'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  Settings,
} from 'lucide-react';
import { cx, formatDuration } from '@/lib/utils';

export interface Rendition {
  id: string;
  label: string;
  kind: string;
  streamUrl: string;
  mimeType: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function VideoPlayer({
  renditions,
  posterUrl,
  onProgress,
}: {
  renditions: Rendition[];
  posterUrl?: string | null;
  onProgress?: (currentSec: number, durationSec: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sorted = [...renditions].sort((a, b) => qualityRank(b.label) - qualityRank(a.label));
  const [activeRendition, setActiveRendition] = useState(sorted[0]);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [buffered, setBuffered] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const resumeAt = currentTime;
    v.currentTime = resumeAt;
    if (playing) v.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRendition]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
    onProgress?.(v.currentTime, v.duration || 0);
  }

  function seek(sec: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = sec;
    setCurrentTime(sec);
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function changeVolume(val: number) {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  }

  function changeSpeed(val: number) {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = val;
    setSpeed(val);
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }

  async function togglePip() {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture();
      }
    } catch {
      // PiP unsupported in this browser - fail silently.
    }
  }

  function resetControlsTimer() {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  }

  function switchQuality(r: Rendition) {
    setShowSettings(false);
    setActiveRendition(r);
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black group"
    >
      <video
        ref={videoRef}
        src={activeRendition?.streamUrl}
        poster={posterUrl ?? undefined}
        className="h-full w-full"
        onClick={togglePlay}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => {}}
        playsInline
      />

      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black">
            <Play size={28} className="ml-1" />
          </span>
        </button>
      )}

      <div
        className={cx(
          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3 pt-8 transition-opacity',
          showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        {/* Progress bar */}
        <div
          className="group/bar relative mb-2 h-1.5 w-full cursor-pointer rounded-full bg-white/25"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const fraction = (e.clientX - rect.left) / rect.width;
            seek(fraction * duration);
          }}
        >
          <div className="absolute h-full rounded-full bg-white/40" style={{ width: `${(buffered / (duration || 1)) * 100}%` }} />
          <div className="absolute h-full rounded-full bg-brand-500" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
        </div>

        <div className="flex items-center gap-3 text-white">
          <button onClick={togglePlay} aria-label="Play/pause">
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <div className="flex items-center gap-1.5 group/vol">
            <button onClick={toggleMute} aria-label="Mute">
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="w-0 group-hover/vol:w-20 transition-all accent-brand-500"
            />
          </div>

          <span className="text-xs tabular-nums">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowSettings((s) => !s)} aria-label="Settings">
                <Settings size={18} />
              </button>
              {showSettings && (
                <div className="absolute bottom-8 right-0 w-40 rounded-lg bg-surface-900 border border-surface-700 p-2 text-sm text-white shadow-xl">
                  <p className="px-2 py-1 text-xs uppercase text-surface-400">Quality</p>
                  {sorted.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => switchQuality(r)}
                      className={cx(
                        'flex w-full items-center justify-between rounded px-2 py-1.5 hover:bg-surface-800',
                        activeRendition?.id === r.id && 'text-brand-400',
                      )}
                    >
                      {r.kind === 'ORIGINAL' ? 'Original' : r.label}
                    </button>
                  ))}
                  <p className="px-2 py-1 mt-1 text-xs uppercase text-surface-400">Speed</p>
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className={cx('flex w-full items-center justify-between rounded px-2 py-1.5 hover:bg-surface-800', speed === s && 'text-brand-400')}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={togglePip} aria-label="Picture in picture">
              <PictureInPicture2 size={18} />
            </button>
            <button onClick={toggleFullscreen} aria-label="Fullscreen">
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function qualityRank(label: string): number {
  const n = Number(label.replace(/[^\d]/g, ''));
  return Number.isNaN(n) ? 9999 : n;
}
