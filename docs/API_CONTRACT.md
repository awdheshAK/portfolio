# API Contract — Custom Clothing Platform (MVP scope)

This is the shared contract between the Laravel backend (`backend/`) and the
Next.js frontend (`frontend/`). Both sides must match this exactly so they
can be built independently and integrate without back-and-forth.

Base URL: `NEXT_PUBLIC_API_URL` (frontend) == Laravel app URL, e.g. `http://localhost:8000`.
All API routes are prefixed `/api/v1`.

## Envelope

Success:
```json
{ "success": true, "message": "string", "data": { } }
```
Validation error (422):
```json
{ "success": false, "message": "Validation failed", "errors": { "field": ["msg"] } }
```
Other errors (401/403/404/500): `{ "success": false, "message": "string" }`.

Auth: Laravel Sanctum token (`Authorization: Bearer <token>`), obtained from
`/auth/login` and `/auth/register`. Guests get a `guest_cart_token` (UUID,
generated client-side, stored in localStorage, sent as `X-Guest-Cart-Token`
header) so they can use the cart before logging in.

## Endpoints

### Auth — `/api/v1/auth`
- `POST /register` { name, email, password, password_confirmation } -> user + token
- `POST /login` { email, password } -> user + token
- `POST /logout` (auth) -> null
- `GET /me` (auth) -> user
- `POST /forgot-password` { email } -> generic success message, identical whether or not
  the email exists (no account-existence leak). Sends a real queued email via the
  Laravel password broker linking to `{FRONTEND_URL}/reset-password?token=...&email=...`.
- `POST /reset-password` { token, email, password, password_confirmation } -> success;
  revokes all existing Sanctum tokens for that user.

### Contact / Newsletter (public, rate-limited)
- `POST /api/v1/contact` { name, email, phone?, message } -> stored, no auth required
- `POST /api/v1/newsletter/subscribe` { email } -> idempotent success (200/201 either way,
  never reveals whether the email was already subscribed)

### Measurements — `/api/v1/measurements` (auth required)
Named profiles (e.g. "Office Fit", "Gym Fit"), selectable during customization.
- `GET /` -> Measurement[]
- `POST /` { label, height?, chest?, waist?, hip?, shoulder?, sleeve_length?, neck?, inseam?, outseam?, garment_length? } (all measurements in cm) -> Measurement
- `PUT /{id}` -> Measurement (403 if not the owner)
- `DELETE /{id}` -> null (403 if not the owner)

### Catalog
- `GET /categories` -> [{ id, name, slug, children: [...] }]
- `GET /products` ?category=slug&search=&sort=price_asc|price_desc|newest&min_price=&max_price=&color=&size=&fabric=&page=
  -> paginated { data: Product[], meta: { current_page, last_page, total } }
- `GET /products/{slug}` -> Product (full, with images, variants, reviews)
- `GET /fabrics` -> Fabric[]
- `GET /fabrics/{slug}` -> Fabric
- `GET /collections` -> Collection[]
- `GET /collections/{slug}` -> Collection with products

### Customizer — `/api/v1/customizer`
- `GET /garments` -> Garment[] (customizable base products: id, name, slug, base_price_minor, image_layers{base}, available_sizes[], available_colors[])
- `GET /options` -> {
    fabrics: [{id, name, price_delta_minor}],
    colors: [{id, name, hex, price_delta_minor}],
    sizes: [{id, label, price_delta_minor}],
    print_positions: [{id, label, price_minor, x?, y?, anchor?}],
    embroidery_positions: [{id, label, price_minor, x?, y?, anchor?}],
    patches: [{id, name, type, price_minor}],
  }
- `POST /price` { garment_id, fabric_id, color_id, size_id, logo: bool, text: {...}|null,
    print: {position_id}|null, embroidery: {position_id}|null, patch_ids: number[], quantity }
  -> { data: { subtotal_minor, breakdown: [{label, amount_minor}], total_minor, currency: "INR" } }
  This is the ONLY source of truth for price. Frontend never computes final price itself.

### Designs (saved customizations) — `/api/v1/designs` (auth required)
- `GET /` -> Design[]
- `POST /` { name, configuration: {...same shape as /price input...}, preview_image_url } -> Design
- `GET /{id}` -> Design
- `PUT /{id}` -> Design
- `DELETE /{id}` -> null

### Uploads — `/api/v1/uploads`
- `POST /design-asset` (multipart, auth or guest token) { file } -> { url, public_id }
  Backend uploads to Cloudinary server-side (signed), validates mime/size, returns public URL.
  Frontend NEVER talks to Cloudinary directly and never sees the API secret.

### Cart — `/api/v1/cart` (auth OR guest token header)
- `GET /` -> Cart { items: CartItem[], subtotal_minor, total_minor }
- `POST /items` { type: "product"|"custom", product_variant_id?, design_configuration?, quantity } -> Cart
  (server recalculates price for every item; ignores any price sent by client)
- `PATCH /items/{id}` { quantity } -> Cart
- `DELETE /items/{id}` -> Cart
- `POST /coupon` { code } -> Cart (with discount applied)
- `DELETE /coupon` -> Cart

### Addresses — `/api/v1/addresses` (auth)
- CRUD: GET /, POST /, PUT /{id}, DELETE /{id}

### Checkout / Orders — `/api/v1/orders`
- `POST /checkout` { shipping_address_id | shipping_address{...}, billing_same_as_shipping, notes }
  -> creates Order in `pending_payment` status from current cart, returns
     { data: { order, razorpay_order_id, razorpay_key_id, amount_minor, currency } }
- `GET /` (auth) -> Order[] (customer's own orders)
- `GET /{id}` (auth) -> Order (must own it, or be admin)

### Payments — `/api/v1/payments`
- `POST /razorpay/verify` { razorpay_order_id, razorpay_payment_id, razorpay_signature }
  -> verifies HMAC signature server-side, marks order `payment_confirmed`, returns Order
- `POST /razorpay/webhook` (no auth, verified via X-Razorpay-Signature header + webhook secret)
  -> idempotent; updates order/payment status from async events (captured, failed, refunded)

### Wishlist — `/api/v1/wishlist` (auth)
- `GET /`, `POST / {product_id}`, `DELETE /{product_id}`

### Reviews — `/api/v1/products/{id}/reviews`
- `GET /` -> Review[]
- `POST /` (auth, must have a delivered order containing this product) { rating, body } -> Review

### Coupons (validation only from customer side; admin manages elsewhere)
Handled via `/cart/coupon` above.

### Admin — `/api/v1/admin` (auth + any admin role, further narrowed per resource — see Roles below)
- `GET /dashboard` -> { revenue_minor, orders_count, pending_orders_count, customers_count, products_count, low_stock: Product[], recent_orders: Order[] }
  (any admin role)
- Products: `GET/POST /products`, `PUT/DELETE /products/{id}`
  (role: super_admin, admin, content_manager)
  - `index` returns `{ data: { data: Product[], meta } } }` (paginated, `withTrashed`, includes inactive)
  - `store`/`update` body: `{ category_id?, name, slug?, description?, short_description?, base_price_minor, is_customizable?, is_active?, is_featured?, images?: [{url, alt_text?}], variants?: [{id?, color_id?, size_id?, sku, price_delta_minor?, stock?}] }`
- Categories: `GET/POST/PUT/DELETE /categories` (role: super_admin, admin, content_manager)
  - `index` returns a flat `CategoryResource[]` (`withTrashed`, nested `children`)
  - body: `{ parent_id?, name, slug?, description?, image_url?, is_active?, sort_order? }`
- Collections: `GET/POST/PUT/DELETE /collections` (role: super_admin, admin, content_manager)
  - `index` returns `CollectionResource[]` (`withTrashed`, each with `products` + `product_ids`)
  - body: `{ name, slug?, description?, image_url?, is_active?, product_ids?: number[] }` — `product_ids` fully replaces the collection's product set
- Customizer options: `GET/POST/PUT/DELETE` under `/customizer/{fabrics|colors|sizes|print-positions|embroidery-positions|patches}`
  (role: super_admin, admin, content_manager)
  - fabric body: `{ name, slug?, description?, price_delta_minor?, is_active? }`
  - color body: `{ name, slug?, hex (e.g. #1A2B3C), price_delta_minor?, is_active? }`
  - size body: `{ label, slug?, price_delta_minor?, sort_order?, is_active? }`
  - print/embroidery position body: `{ label, slug?, price_minor, x?, y?, anchor?, is_active? }` (x/y are 0-100 canvas-percentage)
  - patch body: `{ name, slug?, type?, price_minor, image_url?, is_active? }`
- Orders: `GET /orders`, `GET /orders/{id}`, `PATCH /orders/{id}/status` { status }
  (role: super_admin, admin, order_manager, production_manager — production_manager is read/status-update only by convention, not separately enforced)
  - `index` accepts `?status=` filter, paginated `{ data: { data: Order[], meta } } }`
  - `show` includes `items`, `user`, `payments`
- Coupons: `GET/POST/PUT/DELETE /coupons` (role: super_admin, admin, order_manager)
  - body: `{ code, type: percentage|fixed, value, min_order_minor?, max_discount_minor?, usage_limit?, starts_at?, expires_at?, is_active? }`
- Customers: `GET /customers`, `GET /customers/{id}`, `DELETE /customers/{id}` (disable), `POST /customers/{id}/restore` (enable)
  (role: super_admin, admin, order_manager)
  - `index` accepts `?search=` (matches name/email) and `?per_page=`, paginated `{ data: { data: Customer[], meta } } }`
  - `Customer` shape: `{ id, name, email, phone, role, is_disabled, created_at, orders_count, designs_count, addresses_count, measurements_count, wishlists_count }`
  - `show` additionally includes `recent_orders`, `addresses`, `measurements`
  - `disable` soft-deletes the account (blocked with 422 if the target is any admin role); `restore` un-deletes it
  - only lists/targets users with role `customer` — admin accounts are managed separately (there is no UI for creating/editing admin accounts in this build; use `php artisan tinker` or a direct DB update to change a user's role)

## Money

All prices are integers in minor units (paise for INR). Field suffix `_minor`.
Frontend divides by 100 and formats with `Intl.NumberFormat('en-IN', {style:'currency currency:'INR'})` only for display.

## Order status enum (matches DB)

pending_payment, payment_confirmed, processing, customization_review, production,
quality_check, ready_to_ship, shipped, delivered, cancelled, refunded

## Roles

super_admin, admin, production_manager, order_manager, content_manager, customer

`super_admin` and `admin` can access every admin resource. The other three
admin roles are scoped by the backend (`role:` middleware in `routes/api.php`,
enforced server-side — this is not just a frontend nav convenience):

| Resource                                              | content_manager | order_manager | production_manager |
|--------------------------------------------------------|:---:|:---:|:---:|
| Dashboard                                               | ✓ | ✓ | ✓ |
| Products / Categories / Collections / Customizer options| ✓ | – | – |
| Orders (view + status update)                           | – | ✓ | ✓ |
| Coupons                                                  | – | ✓ | – |
| Customers                                                | – | ✓ | – |

A 403 with `{success:false, message:"This action is unauthorized for your role."}`
means the logged-in admin's role doesn't cover that resource — the admin UI's
navigation should hide links a role can't use, matching this table exactly,
but that's for UX only; the table above is enforced on the backend regardless
of what the frontend shows.
