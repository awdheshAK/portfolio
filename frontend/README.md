# Custom Clothing Platform — Frontend

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 frontend for the Custom
Clothing Platform: an e-commerce storefront plus a real, canvas-based garment
customizer. Built against `../docs/API_CONTRACT.md`, which is authoritative
for every endpoint, payload shape and money format — the Laravel backend in
`../backend` is built from the same contract.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in values, see below
npm run dev                  # http://localhost:3000
```

## Scripts

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build (also runs the TypeScript check)
- `npm run start` — serve the production build
- `npm run lint` — ESLint

## Environment variables

See `.env.example`. All are read via `NEXT_PUBLIC_*` so they're available in
the browser (do not put secrets here — this is a pure client-side app with
no server-side secret storage).

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Everything | Base URL of the Laravel backend. Falls back to `http://localhost:8000` if unset. |
| `NEXT_PUBLIC_APP_URL` | SEO metadata, sitemap.xml, robots.txt | Falls back to `http://localhost:3000`. |
| `NEXT_PUBLIC_RAZORPAY_KEY` | `/checkout` | Razorpay **publishable** Key ID only, used to open the Checkout widget. The backend also returns a `razorpay_key_id` per order, which takes precedence when present. Never put a Razorpay *secret* here. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Reference only | The frontend never talks to Cloudinary directly — logo/design uploads go through `POST /api/v1/uploads/design-asset`, which the backend signs and proxies. This var needs the **backend's** Cloudinary config to actually work; it's not consumed directly by any frontend upload code. |

## Architecture

- `app/` — routes (App Router). Pages that need live data are thin server
  wrappers around a `"use client"` component that fetches via `services/`,
  so `next build` never depends on a reachable backend at build time.
- `components/` — UI components, grouped by domain (`layout/`, `product/`,
  `customizer/`, `cart/`, `checkout/`, `account`-adjacent, `home/`, `ui/`).
- `services/` — one file per API resource; every function matches
  `API_CONTRACT.md`'s method, path and payload shape exactly.
- `lib/http.ts` — the fetch wrapper: unwraps the `{success,message,data}`
  envelope, throws `ApiError` (with `.errors` for 422s) otherwise, and
  attaches `Authorization: Bearer <token>` or `X-Guest-Cart-Token`.
- `hooks/` — `AuthProvider`/`useAuth`, `CartProvider`/`useCart`,
  `ToastProvider`/`useToast`, plus small utility hooks.
- `types/api.ts` — all shared types, mirroring the contract.
- `config/` — site nav/copy (`site.ts`) and customizer constants/limits
  (`customizer.ts`).

## The Customizer (`/customize`)

The live preview (`components/customizer/GarmentPreview.tsx` +
`lib/canvas-garment.ts`) is a real `<canvas>` compositor, not a static image:

1. **Garment layer** — if the selected garment has a real photo
   (`image_layers.base`), it's recolored with `globalCompositeOperation`
   (`multiply` for shading, then `destination-in` to clip color back to the
   photo's own silhouette so it never bleeds onto the background). If there's
   no photo, or it fails to load, a procedural vector garment (t-shirt /
   hoodie / polo / shirt silhouette, drawn with canvas paths) is used
   instead — this means the customizer is fully demonstrable with **no
   backend running at all**.
2. **Print/graphic placement indicator** — a dashed box + label at the
   chosen position.
3. **Uploaded logo** — drawn at the chosen position, clipped to the garment
   silhouette.
4. **Custom text** — `ctx.fillText` with the chosen font/size/color/
   bold/italic/alignment/rotation.
5. **Embroidery badge** and **patch badges** — drawn as indicators with the
   chosen thread color / patch names.

Every one of these is a prop; the `useEffect` in `GarmentPreview` re-runs the
full draw on every change — there's no cached/static preview image.

**Price** is never computed on the frontend. `POST /customizer/price` is
called (debounced) on every relevant change, and the displayed breakdown and
total always come from that response. If the call fails, the UI shows an
error and disables "Add to Cart"/"Save Design" rather than guessing a price.

**Contract gap:** `GET /customizer/options`'s `print_positions` and
`embroidery_positions` only return `{id, label, price_minor}` — no canvas
coordinates. `config/customizer.ts#resolvePositionCoords` infers a
placement from the label text (e.g. "Left Chest" → a specific x/y). If the
backend adds real anchor coordinates to those objects, prefer those instead.

## Known assumptions / gaps vs. `API_CONTRACT.md`

The contract doesn't define endpoints for a few features the brief asked
for. These are implemented against a reasonable conventional path and
clearly commented in the corresponding `services/*.ts` file; the backend
needs matching routes for them to work end-to-end:

- **Contact form** (`/contact`) → `POST /api/v1/contact` (`services/contact.ts`)
- **Newsletter signup** (footer + home) → `POST /api/v1/newsletter/subscribe` (`services/newsletter.ts`)
- **Forgot password** (`/forgot-password`) → `POST /api/v1/auth/forgot-password` (`services/auth.ts`)
- **Saved measurement profiles** (customizer + `/account/measurements`) — no
  endpoint exists in the contract at all, so these are stored in
  `localStorage` only (`services/measurements.ts`), not synced to the
  backend/account. Recommend adding
  `GET/POST/PUT/DELETE /api/v1/measurements`.

## Auth token storage (tradeoff, documented in code)

This is a pure SPA making cross-origin fetches to the Laravel API — it can't
set a real httpOnly cookie itself. The Sanctum token is kept in
`localStorage` (see the comment in `lib/auth-token.ts`) and only ever sent
via the `Authorization` header, never interpolated into `innerHTML` or the
DOM. This is an accepted MVP tradeoff; hardening it further would mean
proxying auth through a Next.js Route Handler that sets a real httpOnly
cookie.

## Payments

`/checkout` loads the real `https://checkout.razorpay.com/v1/checkout.js`
script, calls `POST /orders/checkout` to get a `razorpay_order_id` +
`razorpay_key_id` + `amount_minor`, opens the Razorpay widget with those, and
only calls `POST /payments/razorpay/verify` from the client-side success
handler. The order is never shown as paid, and `/checkout/success` is never
reached, unless that verify call itself returns success — payment
confirmation is entirely server-authoritative.
