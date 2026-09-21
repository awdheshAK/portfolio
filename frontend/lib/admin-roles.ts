import type { UserRole } from "@/types/api";

// Mirrors docs/API_CONTRACT.md's "Roles" table exactly. This is a UX
// convenience only — the backend's `role:` middleware is the real
// enforcement boundary (see routes/api.php in the backend repo). If the
// mapping here ever drifts from that middleware, the worst that happens is
// a nav link that 403s, which every admin page already handles gracefully.
export const ALL_ADMIN_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "production_manager",
  "order_manager",
  "content_manager",
];

export const CONTENT_ROLES: UserRole[] = ["super_admin", "admin", "content_manager"];
export const ORDER_VIEW_ROLES: UserRole[] = ["super_admin", "admin", "order_manager", "production_manager"];
export const ORDER_MANAGE_ROLES: UserRole[] = ["super_admin", "admin", "order_manager"];

export function isAdminRole(role: UserRole | undefined | null): boolean {
  return !!role && ALL_ADMIN_ROLES.includes(role);
}

export function roleCan(role: UserRole | undefined | null, allowed: UserRole[]): boolean {
  return !!role && allowed.includes(role);
}

export interface AdminNavItem {
  label: string;
  href: string;
  roles: UserRole[];
  /** Matches this item as "active" for any path under this prefix (defaults to `href`). */
  activePrefix?: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", roles: ALL_ADMIN_ROLES },
  { label: "Products", href: "/admin/products", roles: CONTENT_ROLES },
  { label: "Categories", href: "/admin/categories", roles: CONTENT_ROLES },
  { label: "Collections", href: "/admin/collections", roles: CONTENT_ROLES },
  { label: "Customizer", href: "/admin/customizer/fabrics", roles: CONTENT_ROLES, activePrefix: "/admin/customizer" },
  { label: "Orders", href: "/admin/orders", roles: ORDER_VIEW_ROLES, activePrefix: "/admin/orders" },
  { label: "Coupons", href: "/admin/coupons", roles: ORDER_MANAGE_ROLES },
  { label: "Customers", href: "/admin/customers", roles: ORDER_MANAGE_ROLES, activePrefix: "/admin/customers" },
];

export const CUSTOMIZER_TABS: Array<{ label: string; href: string }> = [
  { label: "Fabrics", href: "/admin/customizer/fabrics" },
  { label: "Colors", href: "/admin/customizer/colors" },
  { label: "Sizes", href: "/admin/customizer/sizes" },
  { label: "Print Positions", href: "/admin/customizer/print-positions" },
  { label: "Embroidery Positions", href: "/admin/customizer/embroidery-positions" },
  { label: "Patches", href: "/admin/customizer/patches" },
];
