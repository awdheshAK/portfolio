# Custom Clothing Platform

> **This project lives in the same repository as an unrelated static
> corporate site** (the files at the repo root — `index.html`, `about/`,
> `products/`, `manufacturing/`, etc.). That site is untouched by this
> project. Everything for the clothing platform is under `backend/`,
> `frontend/`, `docker/`, and `docs/`.

**Windows users starting from a downloaded ZIP:** skip straight to
[docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md) for an exact, copy-pasteable,
step-by-step guide. This README is the reference; that guide is the
walkthrough.

---

## PROJECT

A custom-clothing e-commerce platform with a real garment customizer:
browse a catalog, configure a garment (fabric, color, size, logo, custom
text, print, embroidery, patches), see a live layered canvas preview, get a
backend-calculated price, check out with Razorpay, and manage the whole
store from a role-aware admin dashboard.

This was built to be **real, working code you can run end to end**, not a
mockup — every button calls a real, tested API endpoint. It implements a
focused, load-bearing slice of a much larger spec rather than faking full
coverage of all of it. What's implemented and working:

- Product catalog: categories/subcategories, products, variants, fabrics, collections, search/filter/sort
- Full garment customizer: garment → fabric → color → size → measurements
  (saved profiles) → logo upload → custom text → print/graphics placement →
  embroidery → patches/extras → live layered canvas preview →
  backend-authoritative price calculator → save design → add to cart
- Cart (guest + logged-in), coupons, addresses, wishlist, reviews
- Checkout with real Razorpay order creation, signature verification, and
  an idempotent webhook handler (needs your own Razorpay test/live keys)
- Auth: register/login/logout, forgot/reset password (real queued email),
  Sanctum token auth
- Cloudinary-backed uploads for logos/design assets, validated server-side
- Contact form and newsletter signup (rate-limited, real submissions stored)
- **A complete admin dashboard** (not just an API): dashboard stats,
  products, categories, collections, fabrics/colors/sizes/print positions/
  embroidery positions/patches, orders (filter + status update), customers
  (search + disable/restore), coupons — with role-aware navigation backed
  by real server-side role enforcement (5 admin roles, each scoped to what
  it should manage — see `docs/API_CONTRACT.md`'s Roles table)
- Automated backend test suite (61 tests) covering pricing, auth, cart,
  coupons, checkout, and admin RBAC

**Explicitly deferred / not built** (said plainly, not silently faked):
Stripe is stubbed behind a shared gateway interface (Razorpay is the only
live payment gateway); invoice/PDF generation, review-image uploads, and a
FAQ/CMS admin are not implemented. Treat this as a strong, functioning
foundation for those, not a promise that they exist.

See [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for the exact API surface
both sides implement against.

---

## TECH STACK

**Backend:** Laravel 11 (PHP 8.3+), PostgreSQL, Redis (cache/queue),
Laravel Sanctum (API auth), Razorpay PHP SDK, Cloudinary PHP SDK, Pest/
PHPUnit.

**Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS 4, React 19,
plain HTML Canvas for the live customizer preview (no chart/canvas
libraries added — kept dependency-light).

**Infra:** Docker + Docker Compose (Postgres, Redis, backend behind nginx,
a queue worker, a scheduler loop, the frontend), or a manual VPS install —
see [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md).

---

## FOLDER STRUCTURE

```
custom-clothing-platform/
├── backend/              Laravel 11 REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/       public + Admin/ controllers
│   │   ├── Http/Middleware/               admin + role gating
│   │   ├── Http/Requests/                 form validation
│   │   ├── Http/Resources/                API response shapes
│   │   ├── Models/
│   │   ├── Policies/
│   │   └── Services/                      PricingService, RazorpayService,
│   │                                      CloudinaryStorageService, etc.
│   ├── database/{migrations,seeders,factories}/
│   ├── routes/api.php
│   ├── tests/{Feature,Unit}/
│   └── .env.example
├── frontend/             Next.js storefront + admin dashboard
│   ├── app/                               pages (App Router)
│   │   └── admin/                         admin dashboard pages
│   ├── components/
│   │   └── admin/                         admin-only UI components
│   ├── services/                          API client functions
│   │   └── admin/                         admin API client functions
│   ├── lib/, hooks/, types/, config/, utils/
│   └── .env.example
├── docker/               Dockerfiles + nginx config
├── docs/
│   ├── API_CONTRACT.md                    the contract both sides implement
│   ├── LOCAL_SETUP.md                     Windows step-by-step guide
│   ├── TESTING_CHECKLIST.md               manual QA checklist
│   └── PRODUCTION_DEPLOYMENT.md           VPS deployment guide
├── docker-compose.yml
├── .env.example          host-level vars for docker-compose
├── start-local.bat / stop-local.bat       Windows dev launcher/stopper
└── README.md             this file
```

---

## LOCAL INSTALLATION

Full Windows walkthrough: **[docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)**.
Quick reference for macOS/Linux/experienced users:

```bash
# Backend
cd backend
cp .env.example .env
composer install
php artisan key:generate
# edit .env: DB_*, and Razorpay/Cloudinary keys if you want those features live
php artisan migrate --seed
php artisan serve                # http://localhost:8000

# Frontend (separate terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                      # http://localhost:3000
```

On Windows, `start-local.bat` (double-click, or run from PowerShell) does
first-time setup (composer/npm install, `.env` copying, `APP_KEY`
generation) and opens the backend, frontend, and queue-worker windows for
you. `stop-local.bat` shuts them back down.

**Docker instead:**
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
docker compose up --build
docker compose exec backend php artisan migrate --seed
```

---

## ENVIRONMENT VARIABLES

Every variable is documented inline in `backend/.env.example` and
`frontend/.env.example`, and explained in detail (what it's for, what
happens if you skip it) in **[docs/LOCAL_SETUP.md, section E](docs/LOCAL_SETUP.md#e-laravel-env-configuration)**.
In short:

| File | Required | Only needed for |
|---|---|---|
| `backend/.env` | `APP_KEY`, `DB_*`, `CACHE_STORE`/`QUEUE_CONNECTION` (`redis` or `file`/`sync`), `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `SANCTUM_STATEFUL_DOMAINS` | — |
| `backend/.env` | `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`/`RAZORPAY_WEBHOOK_SECRET` | checkout/payments |
| `backend/.env` | `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` | logo/design uploads |
| `backend/.env` | `MAIL_*` | real (non-log) password-reset/contact emails |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` | always |
| `frontend/.env.local` | `NEXT_PUBLIC_RAZORPAY_KEY` | checkout |
| `frontend/.env.local` | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | display only, not used for uploading |

**Never commit a real `.env` file** — only the `.env.example` templates are
tracked in git, and `.gitignore` already excludes every real `.env`.

---

## DATABASE

PostgreSQL. Create the database and a dedicated user (exact `psql` commands
in [docs/LOCAL_SETUP.md, section D](docs/LOCAL_SETUP.md#d-postgresql-database-creation)),
point `backend/.env`'s `DB_*` variables at it, then:

```bash
php artisan migrate --seed
```

This creates every table (users, products, categories, fabrics, colors,
sizes, customizer options, carts, orders, payments, addresses, coupons,
reviews, designs, measurements, activity logs, and more — 27 migrations in
total) and seeds a realistic demo store: the full category tree, 10
products with variants, fabrics/colors/sizes/customizer options, 2
collections, 2 coupons, and the admin/customer accounts below.

In production, run `php artisan migrate --force` **without** `--seed` —
don't put demo products on a real store.

---

## RUNNING FRONTEND

```bash
cd frontend
npm install
npm run dev       # http://localhost:3000, hot-reloading dev server
# or, for a production build:
npm run build
npm run start
```

## RUNNING BACKEND

```bash
cd backend
composer install
php artisan serve   # http://localhost:8000
```

If `backend/.env` has `QUEUE_CONNECTION=redis` (the default), also run a
queue worker in a separate terminal so background jobs (currently: the
password-reset email) actually process:
```bash
php artisan queue:work
```
(Skip this if you set `QUEUE_CONNECTION=sync` instead — see
`docs/LOCAL_SETUP.md` section A for the Windows Redis-vs-no-Redis tradeoff.)

---

## ADMIN LOGIN

Seeded by `php artisan migrate --seed`, at `http://localhost:3000/admin`:

- **Email:** `admin@example.com`
- **Password:** `ChangeMe123!`

**Change this password before deploying anywhere public.** A seeded
customer account also exists: `customer@example.com` / `ChangeMe123!`.

The admin dashboard's navigation is role-aware — `super_admin`/`admin` see
everything; `content_manager` manages catalog/customizer config;
`order_manager` manages orders/coupons/customers; `production_manager`
views/updates orders. This is enforced on the backend (not just hidden in
the UI) — see the Roles table in `docs/API_CONTRACT.md`.

---

## TESTING

```bash
# Backend
cd backend
php artisan test        # 61 tests: auth, pricing, cart, coupons, checkout, admin RBAC
./vendor/bin/pint --test   # code style check

# Frontend
cd frontend
npm run build            # type-checks and builds
npm run lint
```

For manual, click-through QA of every feature (storefront, customizer,
checkout, admin), use **[docs/TESTING_CHECKLIST.md](docs/TESTING_CHECKLIST.md)**.

---

## PAYMENTS

Razorpay (test and live mode). The frontend only ever holds the
*publishable* Key ID (`NEXT_PUBLIC_RAZORPAY_KEY`); the secret
(`RAZORPAY_KEY_SECRET`) lives only in `backend/.env` and is never sent to
the browser. Flow: checkout creates a real Razorpay order via the backend
→ the frontend opens Razorpay's Checkout.js widget → on completion the
backend verifies the HMAC signature (`POST /api/v1/payments/razorpay/verify`)
→ **only then** is the order marked paid. A webhook
(`POST /api/v1/payments/razorpay/webhook`) handles async status updates
idempotently. See `docs/LOCAL_SETUP.md` section L for exact test-mode setup
steps and test card numbers.

Stripe is architected for (a shared `PaymentGatewayService` interface) but
not wired up in this build.

---

## STORAGE

Cloudinary, via a `StorageService` interface (`CloudinaryStorageService` is
the only implementation) so a different provider could be swapped in later
without touching calling code. Used for customizer logo/design uploads,
validated (mime type, file size) before upload. The frontend never talks to
Cloudinary directly and never sees `CLOUDINARY_API_SECRET` — every upload
goes through `POST /api/v1/uploads/design-asset` on the backend. See
`docs/LOCAL_SETUP.md` section K for setup.

---

## PRODUCTION DEPLOYMENT

Full guide, both a Docker Compose path and a manual Nginx/PHP-FPM/Postgres/
Redis/PM2 path, plus SSL, queue worker (systemd), cron scheduler, and
backups: **[docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)**.

The short version: don't deploy anything you haven't run through
`docs/TESTING_CHECKLIST.md` locally first. Then: set `APP_ENV=production`
and `APP_DEBUG=false`, generate a fresh `APP_KEY`, use strong DB/Redis
passwords, use live (not test) Razorpay keys only once you're confident,
point every URL-shaped env var at your real domains, terminate TLS with
Let's Encrypt, and run the queue worker under a supervisor (systemd/Docker)
— not as a one-off terminal command.

---

## TROUBLESHOOTING

- **`SQLSTATE[08006] could not connect to server`**: PostgreSQL isn't
  running, or `DB_HOST`/`DB_PORT`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD`
  in `backend/.env` don't match what you created.
- **Login/register fails with a 500 error mentioning Redis /
  "Connection refused"**: `CACHE_STORE` or `QUEUE_CONNECTION` is set to
  `redis` but Redis isn't running. Start Redis, or switch both to
  `file`/`sync` in `backend/.env` for local dev without Redis.
- **Frontend shows "Unable to reach the server" everywhere**: the backend
  isn't running, or `NEXT_PUBLIC_API_URL` doesn't match its actual URL.
- **Razorpay checkout opens but verify fails**: `RAZORPAY_KEY_SECRET` in
  `backend/.env` doesn't match the same account/mode as
  `NEXT_PUBLIC_RAZORPAY_KEY` (test vs. live key mismatch is the usual cause).
- **Uploaded logo doesn't show in the customizer preview**: check
  `CLOUDINARY_*` in `backend/.env` — uploads fail closed with a real error
  rather than silently pretending to succeed; check
  `backend/storage/logs/laravel.log` for the specific cause.
- **A role sees an admin nav link that then 403s, or is missing one it
  should have**: the frontend's `lib/admin-roles.ts` mirrors
  `backend/routes/api.php`'s `role:` middleware — if you change one, change
  the other (see the Roles table in `docs/API_CONTRACT.md`).

More Windows-specific issues (PATH problems, missing PHP extensions, port
conflicts): see the Troubleshooting section at the end of
[docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md).

---

## Security notes

- All prices are recalculated server-side; the frontend price shown in the
  customizer is always the last value returned by
  `POST /api/v1/customizer/price`, never a client-side computation.
- Payment success is only ever recognized after the backend verifies the
  Razorpay signature (or via the idempotent webhook) — never from a
  frontend callback alone.
- Admin routes are protected by authentication **and** a role check
  enforced on the backend (`admin` + `role:` middleware) — hiding an admin
  nav link in the UI is a UX convenience only, never treated as access
  control anywhere in this codebase.
