"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * Simple client-side auth guard: redirects to /login (preserving the
 * current path as ?next=) once we know there's no authenticated user.
 * Returns the auth state so callers can render a loading state until then.
 */
export function useRequireAuth(currentPath: string) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
    }
  }, [auth.isLoading, auth.isAuthenticated, currentPath, router]);

  return auth;
}
