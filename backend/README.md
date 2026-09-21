# Custom Clothing Platform — Backend

A Laravel 11 (PHP 8.3+) REST API for a custom-clothing e-commerce + garment
customizer platform. Implements the contract in
[`../docs/API_CONTRACT.md`](../docs/API_CONTRACT.md).

## Stack

- Laravel 11, PHP 8.3+
- PostgreSQL
- Redis (cache/queue)
- Laravel Sanctum (API token auth)
- Razorpay (`razorpay/razorpay`) for payments
- Cloudinary (`cloudinary/cloudinary_php`) for signed server-side asset uploads

## Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Create the database and a role (adjust to taste), then point `.env` at it:

```bash
sudo -u postgres psql -c "CREATE USER ccp_user WITH PASSWORD 'ccp_password';"
sudo -u postgres psql -c "CREATE DATABASE custom_clothing_platform OWNER ccp_user;"
```

Edit `.env`:

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=custom_clothing_platform
DB_USERNAME=ccp_user
DB_PASSWORD=ccp_password
```

Run migrations and seed a realistic demo store (categories, 10 products,
fabrics, colors, sizes, customizer options, garments, coupons, an admin user
and a customer user):

```bash
php artisan migrate --seed
```

Start the app:

```bash
php artisan serve
# API is now at http://127.0.0.1:8000/api/v1/...
```

If you use Redis for cache/queue (the default in `.env.example`), make sure a
Redis server is running locally, or switch `CACHE_STORE`/`QUEUE_CONNECTION`
to `database`/`sync` for a dependency-free local setup.

## Default demo credentials

**These are demo credentials only. Change them (or delete these accounts)
before deploying anywhere real.**

| Role     | Email                 | Password       |
|----------|-----------------------|----------------|
| Admin    | `admin@example.com`   | `ChangeMe123!` |
| Customer | `customer@example.com`| `ChangeMe123!` |

**You must change these passwords (or rotate the accounts) before any
non-local deployment.**

## Running tests

Tests run against SQLite in-memory (configured in `.env.testing` and
`phpunit.xml`) so they don't require a running Postgres instance, even
though production uses Postgres.

```bash
php artisan test
# or
./vendor/bin/phpunit
```

Covers: auth (register/login), `PricingService` (the single source of truth
for all pricing — several fabric/color/size/print/embroidery/patch
combinations with exact expected totals), cart add/update/remove, coupon
validation (expired, below minimum order, usage limit exhausted, unknown
code), and order creation from cart (stock re-validation, order/order-item
snapshotting, Razorpay order creation, cart clearing). All 32 tests pass at
the time of writing.

## Payments — Razorpay

`App\Services\RazorpayService` wraps the official `razorpay/razorpay` SDK:

- `POST /api/v1/orders/checkout` creates a pending order and a matching
  Razorpay order (`orders.create`).
- `POST /api/v1/payments/razorpay/verify` verifies the checkout signature
  with HMAC-SHA256 using `RAZORPAY_KEY_SECRET`.
- `POST /api/v1/payments/razorpay/webhook` verifies `X-Razorpay-Signature`
  against `RAZORPAY_WEBHOOK_SECRET` and idempotently updates
  order/payment status from async events (`payment.captured`,
  `payment.failed`, `order.paid`, `refund.processed`).

**This will not work against the real Razorpay API without real
credentials.** Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
`RAZORPAY_WEBHOOK_SECRET` in `.env` from your Razorpay dashboard (test mode
keys are fine for development). Without them, checkout will fail cleanly
with a "Razorpay is not configured" error rather than a silent fake success.

## Uploads — Cloudinary

`App\Services\CloudinaryStorageService` (behind the `StorageService`
interface) validates mime type (png/jpg/jpeg/svg) and file size (≤5MB)
*before* uploading, then performs a signed server-side upload via the
official `cloudinary/cloudinary_php` SDK. The frontend never talks to
Cloudinary directly and the API secret is never returned in any response.

**This will not work against the real Cloudinary API without real
credentials.** Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and
`CLOUDINARY_API_SECRET` (or a single `CLOUDINARY_URL`) in `.env`. Without
them, `POST /api/v1/uploads/design-asset` fails cleanly with a "Cloudinary
is not configured" error.

## Stripe — architected for, not wired up

Per the project scope, Stripe is *architected for but not required*.
`App\Services\StripeService` implements the same
`App\Services\Contracts\PaymentGatewayService` interface as
`RazorpayService`, but every method currently throws — it is a documented
stub, not a fake integration. No route or controller calls into it. To add
real Stripe support later: `composer require stripe/stripe-php`, implement
the three methods using `STRIPE_KEY`/`STRIPE_SECRET`/`STRIPE_WEBHOOK_SECRET`
(already present in `config/services.php` and `.env.example`), and add a
`StripePaymentController` + routes analogous to the Razorpay flow.

## Architecture notes

- **Money**: every price is an integer in minor units (paise for INR),
  stored in `*_minor` columns and returned in `*_minor` JSON fields. No
  floats are used for currency anywhere.
- **Pricing**: `App\Services\PricingService` is the single source of truth
  for price. `POST /api/v1/customizer/price`, cart line-item pricing, and
  order/checkout totals all call it — client-sent prices are never trusted.
- **Response envelope**: every response follows
  `{ success, message, data }` (success) or
  `{ success, message, errors }` (422 validation) /
  `{ success, message }` (other errors), implemented via the
  `App\Http\Concerns\ApiResponse` trait used by the base controller, and a
  global JSON exception renderer in `bootstrap/app.php` that never leaks
  stack traces unless `APP_DEBUG=true`.
- **Validation / Resources / Policies / Services**: Form Request classes
  validate every write endpoint, API Resource classes shape every response,
  Policies authorize resource ownership (orders, designs, addresses), and
  business logic lives in `App\Services\*` — never in controllers.
- **Admin RBAC**: `App\Http\Middleware\EnsureUserIsAdmin` (aliased
  `admin`) enforces the `super_admin|admin|production_manager|
  order_manager|content_manager` roles on every `/api/v1/admin/*` route.
  Every admin write also records an `activity_logs` row via
  `App\Services\ActivityLogService` (audit log: actor, action, resource,
  old/new values, IP).
- **Cart**: works for both guests (`X-Guest-Cart-Token` header, a
  client-generated UUID) and authenticated users; `App\Services\CartService`
  merges a guest cart into a user's cart the moment both are present in the
  same request (e.g. right after login).

## Known deviations from the contract

- `GET /api/v1/products` accepts a `fabric` query filter per the contract,
  but in this schema fixed catalog products are not associated with fabrics
  (fabrics only apply to the customizer flow for made-to-order garments), so
  the parameter is currently a no-op. Everything else in that endpoint
  (`category`, `search`, `sort`, `min_price`, `max_price`, `color`, `size`,
  `page`) is fully implemented.
- Category slugs for same-named subcategories across different parents
  (e.g. "T-Shirts" under both "Casual Wear" and "Gym Wear") are namespaced
  as `{parent-slug}-{child-slug}` (e.g. `casual-wear-t-shirts` and
  `gym-wear-t-shirts`) since slugs are globally unique in this schema.

## Composer / verification status

`composer install`, `php artisan migrate --seed` against a real local
PostgreSQL database, `php artisan serve`, and a battery of `curl` requests
against every major endpoint (auth, catalog, customizer pricing, cart,
coupons, checkout up to the Razorpay API boundary, wishlist, reviews, and
admin CRUD + RBAC) were all run and verified working during development.
`php artisan test` passes 32/32 tests.
