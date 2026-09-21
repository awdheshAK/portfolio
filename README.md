# Custom Clothing Platform

A custom-clothing e-commerce platform with a real garment customizer: browse
a catalog, configure a garment (fabric, color, size, logo, text, print,
embroidery, patches), see a live layered preview, get a backend-calculated
price, and check out with Razorpay.

> **This project lives in the same repository as an unrelated static
> corporate site** (the files at the repo root — `index.html`, `about/`,
> `products/`, `manufacturing/`, etc.). That site is untouched by this
> project. Everything for the clothing platform is under `backend/`,
> `frontend/`, `docker/`, and `docs/`.

## Scope: what this actually is

This was built to be **real, working code you can run end to end**, not a
mockup. It intentionally implements a focused, load-bearing slice of a much
larger spec (an 80-section "build the whole industry" brief) rather than
faking full coverage of all of it. Concretely, **implemented and working**:

- Product catalog (categories/subcategories, products, variants, fabrics, collections)
- Full garment customizer: garment → fabric → color → size → logo upload →
  custom text → print/graphics placement → embroidery → patches/extras →
  measurements → live layered canvas preview → backend-authoritative price
  calculator → save design → add to cart
- Cart (guest + logged-in), coupons, addresses
- Checkout with real Razorpay order creation + signature verification +
  idempotent webhook handling (requires your own Razorpay keys to go live)
- Auth (register/login/logout) via Laravel Sanctum, role field for
  admin/customer, policy-enforced admin routes
- Admin API: dashboard summary, product/category/customizer-option CRUD,
  order list + status updates
- Cloudinary-backed uploads for logos/design assets, validated server-side
- Automated backend tests for the pricing engine, auth, cart, and coupons

**Explicitly deferred / not built** (said plainly, not silently skipped):
Stripe is stubbed as an interface only (Razorpay is the only live gateway);
there is no built admin *frontend UI* dashboard with charts (the admin API
exists; a React admin UI was not built in this pass); invoice/PDF
generation, review-image uploads, wishlist-to-cart shortcuts, and the full
FAQ/CMS admin are not implemented. Treat this as a strong, functioning
foundation for those, not a promise that they exist.

See `docs/API_CONTRACT.md` for the exact API surface both sides implement
against.

## Architecture

```
custom-clothing-platform (this repo, under backend/ + frontend/)
├── backend/    Laravel 11 REST API (PHP 8.3, PostgreSQL, Sanctum, Redis)
├── frontend/   Next.js (App Router, TypeScript, Tailwind CSS)
├── docker/     Dockerfiles + nginx config for containerized deployment
├── docs/       API contract shared by both sides
└── docker-compose.yml
```

## Local development (without Docker)

Requirements: PHP 8.3+, Composer, Node.js 20+, PostgreSQL 14+, Redis (optional
in dev — falls back to file/sync drivers).

```bash
# 1. Backend
cd backend
cp .env.example .env
composer install
php artisan key:generate
# edit .env: set DB_* to your local Postgres, and any Razorpay/Cloudinary keys you have
php artisan migrate --seed
php artisan serve   # http://localhost:8000

# 2. Frontend (separate terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```

Default seeded accounts (see `backend/README.md` for the exact credentials):
one `admin` role user and one `customer` role user.
**Change both passwords immediately in any real deployment** — they exist
only to make the seeded demo store usable out of the box.

## Local development (Docker)

```bash
cp .env.example .env                       # host-level vars for compose
cp backend/.env.example backend/.env       # fill in DB_*, RAZORPAY_*, CLOUDINARY_*, MAIL_*
cp frontend/.env.example frontend/.env.local
docker compose up --build
docker compose exec backend php artisan migrate --seed
```

Frontend: http://localhost:3000 · API: http://localhost:8000

## Payment setup (Razorpay)

1. Create a Razorpay account, switch to **Test Mode**.
2. Copy the test Key ID / Key Secret into `backend/.env`
   (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) and the Key ID into
   `frontend/.env.local` (`NEXT_PUBLIC_RAZORPAY_KEY`) — the secret must
   never be given to the frontend.
3. Configure a webhook in the Razorpay dashboard pointing at
   `POST /api/v1/payments/razorpay/webhook`, and set `RAZORPAY_WEBHOOK_SECRET`
   in `backend/.env` to match.
4. Use Razorpay's published test card/UPI numbers to exercise a full
   checkout without moving real money.

Stripe is architected for (a `PaymentGatewayService` interface) but not
wired up — only Razorpay is live in this build.

## Cloudinary setup (logo/design uploads)

Create a free Cloudinary account, then set `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env`. The
frontend never talks to Cloudinary directly or sees the API secret — all
uploads go through `POST /api/v1/uploads/design-asset` on the backend,
which validates and forwards them.

## Email setup

Set the `MAIL_*` variables in `backend/.env`. Any SMTP provider works
(Mailtrap for local testing, SES/Postmark/etc. in production).

## Production deployment (VPS)

1. **Database**: managed or self-hosted PostgreSQL 14+; run migrations with
   `php artisan migrate --force` (never `--seed` in production beyond the
   optional coupon/FAQ reference data — do not seed demo products onto a
   real store).
2. **Backend**: build `docker/backend.Dockerfile`, run behind nginx (see
   `docker/nginx/backend.conf`) or PHP-FPM directly; terminate TLS at nginx
   with a Let's Encrypt certificate (`certbot --nginx`).
3. **Queue**: run `php artisan queue:work` under a process supervisor
   (systemd unit or the `queue_worker` service in `docker-compose.yml`) —
   emails and any async jobs depend on this running.
4. **Scheduler**: run `php artisan schedule:run` every minute via cron or
   the `scheduler` service in `docker-compose.yml`.
5. **Redis**: used for cache/queue/session in production — point
   `CACHE_STORE`, `QUEUE_CONNECTION`, and `SESSION_DRIVER` at `redis` in
   `backend/.env`.
6. **Frontend**: `npm run build && npm run start` behind nginx/Vercel/any
   Node host; set the `NEXT_PUBLIC_*` build args at build time (they're
   baked into the client bundle, see `docker/frontend.Dockerfile`).
7. **Secrets**: set every `*_SECRET`/`*_PASSWORD` value via your host's
   secret manager or `.env` file with restricted permissions — never commit
   `.env`. Rotate the seeded admin password before exposing the app publicly.

## Testing

```bash
cd backend && php artisan test      # or ./vendor/bin/pest
cd frontend && npm run build        # type-checks + builds; npm run lint if present
```

## Troubleshooting

- **`SQLSTATE[08006] could not connect to server`**: Postgres isn't running
  or `DB_HOST`/`DB_PORT` in `backend/.env` don't match your setup.
- **Razorpay checkout opens but verify fails**: confirm
  `RAZORPAY_KEY_SECRET` in `backend/.env` matches the same account as the
  `NEXT_PUBLIC_RAZORPAY_KEY` (test vs. live key mismatch is the usual cause).
- **Uploaded logo doesn't show in the preview**: check `CLOUDINARY_*` in
  `backend/.env` — uploads fail closed (they return an error, they do not
  silently pretend to succeed).

## Backup

Back up the PostgreSQL database on a schedule (`pg_dump`) and store the
dumps off-host. Uploaded design assets live in Cloudinary, which has its
own retention — do not rely solely on the database for asset durability.

## Security notes

- All prices are recalculated server-side; the frontend price shown in the
  customizer is always the last value returned by
  `POST /api/v1/customizer/price`, never a client-side computation.
- Payment success is only ever recognized after the backend verifies the
  Razorpay signature (or via the idempotent webhook) — never from a
  frontend callback alone.
- Admin routes are protected by both authentication and a role check on the
  backend (Laravel Policies) — hiding an admin button in the UI is not
  treated as access control anywhere in this codebase.
