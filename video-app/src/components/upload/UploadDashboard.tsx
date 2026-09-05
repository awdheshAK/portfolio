'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { UploadCloud, Film, Pause, Play, X, CheckCircle2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { formatBytes } from '@/lib/utils';

type Stage = 'select' | 'details' | 'uploading' | 'processing' | 'done' | 'error';

const ACCEPTED_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];

export default function UploadDashboard({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('select');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('PRIVATE');
  const [publishNow, setPublishNow] = useState(true);

  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState('Queued');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoSlug, setVideoSlug] = useState<string | null>(null);

  const pausedRef = useRef(false);
  const cancelledRef = useRef(false);
  const nextIndexRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadIdRef = useRef<string | null>(null);
  const chunkSizeRef = useRef<number>(8 * 1024 * 1024);

  function handleFile(f: File) {
    const ext = `.${f.name.split('.').pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error('Unsupported file type. Please choose an MP4, MOV, WebM, AVI, or MKV file.');
      return;
    }
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, ''));
    setStage('details');
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  function onThumbnailSelect(f: File) {
    setThumbnailFile(f);
    setThumbnailPreview(URL.createObjectURL(f));
  }

  async function uploadChunks(uploadId: string, chunkSize: number, startIndex: number, fileRef: File) {
    const totalChunks = Math.ceil(fileRef.size / chunkSize);
    for (let i = startIndex; i < totalChunks; i++) {
      if (cancelledRef.current) return;
      if (pausedRef.current) {
        nextIndexRef.current = i;
        return;
      }
      const start = i * chunkSize;
      const end = Math.min(fileRef.size, start + chunkSize);
      const blob = fileRef.slice(start, end);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch(`/api/upload/chunk?uploadId=${uploadId}&index=${i}`, {
          method: 'POST',
          headers: { 'x-chunk-size': String(chunkSize) },
          body: blob,
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Upload failed.');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          nextIndexRef.current = i;
          return;
        }
        setStage('error');
        setErrorMsg(err.message ?? 'Upload failed.');
        return;
      }
      setProgress(Math.round((end / fileRef.size) * 100));
    }

    if (cancelledRef.current) return;
    await completeUpload(uploadId);
  }

  async function completeUpload(uploadId: string) {
    try {
      const res = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not finalize upload.');

      setVideoId(data.videoId);
      setVideoSlug(data.slug);

      if (thumbnailFile) {
        const form = new FormData();
        form.append('videoId', data.videoId);
        form.append('file', thumbnailFile);
        await fetch('/api/upload/thumbnail', { method: 'POST', body: form }).catch(() => {});
      }

      if (publishNow) {
        // Will be flipped to PUBLISHED once processing completes (see poller below).
      }

      setStage('processing');
    } catch (err: any) {
      setStage('error');
      setErrorMsg(err.message ?? 'Could not finalize upload.');
    }
  }

  async function startUpload() {
    if (!file) return;
    setErrorMsg(null);
    cancelledRef.current = false;
    pausedRef.current = false;
    setPaused(false);
    setStage('uploading');
    setProgress(0);

    try {
      const initRes = await fetch('/api/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileSize: file.size,
          originalName: file.name,
          title,
          description,
          tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
          categoryId: categoryId || undefined,
          visibility,
        }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error ?? 'Could not start upload.');

      uploadIdRef.current = initData.uploadId;
      chunkSizeRef.current = initData.chunkSize;
      nextIndexRef.current = 0;

      await uploadChunks(initData.uploadId, initData.chunkSize, 0, file);
    } catch (err: any) {
      setStage('error');
      setErrorMsg(err.message ?? 'Could not start upload.');
    }
  }

  function pauseUpload() {
    pausedRef.current = true;
    setPaused(true);
    abortControllerRef.current?.abort();
  }

  function resumeUpload() {
    if (!uploadIdRef.current || !file) return;
    pausedRef.current = false;
    setPaused(false);
    uploadChunks(uploadIdRef.current, chunkSizeRef.current, nextIndexRef.current, file);
  }

  async function cancelUpload() {
    cancelledRef.current = true;
    abortControllerRef.current?.abort();
    if (uploadIdRef.current) {
      await fetch(`/api/upload/${uploadIdRef.current}`, { method: 'DELETE' }).catch(() => {});
    }
    uploadIdRef.current = null;
    setStage('select');
    setFile(null);
    setProgress(0);
  }

  // Poll processing status once we're in the "processing" stage.
  useEffect(() => {
    if (stage !== 'processing' || !videoId) return;
    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/processing/${videoId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (cancelled) return;

      if (data.job) {
        setProcessingStep(data.job.step ?? data.job.status);
        setProcessingProgress(data.job.progress ?? 0);
      }

      if (data.videoStatus === 'READY') {
        if (publishNow) {
          await fetch(`/api/videos/${videoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'PUBLISHED' }),
          }).catch(() => {});
        }
        setStage('done');
        return;
      }
      if (data.videoStatus === 'FAILED') {
        setStage('error');
        setErrorMsg(data.job?.errorMessage ?? 'Video processing failed.');
        return;
      }
      setTimeout(poll, 2000);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [stage, videoId, publishNow]);

  return (
    <div>
      {stage === 'select' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center transition-colors ${
            dragActive ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20' : 'border-surface-200 dark:border-surface-800'
          }`}
        >
          <UploadCloud size={40} className="text-brand-500 mb-4" />
          <p className="font-semibold mb-1">Drag and drop your video here</p>
          <p className="text-sm text-surface-500 mb-4">MP4, MOV, WebM, AVI, MKV — up to 5GB</p>
          <label className="cursor-pointer">
            <span className="rounded-lg bg-brand-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-700 transition-colors">
              Select file
            </span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>
      )}

      {stage === 'details' && file && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 dark:border-surface-800 p-4">
            <Film size={22} className="text-brand-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-xs text-surface-500">{formatBytes(file.size)}</p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setStage('select');
              }}
              className="text-surface-400 hover:text-surface-600"
            >
              <X size={18} />
            </button>
          </div>

          <FormField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required />

          <label className="block mb-4">
            <span className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </label>

          <FormField
            label="Tags (comma separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="travel, drone, 4k"
          />

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200">Category</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200">Visibility</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="PRIVATE">Private</option>
                <option value="UNLISTED">Unlisted</option>
                <option value="PUBLIC">Public</option>
              </select>
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200">Custom thumbnail (optional)</span>
            <div className="flex items-center gap-3">
              {thumbnailPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnailPreview} alt="Thumbnail preview" className="h-16 w-28 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-28 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-400">
                  <ImageIcon size={20} />
                </div>
              )}
              <label className="cursor-pointer text-sm font-medium text-brand-600">
                Choose image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onThumbnailSelect(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
            Publish automatically once processing finishes
          </label>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStage('select')}>
              Back
            </Button>
            <Button onClick={startUpload} disabled={!title.trim()}>
              Start upload
            </Button>
          </div>
        </div>
      )}

      {stage === 'uploading' && file && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 p-8">
          <p className="font-semibold mb-1">Uploading "{title}"</p>
          <p className="text-sm text-surface-500 mb-6">{formatBytes(file.size)} — please keep this tab open</p>
          <ProgressBar value={progress} />
          <div className="mt-2 text-sm text-surface-500">{progress}%</div>
          <div className="mt-6 flex gap-3">
            {!paused ? (
              <Button variant="secondary" onClick={pauseUpload}>
                <Pause size={15} /> Pause
              </Button>
            ) : (
              <Button variant="secondary" onClick={resumeUpload}>
                <Play size={15} /> Resume
              </Button>
            )}
            <Button variant="danger" onClick={cancelUpload}>
              <X size={15} /> Cancel
            </Button>
          </div>
        </div>
      )}

      {stage === 'processing' && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 p-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="font-semibold mb-1">Processing your video</p>
          <p className="text-sm text-surface-500 mb-6">{processingStep}</p>
          <ProgressBar value={processingProgress} />
          <p className="mt-4 text-xs text-surface-400">
            This runs in the background via FFmpeg — extracting thumbnails, generating streaming renditions, and AI metadata.
          </p>
        </div>
      )}

      {stage === 'done' && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 p-8 text-center">
          <CheckCircle2 size={40} className="mx-auto text-green-500 mb-4" />
          <p className="font-semibold mb-1">Your video is ready!</p>
          <p className="text-sm text-surface-500 mb-6">
            {publishNow ? 'It has been published and is now live.' : 'It has been saved. Publish it from your dashboard when ready.'}
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => router.push(`/watch/${videoSlug}`)}>Watch video</Button>
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>
              Go to dashboard
            </Button>
          </div>
        </div>
      )}

      {stage === 'error' && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-8 text-center">
          <AlertTriangle size={40} className="mx-auto text-red-500 mb-4" />
          <p className="font-semibold mb-1">Something went wrong</p>
          <p className="text-sm text-red-600 dark:text-red-400 mb-6">{errorMsg ?? 'Upload failed.'}</p>
          <Button onClick={() => setStage('select')}>Try again</Button>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
      <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{ width: `${value}%` }} />
    </div>
  );
}
