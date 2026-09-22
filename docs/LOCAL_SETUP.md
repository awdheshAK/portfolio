# Local Setup Guide (Windows)

This guide walks a Windows user, step by step, through running the Custom
Clothing Platform locally: the Laravel API (`backend/`) and the Next.js
storefront + admin dashboard (`frontend/`). Every command below is meant to
be copy-pasted into **PowerShell** (right-click Start → "Windows PowerShell"
or "Terminal") unless a step says otherwise.

If a command fails, don't skip it — the rest of the guide assumes it
succeeded. See the Troubleshooting section at the end for the most common
Windows-specific failures.

---

## A. Required software

Install these in order. Each link is the official installer for Windows.

| Software | Version | Why you need it |
|---|---|---|
| [Git](https://git-scm.com/download/win) | latest | to extract/clone and manage the project |
| [Node.js](https://nodejs.org/) | 20 LTS or newer | runs the Next.js frontend |
| [PHP](https://windows.php.net/download/) | 8.3 or newer | runs the Laravel backend |
| [Composer](https://getcomposer.org/download/) | latest | installs Laravel's PHP dependencies |
| [PostgreSQL](https://www.postgresql.org/download/windows/) | 14 or newer | the database |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | latest | **required** for Redis on Windows (see note below), optional for everything else |

**Redis note:** the backend's default configuration (`CACHE_STORE=redis`,
`QUEUE_CONNECTION=redis`) uses Redis for its login/rate-limiting cache and
background jobs (e.g. sending the password-reset email). Redis does not run
natively on Windows. You have two options — pick one before continuing:

- **Option 1 (recommended): run Redis via Docker Desktop.** Install Docker
  Desktop, make sure it's running, then start a Redis container with:
  ```powershell
  docker run -d --name ccp-redis -p 6379:6379 redis:7-alpine
  ```
  This is a one-time setup; the container keeps running in the background.
  Confirm it's answering with `docker exec ccp-redis redis-cli ping` (should
  print `PONG`).
- **Option 2 (simplest, no Docker): skip Redis entirely for local dev.** In
  step E below, set `CACHE_STORE=file`, `QUEUE_CONNECTION=sync`, and
  `SESSION_DRIVER=database` instead of `redis`. Everything works the same
  way, except background jobs (currently just the password-reset email) run
  immediately in the same request instead of through a queue worker, so you
  can also skip step I. This is the easiest path if you just want to click
  through the site and test the customizer/cart/checkout/admin.

### Checking your installs

After installing everything, open a **new** PowerShell window (so PATH
changes take effect) and run:

```powershell
git --version
node --version
npm --version
php --version
composer --version
psql --version
```

Each command should print a version number, not "not recognized as an
internal or external command". If PHP or Composer aren't recognized, re-run
their installers and make sure "Add to PATH" was checked, or add their
install folder to your PATH manually (System Properties → Environment
Variables → Path).

**PHP extensions:** the backend needs the `pdo_pgsql`, `mbstring`, `curl`,
`fileinfo`, `openssl`, and `zip` PHP extensions enabled. The Windows PHP
installer enables most of these by default; if a command later fails with
`could not find driver` or a missing-extension error, open
`php.ini` (find its path with `php --ini`) and uncomment (remove the leading
`;` from) the matching `extension=...` line, then restart your terminal.

---

## B. How to extract the project

1. Download `custom-clothing-platform.zip`.
2. Right-click it → **Extract All...** → choose a simple path with no
   spaces, e.g. `C:\dev\custom-clothing-platform`.
3. Open PowerShell and navigate there:
   ```powershell
   cd C:\dev\custom-clothing-platform
   ```
4. You should see `frontend\`, `backend\`, `docs\`, `docker\`,
   `docker-compose.yml`, `README.md`, `start-local.bat`, `stop-local.bat`.

---

## C. Backend setup

```powershell
cd C:\dev\custom-clothing-platform\backend
composer install
copy .env.example .env
php artisan key:generate
```

`composer install` downloads all PHP packages into a new `vendor\` folder —
this can take a few minutes the first time. `php artisan key:generate` fills
in `APP_KEY` inside `.env` (used to encrypt sessions/cookies) — never share
this value or commit it.

---

## D. PostgreSQL database creation

1. During the PostgreSQL installer, you set a password for the `postgres`
   superuser — remember it, you'll need it now.
2. Open **SQL Shell (psql)** from the Start menu (installed alongside
   PostgreSQL). Press Enter to accept each default prompt (Server,
   Database, Port, Username) until it asks for the password — enter the
   `postgres` password you set.
3. At the `postgres=#` prompt, run:
   ```sql
   CREATE DATABASE custom_clothing_platform;
   CREATE USER ccp_user WITH PASSWORD 'ccp_password';
   GRANT ALL PRIVILEGES ON DATABASE custom_clothing_platform TO ccp_user;
   \c custom_clothing_platform
   GRANT ALL ON SCHEMA public TO ccp_user;
   \q
   ```
   You can use a different database name/username/password — just make sure
   they match what you put in `.env` in the next step. The values above
   match the ones already in `backend/.env.example`, so if you use them
   exactly, step E needs no changes for the database section.

---

## E. Laravel `.env` configuration

Open `backend\.env` in any text editor (Notepad, VS Code) and check/fill in
these variables. Every one of them is explained here — don't leave a
required one blank.

| Variable | Required? | What to put |
|---|---|---|
| `APP_URL` | yes | `http://localhost:8000` (leave as-is) |
| `APP_DEBUG` | yes | `true` for local dev (shows real error messages instead of a generic "Server error") |
| `DB_CONNECTION` | yes | `pgsql` (leave as-is) |
| `DB_HOST` | yes | `127.0.0.1` |
| `DB_PORT` | yes | `5432` (PostgreSQL's default port) |
| `DB_DATABASE` | yes | `custom_clothing_platform` (or whatever you created in step D) |
| `DB_USERNAME` | yes | `ccp_user` (or whatever you created) |
| `DB_PASSWORD` | yes | `ccp_password` (or whatever you created) |
| `CACHE_STORE` | yes | `redis` if you set up Docker Redis (option 1 above), otherwise `file` |
| `QUEUE_CONNECTION` | yes | `redis` if using Redis, otherwise `sync` |
| `SESSION_DRIVER` | yes | `database` (works either way, leave as-is) |
| `FRONTEND_URL` | yes | `http://localhost:3000` — used to build the link inside password-reset emails |
| `CORS_ALLOWED_ORIGINS` | yes | `http://localhost:3000` — must match the URL the frontend actually runs on |
| `SANCTUM_STATEFUL_DOMAINS` | yes | leave the default value; it already includes `localhost:3000` and `127.0.0.1:3000` |
| `MAIL_MAILER` | yes | `log` to just write emails to `backend\storage\logs\laravel.log` instead of sending them (fine for local testing — see section N) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | only for checkout | your Razorpay **test mode** keys — see section L |
| `RAZORPAY_WEBHOOK_SECRET` | only if testing webhooks | see section L |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | only for logo/design uploads in the customizer | your Cloudinary credentials — see section K |

Every other variable can stay at its `.env.example` default for local
development.

---

## F. Run migrations and seeders

This creates every table and fills the database with a realistic demo
catalog (categories, 10 products, fabrics, colors, sizes, customizer
options, an admin account, a customer account, and 2 coupons).

```powershell
cd C:\dev\custom-clothing-platform\backend
php artisan migrate --seed
```

You should see a list of `... DONE` lines for each migration, followed by
`Seeding database.` and a `DONE` line per seeder. If this fails with a
connection error, double check step D and the `DB_*` values in `.env`.

---

## G. Start the Laravel backend

```powershell
cd C:\dev\custom-clothing-platform\backend
php artisan serve
```

Leave this window open — it's now serving the API at
`http://localhost:8000`. Test it by opening
`http://localhost:8000/api/v1/categories` in a browser; you should see a
JSON response starting with `{"success":true,...}`.

---

## H. Start the Next.js frontend

Open a **new** PowerShell window (keep the backend one running):

```powershell
cd C:\dev\custom-clothing-platform\frontend
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000` in your browser — you should see the storefront
homepage with real seeded products. `npm install` only needs to run once (or
again if `package.json` changes).

---

## I. Start the queue worker (only if you chose Redis in step A)

If `QUEUE_CONNECTION=redis` in your `.env`, open a **third** PowerShell
window:

```powershell
cd C:\dev\custom-clothing-platform\backend
php artisan queue:work
```

This processes background jobs — right now, that's just sending the
password-reset email. If you set `QUEUE_CONNECTION=sync` instead, skip this
step entirely; those jobs run immediately without a separate worker.

---

## J. Start Redis (only if you chose Option 1 in step A)

If you haven't already started it in step A:

```powershell
docker start ccp-redis
```

(Use `docker run -d --name ccp-redis -p 6379:6379 redis:7-alpine` instead,
the very first time.) If you chose Option 2 (`CACHE_STORE=file`), skip this
step — you don't need Redis at all.

---

## K. Configure Cloudinary (for logo/design uploads in the customizer)

The customizer's logo upload and design-upload steps send files to
`POST /api/v1/uploads/design-asset`, which the backend uploads to Cloudinary
server-side — the frontend never sees your Cloudinary credentials.

1. Create a free account at [cloudinary.com](https://cloudinary.com/).
2. On your Cloudinary dashboard, copy **Cloud name**, **API Key**, and
   **API Secret**.
3. In `backend\.env`, set:
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```
4. Restart `php artisan serve` (Ctrl+C in that window, then run it again) so
   the new `.env` values are picked up.
5. In `frontend\.env.local`, set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` to the
   same cloud name (this is only used for display, not for uploading).

Without this, every other feature still works — only logo/design file
uploads in the customizer will return an error, by design (uploads fail
closed rather than silently pretending to succeed).

---

## L. Configure Razorpay (TEST mode)

Checkout creates a real Razorpay order and only marks it paid after the
backend verifies Razorpay's signature — so you need Razorpay **test** keys
to click through a full checkout locally.

1. Create a free account at [razorpay.com](https://razorpay.com/) (or sign
   in to an existing one).
2. Make sure the dashboard toggle is set to **Test Mode** (top of the
   dashboard) — never put live keys in a local `.env`.
3. Go to **Settings → API Keys → Generate Test Key**. Copy the **Key ID**
   and **Key Secret**.
4. In `backend\.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your-test-key-secret
   ```
5. In `frontend\.env.local`:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_xxxxxxxxxxxx
   ```
   (same Key ID as above — this half is safe to expose in the browser, the
   secret is not and only ever goes in the backend's `.env`.)
6. Restart both `php artisan serve` and `npm run dev` after changing env
   files.
7. When you reach the Razorpay payment popup during checkout, use Razorpay's
   published test payment details (from their
   [test card documentation](https://razorpay.com/docs/payments/payments/test-card-upi-details/)) —
   for example, test card number `4111 1111 1111 1111`, any future
   expiry date, any CVV, and any name — no real money moves.
8. (Optional, for testing webhooks) In the Razorpay dashboard under
   **Settings → Webhooks**, add a webhook pointing at your backend's
   `/api/v1/payments/razorpay/webhook` endpoint. Since your local backend
   isn't reachable from the internet, you'd need a tunnel tool (e.g.
   `ngrok http 8000`) for this — it's optional for local testing since the
   checkout flow already verifies payment directly without the webhook.
   Set `RAZORPAY_WEBHOOK_SECRET` in `.env` to the webhook's signing secret
   if you set this up.

---

## M. Admin login

Once migrations + seeders have run (step F), log in to the admin dashboard
at `http://localhost:3000/admin` with:

- **Email:** `admin@example.com`
- **Password:** `ChangeMe123!`

**Change this password (or create a new admin and disable this one) before
ever deploying this project somewhere public.** These credentials exist
purely so the seeded demo store is usable out of the box.

---

## N. Customer testing

A seeded demo customer account is also available:

- **Email:** `customer@example.com`
- **Password:** `ChangeMe123!`

Or register a brand new account at `http://localhost:3000/register` — since
`MAIL_MAILER=log` by default, no real email is sent; registration and
login work immediately without email verification. If you test the
"forgot password" flow, the reset email is written to
`backend\storage\logs\laravel.log` instead of your inbox — open that file
and copy the reset link it contains into your browser. To actually receive
real emails, set `MAIL_MAILER=smtp` and fill in `MAIL_HOST`/`MAIL_PORT`/
`MAIL_USERNAME`/`MAIL_PASSWORD` with real SMTP credentials (e.g. from
Mailtrap for testing, or your real provider).

---

## O. Complete e-commerce testing

Once everything above is running, walk through
**[docs/TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** — it's the full
manual QA pass covering the storefront, the customizer, cart/checkout/
payment, the customer account area, and every admin dashboard screen.

---

## Troubleshooting (Windows-specific)

- **`php` / `composer` not recognized:** re-run their installers and check
  "Add to PATH", or add the install folder to your PATH manually, then open
  a brand new PowerShell window.
- **`could not find driver` when running migrations:** the `pdo_pgsql` PHP
  extension isn't enabled. Find your `php.ini` with `php --ini`, open it,
  find the line `;extension=pdo_pgsql`, remove the leading `;`, save, and
  restart your terminal.
- **`SQLSTATE[08006] could not connect to server` / connection refused:**
  PostgreSQL isn't running. Open **Services** (Win+R → `services.msc`),
  find `postgresql-x64-<version>`, and make sure it's "Running". Also
  double-check `DB_HOST`/`DB_PORT`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD`
  in `backend\.env` match what you created in step D.
- **Login/register fails with a 500 error mentioning "Connection refused"
  and a Redis-related file path:** `CACHE_STORE` or `QUEUE_CONNECTION` is
  set to `redis` but Redis isn't running. Either start it
  (`docker start ccp-redis`) or switch both to `file`/`sync` per step A,
  Option 2, and restart `php artisan serve`.
- **Frontend shows "Unable to reach the server" everywhere:** the backend
  (`php artisan serve`) isn't running, or `NEXT_PUBLIC_API_URL` in
  `frontend\.env.local` doesn't match its actual URL/port.
- **Checkout button does nothing / Razorpay popup never opens:**
  `NEXT_PUBLIC_RAZORPAY_KEY` is missing from `frontend\.env.local`, or you
  didn't restart `npm run dev` after adding it.
- **Logo upload in the customizer fails immediately:** Cloudinary isn't
  configured (step K) — check `backend\storage\logs\laravel.log` for the
  specific error.
- **Port already in use (`8000` or `3000`):** something else is using that
  port. Either stop it, or run `php artisan serve --port=8001` /
  `npm run dev -- -p 3001` and update `NEXT_PUBLIC_API_URL` /
  `CORS_ALLOWED_ORIGINS` / `SANCTUM_STATEFUL_DOMAINS` to match.
