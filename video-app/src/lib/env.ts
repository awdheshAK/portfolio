function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  nextAuthUrl: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? 'dev-insecure-secret-change-me',

  signedUrlSecret: process.env.SIGNED_URL_SECRET ?? 'dev-insecure-secret-change-me',
  authTokenSecret: process.env.AUTH_TOKEN_SECRET ?? 'dev-insecure-secret-change-me',
  signedUrlTtlSeconds: Number(process.env.SIGNED_URL_TTL_SECONDS ?? 900),

  storageDriver: (process.env.STORAGE_DRIVER as 'local' | 's3') ?? 'local',
  localStorageRoot: process.env.LOCAL_STORAGE_ROOT ?? './storage',
  publicAssetBaseUrl: process.env.PUBLIC_ASSET_BASE_URL ?? 'http://localhost:3000',

  s3: {
    endpoint: process.env.S3_ENDPOINT ?? '',
    region: process.env.S3_REGION ?? 'us-east-1',
    bucket: process.env.S3_BUCKET ?? '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    cdnBaseUrl: process.env.CDN_BASE_URL ?? '',
  },

  ffmpegPath: process.env.FFMPEG_PATH ?? 'ffmpeg',
  ffprobePath: process.env.FFPROBE_PATH ?? 'ffprobe',
  maxUploadSizeBytes: Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 5 * 1024 * 1024 * 1024),
  uploadChunkSizeBytes: Number(process.env.UPLOAD_CHUNK_SIZE_BYTES ?? 8 * 1024 * 1024),
  processingWorkerPollMs: Number(process.env.PROCESSING_WORKER_POLL_MS ?? 3000),
  processingConcurrency: Number(process.env.PROCESSING_CONCURRENCY ?? 2),

  aiProvider: (process.env.AI_PROVIDER as 'local' | 'anthropic') ?? 'local',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',

  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from: process.env.SMTP_FROM ?? 'StreamVault <noreply@streamvault.local>',
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120),
    downloadMax: Number(process.env.DOWNLOAD_RATE_LIMIT_MAX ?? 20),
  },
};

export { required };
