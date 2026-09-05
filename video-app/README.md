# StreamVault

A production-ready video sharing and download platform: upload, FFmpeg-powered
processing, adaptive-quality playback, secure downloads, search (including
natural-language queries), categories, moderation, AI-assisted metadata, and a
full admin dashboard. Runs entirely on localhost with local disk storage, and
is structured so that storage can be swapped for cloud object storage + a CDN
without touching application code.

---

## Windows Quick Start

This section is written for someone setting the project up on a **Windows PC
for the first time**, using **VS Code**. Follow it top to bottom.

### 1. Install required software

Install these first (all free):

| Software | Where to get it | Notes |
|---|---|---|
| **Node.js** (v18 or newer, LTS) | https://nodejs.org | Installs `node` and `npm`. Confirm with `node -v` in a terminal. |
| **PostgreSQL** (v14 or newer) | https://www.postgresql.org/download/windows/ | During install, set a password for the `postgres` user and **remember it**. Keep the default port `5432`. |
| **FFmpeg** | https://www.gyan.dev/ffmpeg/builds/ (get the "release full" build) | See step 6 below for how to install it on Windows. |
| **VS Code** | https://code.visualstudio.com | To open and edit the project. |
| **Git** (optional) | https://git-scm.com | Only needed if you plan to use version control; not required to just run the app. |

### 2. Unzip and open the project

1. Unzip `video-app.zip` anywhere, e.g. `C:\Projects\video-app`.
2. Open VS Code → **File → Open Folder...** → select the unzipped `video-app` folder.
3. Open a terminal inside VS Code: **Terminal → New Terminal**. This opens PowerShell (or Command Prompt) already in the project folder.

### 3. Install dependencies

In the VS Code terminal:

```powershell
npm install
```

This installs all packages listed in `package.json` and automatically runs `prisma generate`. It can take a few minutes the first time.

### 4. Configure your `.env` file

The project ships with `.env.example` (a template with **no real secrets**). Create your own working copy:

```powershell
copy .env.example .env
```

Open the new `.env` file in VS Code and edit these values:

- `DATABASE_URL` — replace `USERNAME:PASSWORD` with your PostgreSQL username (usually `postgres`) and the password you set during install, for example:
  ```
  DATABASE_URL="postgresql://postgres:YourPostgresPassword@localhost:5432/videoapp?schema=public"
  ```
- `NEXTAUTH_SECRET`, `SIGNED_URL_SECRET`, `AUTH_TOKEN_SECRET` — replace each `replace-with-a-long-random-string` with a unique random value. On Windows, generate one per line with PowerShell:
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Run that command three times and paste one output into each of the three secret fields.

Everything else in `.env` already has a working local default — you don't need to change it to get started.

### 5. Configure PostgreSQL (create the database)

You just need an empty database named `videoapp` for the app to use. Easiest way, using the terminal:

```powershell
"C:\Program Files\PostgreSQL\<version>\bin\createdb.exe" -U postgres videoapp
```

(Replace `<version>` with your installed PostgreSQL version number, e.g. `16`.) It will ask for the postgres password you set during installation.

Alternatively, open **pgAdmin** (installed alongside PostgreSQL) → right-click **Databases** → **Create → Database...** → name it `videoapp`.

### 6. Run Prisma migrations

This creates all the required tables in your new database:

```powershell
npx prisma migrate dev --name init
```

If it succeeds you'll see `Your database is now in sync with your schema.`

Then seed the database with starter categories, tags, and an admin login:

```powershell
npm run prisma:seed
```

The terminal will print the admin and demo account emails/passwords it just created — see step 9 below.

### 7. Install / check FFmpeg

FFmpeg is required for video processing (thumbnails, transcoding).

1. Download a build from https://www.gyan.dev/ffmpeg/builds/ — under "release builds", get `ffmpeg-release-full.7z` (or `.zip`).
2. Extract it, e.g. to `C:\ffmpeg`, so that `C:\ffmpeg\bin\ffmpeg.exe` exists.
3. Add `C:\ffmpeg\bin` to your Windows PATH:
   - Press **Win**, search "Environment Variables", open **Edit the system environment variables**.
   - Click **Environment Variables...** → under "System variables" select **Path** → **Edit** → **New** → paste `C:\ffmpeg\bin` → OK on all dialogs.
4. **Close and reopen** your VS Code terminal (PATH changes only apply to new terminals).
5. Verify it works:
   ```powershell
   ffmpeg -version
   ffprobe -version
   ```
   Both should print version info. If you see "not recognized", double-check the PATH step and that you opened a **new** terminal.

`.env` already points at plain `ffmpeg`/`ffprobe` (`FFMPEG_PATH`/`FFPROBE_PATH`), which works as long as they're on your PATH as set up above.

### 8. Start the application

You need **two terminals running at the same time** (in VS Code: click the `+` icon in the terminal panel to open a second one):

**Terminal 1 — the web app:**
```powershell
npm run dev
```

**Terminal 2 — the video processing worker** (handles thumbnails/transcoding in the background — uploads will get stuck on "Processing" forever without this running):
```powershell
npm run worker
```

Once Terminal 1 shows `✓ Ready`, open your browser to:

**http://localhost:3000**

### 9. Log in as admin

The seed step (step 6) created two accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@streamvault.local` | `Admin1234!` |
| Creator | `creator@streamvault.local` | `Creator1234!` |

(These come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / etc. in your `.env` — change them there and re-run `npm run prisma:seed` if you want different credentials.)

Go to http://localhost:3000/login, sign in as the admin, then visit **http://localhost:3000/admin** for the admin dashboard. From the account menu (top right) you can also go to **Upload** to add your first real video and watch it move through Uploading → Processing → Ready → Published.

> No demo videos are pre-loaded — a fake video row with no real file behind it would just be a broken link. Upload a real video file to see the full pipeline (validation → FFmpeg processing → thumbnails → AI metadata) run for real.

### Stopping / restarting later

- Stop either terminal with **Ctrl+C**.
- To start again later, you only need steps 8 and 9 (no need to reinstall or re-migrate) — just make sure PostgreSQL is running (it normally starts automatically as a Windows service).

---

## Stack

- **Frontend:** Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** Next.js API routes (Node runtime)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth (credentials/email+password), bcrypt password hashing, JWT sessions
- **Video processing:** FFmpeg/FFprobe (shelled out, no native bindings)
- **Storage:** Local filesystem today, behind a provider interface (`src/lib/storage.ts`) that can be swapped for S3-compatible storage via one env var
- **AI:** Anthropic Claude when `ANTHROPIC_API_KEY` is set, otherwise a fully-functional local heuristic engine (`src/lib/ai.ts`) - no external calls required to use every AI feature

## Local storage directories

The app writes uploaded/processed media under `./storage/`:

```
storage/
├── videos/        original uploaded files
├── thumbnails/    generated + custom thumbnails
├── previews/      short hover-preview clips
├── transcoded/    1080p/720p/480p/360p renditions
└── tmp/           in-progress chunked uploads
```

**You do not need to create these manually.** `src/lib/storage.ts` and
`src/lib/uploadSession.ts` create every one of these folders automatically
(recursively, on first use) the first time the app needs them. The zip ships
with an empty `storage/` folder containing only a `.gitkeep` placeholder.

## What's implemented

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

## Architecture notes

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

### Why the app is fully "dynamic" (no static pages)

The root layout (`src/app/layout.tsx`) sets `export const dynamic =
'force-dynamic'`. Every page reads live session/database state (the header
shows live categories, the home page shows live videos, etc.), so nothing
benefits from static prerendering - and this is also what lets `npm run
build` succeed even before a database connection is available.

## Database schema

See `prisma/schema.prisma`. Models: `User`, `Session`, `PasswordResetToken`,
`Video`, `VideoFile`, `VideoProcessingJob`, `Category`, `Tag`, `VideoTag`,
`View`, `Download`, `Favorite`, `WatchHistory`, `SearchHistory`, `Comment`,
`Report`, `ModerationAction`, `Notification`, `AuditLog` - all indexed on
their common query paths (status, visibility, owner, category, timestamps).

## Useful scripts

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

## Known local-dev tradeoffs (documented, not hidden)

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

## Troubleshooting

- **`npm run build` or `npm run dev` complains it can't reach the database** — make sure PostgreSQL is running and `DATABASE_URL` in `.env` has the correct username/password/port, then re-run `npx prisma migrate dev`.
- **Uploads stay stuck on "Processing" forever** — the worker (`npm run worker`) isn't running, or FFmpeg isn't on your PATH. Check Terminal 2's output and re-verify `ffmpeg -version` works in a **new** terminal.
- **"ffmpeg is not recognized as an internal or external command"** — the PATH change didn't take effect. Close *all* terminal windows and VS Code, reopen, and try again.
- **Login fails after seeding** — double check you're using the exact email/password printed by `npm run prisma:seed` (or the `SEED_*` values in your `.env` if you changed them).
