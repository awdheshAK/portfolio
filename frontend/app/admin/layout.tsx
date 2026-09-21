"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isAdminRole } from "@/lib/admin-roles";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthorized = isAuthenticated && isAdminRole(user?.role);

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/admin")}`);
    }
  }, [isLoading, isAuthorized, pathname, router]);

  if (isLoading || !isAuthorized || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading admin dashboard…</p>
      </div>
    );
  }

  return (
    <AdminShell user={user} onLogout={() => logout()}>
      {children}
    </AdminShell>
  );
}
