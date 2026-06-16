"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect } from "react";

import { useLogout, useMe } from "@/hooks/use-auth";
import type { User } from "@/types/auth";

interface AuthContextValue {
  user: User;
  signOut: () => void;
  /** True while the logout request is in flight (disables the sign-out button). */
  signingOut: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Gates the admin panel. It probes
 * `/users/me/` on mount: while pending it renders nothing; on failure it
 * redirects to `/admin/login?next=…` (carrying the attempted path); on success
 * it exposes the current user + a `signOut` action to the panel via `useAuth`.
 *
 * The coarse cookie gate in `proxy.ts` already bounces sessionless visitors
 * before render — this is the authoritative check (a present-but-invalid `rt`
 * cookie passes the proxy but fails here).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user, isPending, isError } = useMe();
  const logout = useLogout();

  useEffect(() => {
    if (!isError) return;
    const next = encodeURIComponent(window.location.pathname);
    router.replace(`/admin/login?next=${next}`);
  }, [isError, router]);

  function signOut() {
    logout.mutate(undefined, {
      // Leave the panel whether or not the blacklist call succeeds — the local
      // session is gone either way, and the login screen is sessionless.
      onSettled: () => router.replace("/admin/login"),
    });
  }

  // Render nothing until authenticated (or while redirecting away on failure).
  if (isPending || isError || !user) return null;

  return (
    <AuthContext.Provider value={{ user, signOut, signingOut: logout.isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
