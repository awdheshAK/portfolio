# Manual Testing Checklist

Work through this after completing [LOCAL_SETUP.md](./LOCAL_SETUP.md), with
the backend, frontend, and (if applicable) Redis/queue worker all running.
Check items off as you confirm them. Anything that fails should be fixed
*before* deploying — see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
only once every box here is checked.

Use two browser sessions where noted: one signed in as
`customer@example.com`, one as `admin@example.com` (or a private/incognito
window for the second, so both sessions stay logged in independently).

---

## Homepage (`/`)

- [ ] Page loads with the announcement bar, header, and hero visible
- [ ] "Shop Collection" and "Customize Your Garment" hero buttons both navigate correctly
- [ ] Shop-by-category section links to the correct category pages
- [ ] Featured products section shows real seeded products (not placeholders)
- [ ] Popular fabrics section shows real seeded fabrics
- [ ] Newsletter signup form submits successfully and shows a confirmation
- [ ] Footer links are all present and none are dead

## Shop & catalog

- [ ] `/shop` lists all active seeded products with images, names, and prices
- [ ] Category filter narrows the list correctly
- [ ] Price range filter works
- [ ] Color / size / fabric filters work
- [ ] Sorting (price low-high, high-low, newest) changes order correctly
- [ ] Pagination works past the first page (if more than one page of results)
- [ ] Search returns relevant results for a product name (e.g. "hoodie")
- [ ] Search for a nonsense term shows a real "no results" empty state, not a blank page or error

## Categories

- [ ] `/shop/[category]` and `/shop/[category]/[subcategory]` both load and show only that category's products

## Product detail page

- [ ] Image gallery renders and (if multiple images) can be navigated
- [ ] Price and sale price (if any) display correctly
- [ ] Color/size selectors update the displayed price/availability
- [ ] "Add to Cart" adds the exact selected variant and quantity
- [ ] "Buy Now" (if present) goes straight toward checkout
- [ ] Wishlist button toggles and reflects state on reload
- [ ] "Customize this garment" link (if shown) goes to `/customize`
- [ ] Reviews list renders; submitting a review is blocked unless you have a delivered order for that product (expected — this is enforced by design)
- [ ] Related/recently viewed products section shows real products

## Fabrics

- [ ] `/fabrics` lists all seeded fabrics
- [ ] `/fabrics/[slug]` shows fabric detail (description, composition-style info, price adjustment)

## Collections

- [ ] `/collections` lists active collections
- [ ] `/collections/[slug]` shows only that collection's products

---

## Customizer (`/customize`) — the core feature

Go through the full wizard start to finish at least once:

- [ ] **Garment selection** — choosing a garment updates the preview base
- [ ] **Fabric selection** — choosing a fabric updates the price breakdown
- [ ] **Color** — choosing a color visibly recolors the live preview
- [ ] **Size** — selecting a size updates the price if the size has a surcharge
- [ ] **Measurements** — you can enter measurements and save them as a named profile (e.g. "Office Fit"); a saved profile can be selected again
- [ ] **Logo upload** — uploading a PNG/JPG succeeds and the logo appears on the live preview; an oversized or wrong-type file is rejected with a clear message (not a silent failure)
- [ ] **Custom text** — typed text appears live on the preview; font, size, color, bold/italic, alignment, and rotation controls all visibly change it; exceeding the character limit is blocked
- [ ] **Print / graphics** — selecting a print position shows an indicator on the preview and changes the price
- [ ] **Embroidery** — enabling embroidery, choosing a position and thread color, changes the preview indicator and the price
- [ ] **Patches & extras** — selecting a patch adds its indicator and price
- [ ] **Live preview** — re-check that *every* change above (color, logo, text, print, embroidery, patch) is reflected on the canvas without a page reload
- [ ] **Price calculator** — the displayed total updates after each change and matches: garment base + fabric + color + size + logo/text/print/embroidery/patch charges (spot check the math against what you selected)
- [ ] **Save Design** while logged out — you're redirected to log in, and your in-progress configuration is restored after logging in
- [ ] **Save Design** while logged in — appears afterward under `/account/designs`
- [ ] **Add to Cart** — the customized item appears in the cart with its full configuration intact (open the cart and confirm the options shown match what you picked)
- [ ] **Reset** — a reset control clears the wizard back to step one
- [ ] Resize the browser to a phone width — the wizard becomes a usable step-by-step flow (not a squashed desktop layout), with visible progress/back/next

## Cart

- [ ] Cart shows both a plain product and a customized item added earlier, each with correct price and quantity
- [ ] Changing quantity updates the line total and cart total
- [ ] Removing an item updates the total and, if it was the last item, shows an empty-cart state
- [ ] Applying a valid seeded coupon code reduces the total correctly
- [ ] Applying an invalid/expired coupon shows a clear error, not a crash
- [ ] Removing an applied coupon restores the original total

## Checkout

- [ ] Checkout requires being logged in (or completes guest checkout, if you're testing that path) and redirects appropriately if not
- [ ] You can select a saved address or add a new one
- [ ] Order review screen shows the correct items, subtotal, discount, shipping, and total before payment
- [ ] Clicking pay opens the real Razorpay checkout popup (see section L of LOCAL_SETUP.md for test credentials)
- [ ] Completing a test payment redirects to a real success page — **only** after the backend verifies payment (confirm the order status is `payment_confirmed`, not just "assumed successful" client-side)
- [ ] Deliberately failing/cancelling the Razorpay popup leaves the order in a pending/failed state, not falsely marked as paid
- [ ] The new order appears under `/account/orders`

## Account area

- [ ] `/account` shows the logged-in user's profile
- [ ] `/account/orders` lists past orders; `/account/orders/[id]` shows full order detail
- [ ] `/account/designs` lists saved customizer designs; "Add to Cart" from a saved design works
- [ ] `/account/wishlist` lists wishlisted products; can be added to cart from there
- [ ] `/account/addresses` — add, edit, and delete an address
- [ ] `/account/measurements` — add, edit, and delete a measurement profile
- [ ] Password reset: request one, find the email in `storage/logs/laravel.log` (or your inbox if SMTP is configured), follow the link, set a new password, and log in with it
- [ ] Log out actually clears the session (revisiting `/account` redirects to login)

---

## Admin dashboard (log in as `admin@example.com` at `/admin`)

- [ ] `/admin` dashboard shows real numbers (revenue, order counts, customer/product counts) that change as you place test orders
- [ ] Low-stock table and recent-orders table reflect real data

### Products

- [ ] List loads with pagination
- [ ] Create a new product with images and variants — it appears on the live storefront `/shop` immediately
- [ ] Edit a product's price/stock — the change reflects on the storefront
- [ ] Delete a product — it disappears from the storefront

### Categories

- [ ] Create, edit (including changing parent), and delete a category
- [ ] Toggling active/inactive hides/shows it appropriately on the storefront

### Collections

- [ ] Create a collection, assign products via the picker, and confirm it appears at `/collections/[slug]` on the storefront with exactly those products

### Fabrics / Colors / Sizes / Customization options

- [ ] Create/edit/delete a fabric, color, size, print position, embroidery position, and patch
- [ ] Confirm a newly added option (e.g. a new color) shows up as a selectable option in the `/customize` wizard

### Orders

- [ ] Order list can be filtered by status
- [ ] Order detail shows customer info, items, addresses, and payment status
- [ ] Changing an order's status via the dropdown + Save actually persists (reload the page to confirm) and the customer's `/account/orders` view reflects it

### Customers

- [ ] Customer list is searchable by name/email
- [ ] Customer detail shows their real orders, addresses, and measurements
- [ ] Disabling a customer account, then attempting to log in as that customer, fails
- [ ] Restoring the account allows login again

### Coupons

- [ ] Create a percentage coupon and a fixed-amount coupon, each with a usage limit and expiry
- [ ] Confirm both apply correctly at checkout, and that usage limit/expiry are enforced

### Permissions (role-aware navigation and backend enforcement)

If you want to test this thoroughly, create additional admin users with
different roles (via `php artisan tinker` — there's no UI for creating
admin accounts, by design — see LOCAL_SETUP.md):

```php
\App\Models\User::create(['name'=>'Test CM','email'=>'cm@example.com','password'=>bcrypt('Password123!'),'role'=>'content_manager','email_verified_at'=>now()]);
```

- [ ] A `content_manager` sees Products/Categories/Collections/Customizer in the sidebar but not Orders/Coupons/Customers, and a direct API call to an orders/coupons/customers endpoint returns 403
- [ ] An `order_manager` sees Orders/Coupons/Customers but not Products/Categories, and is blocked from product-management endpoints
- [ ] A `production_manager` can view and update order status but is blocked from coupons/customers
- [ ] A plain `customer` account cannot reach `/admin` at all (redirected to login) and gets 403 from any `/api/v1/admin/*` call

---

## Cross-cutting checks

- [ ] Every price shown anywhere (storefront, cart, checkout, admin) is
      internally consistent — no rounding mismatches between what the
      customizer showed and what checkout charges
- [ ] Browser back/forward buttons don't break any multi-step flow (checkout, customizer)
- [ ] No page shows a raw error stack trace (check with `APP_DEBUG=false` in a near-production test, if you do one)
- [ ] No console errors in the browser dev tools on the pages you visited
