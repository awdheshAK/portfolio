// Types mirror docs/API_CONTRACT.md exactly. Money fields are integers in
// minor units (paise) — never do currency math with floats on the frontend.

export interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page?: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type UserRole =
  | "super_admin"
  | "admin"
  | "production_manager"
  | "order_manager"
  | "content_manager"
  | "customer";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export interface Category {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
  children?: Category[];
}

export interface ProductImage {
  id: number;
  url: string;
  alt?: string | null;
}

export interface ProductColorOption {
  id: number;
  name: string;
  hex: string;
}

export interface ProductSizeOption {
  id: number;
  label: string;
}

export interface ProductVariant {
  id: number;
  color?: ProductColorOption | null;
  size?: ProductSizeOption | null;
  stock: number;
  sku?: string;
}

export interface Review {
  id: number;
  product_id: number;
  user?: Pick<User, "id" | "name"> | null;
  rating: number;
  body: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price_minor: number;
  sale_price_minor?: number | null;
  currency?: string;
  images: ProductImage[];
  category?: Category | null;
  fabric?: { id: number; name: string; slug: string } | null;
  colors: ProductColorOption[];
  sizes: ProductSizeOption[];
  variants?: ProductVariant[];
  rating_avg?: number;
  reviews_count?: number;
  reviews?: Review[];
  related_products?: Product[];
  in_stock?: boolean;
  created_at?: string;
}

export interface ProductListParams {
  category?: string;
  search?: string;
  sort?: "price_asc" | "price_desc" | "newest";
  min_price?: number;
  max_price?: number;
  color?: string;
  size?: string;
  fabric?: string;
  page?: number;
}

export interface Fabric {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string | null;
  price_delta_minor?: number;
  composition?: string;
  weight_gsm?: number;
  care_instructions?: string;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  banner_image_url?: string | null;
  products?: Product[];
}

// ---------------------------------------------------------------------------
// Customizer
// ---------------------------------------------------------------------------

export interface Garment {
  id: number;
  name: string;
  slug: string;
  base_price_minor: number;
  image_layers: { base: string };
  available_sizes: ProductSizeOption[];
  available_colors: ProductColorOption[];
  category?: string;
}

export interface CustomizerOptionItem {
  id: number;
  name?: string;
  label?: string;
  price_delta_minor?: number;
  price_minor?: number;
  hex?: string;
  type?: string;
}

export interface CustomizerOptions {
  fabrics: Array<{ id: number; name: string; price_delta_minor: number }>;
  colors: Array<{ id: number; name: string; hex: string; price_delta_minor: number }>;
  sizes: Array<{ id: number; label: string; price_delta_minor: number }>;
  print_positions: Array<{ id: number; label: string; price_minor: number }>;
  embroidery_positions: Array<{ id: number; label: string; price_minor: number }>;
  patches: Array<{ id: number; name: string; type: string; price_minor: number }>;
}

export interface CustomTextConfig {
  content: string;
  font: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  rotation: number;
}

export interface PriceRequestPayload {
  garment_id: number;
  fabric_id: number | null;
  color_id: number | null;
  size_id: number | null;
  logo: boolean;
  text: CustomTextConfig | null;
  print: { position_id: number } | null;
  embroidery: { position_id: number } | null;
  patch_ids: number[];
  quantity: number;
}

export interface PriceBreakdownLine {
  label: string;
  amount_minor: number;
}

export interface PriceBreakdown {
  subtotal_minor: number;
  breakdown: PriceBreakdownLine[];
  total_minor: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Designs
// ---------------------------------------------------------------------------

export interface DesignConfiguration extends PriceRequestPayload {
  logo_url?: string | null;
  embroidery_thread_color?: string | null;
  notes?: string;
  measurements?: Record<string, number | undefined>;
}

export interface Design {
  id: number;
  name: string;
  configuration: DesignConfiguration;
  preview_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

export interface UploadedAsset {
  url: string;
  public_id: string;
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export type CartItemType = "product" | "custom";

export interface CartItem {
  id: number;
  type: CartItemType;
  quantity: number;
  unit_price_minor: number;
  total_price_minor: number;
  product?: Pick<Product, "id" | "name" | "slug" | "images"> | null;
  product_variant_id?: number | null;
  variant_label?: string | null;
  design_configuration?: DesignConfiguration | null;
  preview_image_url?: string | null;
}

export interface Cart {
  id?: number;
  items: CartItem[];
  subtotal_minor: number;
  discount_minor?: number;
  total_minor: number;
  coupon_code?: string | null;
  currency?: string;
}

export interface AddCartItemPayload {
  type: CartItemType;
  product_variant_id?: number;
  design_configuration?: DesignConfiguration;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export interface Address {
  id: number;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export type AddressPayload = Omit<Address, "id">;

// ---------------------------------------------------------------------------
// Orders / Checkout
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "pending_payment"
  | "payment_confirmed"
  | "processing"
  | "customization_review"
  | "production"
  | "quality_check"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  id: number;
  type: CartItemType;
  quantity: number;
  unit_price_minor: number;
  total_price_minor: number;
  product?: Pick<Product, "id" | "name" | "slug" | "images"> | null;
  design_configuration?: DesignConfiguration | null;
  preview_image_url?: string | null;
}

export interface Order {
  id: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotal_minor: number;
  discount_minor?: number;
  shipping_minor?: number;
  total_minor: number;
  currency: string;
  shipping_address?: Address;
  billing_address?: Address | null;
  billing_same_as_shipping?: boolean;
  notes?: string;
  created_at: string;
}

export interface CheckoutPayload {
  shipping_address_id?: number;
  shipping_address?: AddressPayload;
  billing_same_as_shipping: boolean;
  notes?: string;
}

export interface CheckoutResponse {
  order: Order;
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount_minor: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------

export interface WishlistItem {
  product: Product;
  added_at?: string;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
//
// NOTE on backend gaps found while wiring this up (see final report): a few
// admin JSON resources on the backend do not yet serialize every field their
// own store/update validation accepts, or that docs/API_CONTRACT.md
// documents. Where that's true the field below is typed optional and every
// admin screen reads it defensively (`?? fallback`) rather than assuming
// it's present. Concretely:
// - ProductResource never returns `is_active`, `category_id` or
//   `deleted_at`, though the Product model has all three and admin
//   store/update accept `is_active`.
// - CategoryResource never returns `is_active` or `sort_order`, though the
//   model has both and admin store/update accept them.
// - FabricResource never returns `is_active`. ColorResource never returns
//   `slug` or `is_active`. SizeResource never returns `slug`, `sort_order`
//   or `is_active`. Print/EmbroideryPositionResource never return `slug` or
//   `is_active`. PatchResource never returns `slug` or `is_active`.
// - OrderResource never returns `user` or `payments`, even though the admin
//   controller eager-loads both relations and the contract's "Orders" entry
//   says `show` includes `items`, `user`, `payments`.

export interface AdminProductImage {
  id?: number;
  url: string;
  alt_text?: string | null;
  sort_order?: number;
}

export interface AdminProductVariant {
  id?: number;
  color_id?: number | null;
  size_id?: number | null;
  color?: ProductColorOption | null;
  size?: ProductSizeOption | null;
  sku: string;
  price_delta_minor?: number;
  price_minor?: number | null;
  stock?: number;
  is_active?: boolean;
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  base_price_minor: number;
  is_customizable?: boolean;
  /** Not currently serialized by the backend — see note above. Treat as unknown, not false. */
  is_active?: boolean;
  is_featured?: boolean;
  rating_avg?: number;
  rating_count?: number;
  category?: { id: number; name: string; slug: string } | null;
  images: AdminProductImage[];
  variants: AdminProductVariant[];
  created_at?: string;
}

export interface AdminProductPayload {
  category_id?: number | null;
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  base_price_minor: number;
  is_customizable?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  images?: Array<{ url: string; alt_text?: string }>;
  variants?: Array<{
    id?: number;
    color_id?: number | null;
    size_id?: number | null;
    sku: string;
    price_delta_minor?: number;
    stock?: number;
  }>;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: number | null;
  /** Not currently serialized by the backend — see note above. */
  is_active?: boolean;
  sort_order?: number;
  children?: AdminCategory[];
}

export interface AdminCategoryPayload {
  parent_id?: number | null;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface AdminCollection {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  deleted_at?: string | null;
  products?: Product[];
  product_ids: number[];
}

export interface AdminCollectionPayload {
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  product_ids?: number[];
}

export interface AdminFabric {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  price_delta_minor: number;
  /** Not currently serialized by the backend — see note above. */
  is_active?: boolean;
}

export interface AdminFabricPayload {
  name: string;
  slug?: string;
  description?: string;
  price_delta_minor?: number;
  is_active?: boolean;
}

export interface AdminColor {
  id: number;
  name: string;
  /** Not currently serialized by the backend — see note above. */
  slug?: string;
  hex: string;
  price_delta_minor: number;
  /** Not currently serialized by the backend — see note above. */
  is_active?: boolean;
}

export interface AdminColorPayload {
  name: string;
  slug?: string;
  hex: string;
  price_delta_minor?: number;
  is_active?: boolean;
}

export interface AdminSize {
  id: number;
  label: string;
  /** Not currently serialized by the backend — see note above. */
  slug?: string;
  price_delta_minor: number;
  /** Not currently serialized by the backend — see note above. */
  sort_order?: number;
  /** Not currently serialized by the backend — see note above. */
  is_active?: boolean;
}

export interface AdminSizePayload {
  label: string;
  slug?: string;
  price_delta_minor?: number;
  sort_order?: number;
  is_active?: boolean;
}

export type CustomizerPositionKind = "print-positions" | "embroidery-positions";

export interface AdminPosition {
  id: number;
  label: string;
  /** Not currently serialized by the backend — see note above. */
  slug?: string;
  price_minor: number;
  x?: number | null;
  y?: number | null;
  anchor?: string | null;
  /** Not currently serialized by the backend — see note above. */
  is_active?: boolean;
}

export interface AdminPositionPayload {
  label: string;
  slug?: string;
  price_minor: number;
  x?: number;
  y?: number;
  anchor?: string;
  is_active?: boolean;
}

export interface AdminPatch {
  id: number;
  name: string;
  /** Not currently serialized by the backend — see note above. */
  slug?: string;
  type?: string | null;
  price_minor: number;
  image_url?: string | null;
  /** Not currently serialized by the backend — see note above. */
  is_active?: boolean;
}

export interface AdminPatchPayload {
  name: string;
  slug?: string;
  type?: string;
  price_minor: number;
  image_url?: string;
  is_active?: boolean;
}

export interface Payment {
  id: number;
  gateway: string;
  gateway_order_id?: string | null;
  gateway_payment_id?: string | null;
  status: string;
  amount_minor: number;
  currency: string;
  created_at?: string;
}

export interface AdminOrder extends Order {
  order_number?: string;
  /** Not currently serialized by OrderResource despite being eager-loaded — see note above. */
  user?: Pick<User, "id" | "name" | "email"> | null;
  /** Not currently serialized by OrderResource despite being eager-loaded — see note above. */
  payments?: Payment[];
}

export interface Measurement {
  id: number;
  label: string;
  height?: number | null;
  chest?: number | null;
  waist?: number | null;
  hip?: number | null;
  shoulder?: number | null;
  sleeve_length?: number | null;
  neck?: number | null;
  inseam?: number | null;
  outseam?: number | null;
  garment_length?: number | null;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  is_disabled: boolean;
  created_at?: string;
  orders_count?: number;
  designs_count?: number;
  addresses_count?: number;
  measurements_count?: number;
  wishlists_count?: number;
  recent_orders?: AdminOrder[];
  addresses?: Address[];
  measurements?: Measurement[];
}

export interface Coupon {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_minor?: number;
  max_discount_minor?: number | null;
  usage_limit?: number | null;
  used_count: number;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
}

export interface CouponPayload {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_minor?: number;
  max_discount_minor?: number;
  usage_limit?: number;
  starts_at?: string;
  expires_at?: string;
  is_active?: boolean;
}

export interface DashboardStats {
  revenue_minor: number;
  orders_count: number;
  pending_orders_count: number;
  customers_count: number;
  products_count: number;
  low_stock: AdminProduct[];
  recent_orders: AdminOrder[];
}
