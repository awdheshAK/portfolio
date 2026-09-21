"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@/types/api";
import * as authService from "@/services/auth";
import { clearAuthToken, getAuthToken, getStoredUserJson, setAuthToken, setStoredUserJson } from "@/lib/auth-token";
import { getErrorMessage } from "@/lib/http";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existingToken = getAuthToken();
    setToken(existingToken);
    if (existingToken) {
      const cachedUser = getStoredUserJson();
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser) as User);
        } catch {
          /* ignore malformed cache */
        }
      }
      authService
        .getMe()
        .then((freshUser) => {
          setUser(freshUser);
          setStoredUserJson(JSON.stringify(freshUser));
        })
        .catch(() => {
          clearAuthToken();
          setUser(null);
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: nextUser, token: nextToken } = await authService.login({ email, password });
    setAuthToken(nextToken);
    setStoredUserJson(JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, passwordConfirmation: string) => {
      const { user: nextUser, token: nextToken } = await authService.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setAuthToken(nextToken);
      setStoredUserJson(JSON.stringify(nextUser));
      setToken(nextToken);
      setUser(nextUser);
      return nextUser;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Even if the network call fails, clear local state so the user can
      // still "log out" of this browser.
      console.warn("Logout request failed:", getErrorMessage(err));
    } finally {
      clearAuthToken();
      setUser(null);
      setToken(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!getAuthToken()) return;
    const freshUser = await authService.getMe();
    setUser(freshUser);
    setStoredUserJson(JSON.stringify(freshUser));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      refresh,
    }),
    [user, token, isLoading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
