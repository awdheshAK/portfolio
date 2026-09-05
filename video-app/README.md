# StreamVault

A production-ready video sharing and download platform: upload, FFmpeg-powered
processing, adaptive-quality playback, secure downloads, search (including
natural-language queries), categories, moderation, AI-assisted metadata, and a
full admin dashboard. Runs entirely on localhost with local disk storage, and
is structured so that storage can be swapped for cloud object storage + a CDN
without touching application code.

## Stack

- **Frontend:** Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** Next.js API routes (Node runtime)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth (credentials/email+password), bcrypt password hashing, JWT sessions
- **Video processing:** FFmpeg/FFprobe (shelled out, no native bindings)
- **Storage:** Local filesystem today, behind a provider interface (`src/lib/storage.ts`) that can be swapped for S3-compatible storage via one env var
- **AI:** Anthropic Claude when `ANTHROPIC_API_KEY` is set, otherwise a fully-functional local heuristic engine (`src/lib/ai.ts`) - no external calls required to use every AI feature

## 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or reachable via `DATABASE_URL`)
- FFmpeg + FFprobe installed and on your `PATH`
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt-get install ffmpeg`
  - Windows: install a build from ffmpeg.org and add it to PATH

## 2. Setup

```bash
cd video-app
npm install
cp .env.example .env
```

Edit `.env`:
- Set `DATABASE_URL` to your Postgres connection string.
- Generate secrets: `openssl rand -base64 32` (repeat for each secret field).
- Everything else has a sane local default.

Create the database, run migrations, and seed baseline data (categories, tags, an admin account):

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

The seed script prints the admin/creator login credentials it created
(defaults: `admin@streamvault.local` / `Admin1234!` and
`creator@streamvault.local` / `Creator1234!` - override with
`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`/etc. env vars before seeding).

No demo videos are seeded - a fake video row with no real media file behind
it would just be a broken link. Log in and upload a real file instead; the
full pipeline (validation, FFmpeg processing, thumbnailing, AI metadata) runs
for real.

## 3. Run it

You need **two processes** running side by side:

```bash
# Terminal 1 - the web app
npm run dev

# Terminal 2 - the video processing worker (FFmpeg jobs run here, never in a request)
npm run worker
```

Open http://localhost:3000.

Why two processes? Uploads are never transcoded inside an HTTP request -
`POST /api/upload/complete` just writes a `VideoProcessingJob` row, and
`scripts/worker.ts` polls for queued jobs and runs FFmpeg against them in the
background. This keeps large uploads from blocking the web server and mirrors
how you'd run a real job queue (see "Swapping in a real queue" below).

## 4. What's implemented

- **Home page**: featured/trending/popular/latest sections, category chips, infinite scroll, dark/light mode.
- **Upload dashboard** (`/upload`): drag-and-drop, resumable chunked upload with pause/resume/cancel, custom thumbnail upload, tags/category/visibility, publish-on-ready toggle.
- **Upload validation**: the container format is sniffed from magic bytes (never trusts the filename or `Content-Type` header); every stored file gets a random internal filename (`src/lib/validation.ts`).
- **Processing pipeline** (`scripts/worker.ts`): ffprobe → thumbnail → hover-preview clip → renditions (1080p/720p/480p/360p, capped to source resolution) → AI metadata, with live progress written to `VideoProcessingJob`.
- **Watch page**: custom HTML5 player (play/pause, volume, speed, fullscreen, Picture-in-Picture, quality switcher), related/recommended rails, download modal, report modal, favorites.
- **Downloads**: signed, time-limited URLs (`src/lib/signedUrl.ts`) served through `/api/files/...` - no internal path or storage key is ever exposed to the client. Rate-limited per user/IP.
- **Search**: full-text-ish search across title/description/tags/category, filters, sorting, suggestions, recent searches (localStorage) - plus a natural-language layer (`src/lib/ai.ts#parseSearchIntent`) that understands things like "popular videos about drones longer than 20 minutes uploaded this week".
- **Categories**: admin CRUD + reorder + category pages with pagination.
- **Accounts**: register/login/logout, forgot/reset password (emails logged to console in dev - see `src/lib/email.ts`), profile + avatar, watch history, favorites, download history.
- **Admin dashboard** (`/admin`, admin-only): stats, video management (search/filter/bulk publish/unpublish/delete), user management (roles, suspend/ban/reinstate), categories, tags, reports log, moderation queue with appeal handling, AI tools (regenerate metadata, test NL query parsing), storage usage breakdown, settings (env-derived, read-only), audit log viewer.
- **Moderation**: report button on every video, moderation queue, remove/unpublish/reinstate actions, account suspension/ban, and an appeal flow (`POST /api/videos/:id/appeal`) that surfaces back into the admin queue.
- **Security**: bcrypt password hashing, JWT sessions via NextAuth, per-route auth/role checks (`src/lib/apiAuth.ts`), middleware-enforced admin routes, rate limiting (`src/lib/rateLimit.ts`), magic-byte file validation, signed download/streaming URLs, security headers (`next.config.js`), audit logging (`src/lib/audit.ts`), hashed IPs (never stored raw).
- **AI features**: metadata generation (title/description/tags/language/chapters) after processing, natural-language search parsing, and a recommendation engine (`src/lib/recommendations.ts`) built only from a user's *own* watch history/favorites/search history - never cross-user data.

## 5. Architecture notes

### Storage is provider-agnostic

Every file read/write goes through `getStorageProvider()` in `src/lib/storage.ts`.
The local implementation writes to `./storage/{videos,thumbnails,previews,transcoded,tmp}`.
To move to S3/R2/etc.:

1. Implement `S3StorageProvider` (stubbed in `storage.ts`) using `@aws-sdk/client-s3`.
2. Set `STORAGE_DRIVER=s3` and the `S3_*` env vars.
3. Nothing else changes - routes, the worker, and the player all call the same interface.

### Swapping in a real queue

`src/lib/queue.ts#enqueueProcessingJob` just inserts a `VideoProcessingJob` row.
`scripts/worker.ts` polls that table. To move to BullMQ/SQS/etc., replace the
body of `enqueueProcessingJob` with a real enqueue call and replace the worker
loop with a consumer - no API route needs to change.

### Signed URLs today, CDN-signed URLs tomorrow

`src/lib/signedUrl.ts` issues short-lived HMAC-signed tokens consumed by
`/api/files/[bucket]/[key]`. This is intentionally the same shape as a
pre-signed S3 URL or a CloudFront signed URL, so `buildDeliveryPath()` in the
storage provider is the only place that needs to change when you add a CDN.

## 6. Database schema

See `prisma/schema.prisma`. Models: `User`, `Session`, `PasswordResetToken`,
`Video`, `VideoFile`, `VideoProcessingJob`, `Category`, `Tag`, `VideoTag`,
`View`, `Download`, `Favorite`, `WatchHistory`, `SearchHistory`, `Comment`,
`Report`, `ModerationAction`, `Notification`, `AuditLog` - all indexed on
their common query paths (status, visibility, owner, category, timestamps).

## 7. Useful scripts

```bash
npm run dev             # start the web app
npm run worker          # start the FFmpeg processing worker
npm run build            # production build
npm run start             # run the production build
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm run prisma:studio    # browse the database
npm run prisma:migrate   # create/apply a migration
npm run prisma:seed      # re-run the seed script
```

## 8. Known local-dev tradeoffs (documented, not hidden)

- **Malware scanning** (`src/lib/contentSafety.ts`) will use a ClamAV daemon
  if `CLAMAV_HOST`/`CLAMAV_PORT` are set; otherwise it logs a warning and
  skips the AV scan (magic-byte/format validation and duplicate detection
  still run unconditionally).
- **Bandwidth usage** on the admin dashboard is an estimate (average original
  file size × download count) since local mode doesn't meter bytes served -
  swap in real byte counters from your CDN/proxy access logs in production.
- **Settings page** is read-only (env-driven) rather than backed by a mutable
  settings table - add a `Setting` model if you need runtime-editable config.
- Comments have a full data model (`Comment`) but no dedicated UI thread yet -
  it's there for you to build a comments panel on the watch page.
