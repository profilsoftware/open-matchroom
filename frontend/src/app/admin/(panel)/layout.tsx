"use client";

import type { ReactNode } from "react";

import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AuthProvider, useAuth } from "@/providers/auth-provider";

/** Two-letter avatar initials from a display name ("Coastal Admin" → "CA"). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** The chrome around the gated panel — only rendered once `AuthProvider` has a
 *  user, so `useAuth()` is always populated here. */
function PanelChrome({ children }: { children: ReactNode }) {
  const { user, signOut, signingOut } = useAuth();
  return (
    <>
      <AdminTopbar
        userName={user.name || user.email}
        userInitials={initials(user.name || user.email)}
        onSignOut={signOut}
        signingOut={signingOut}
      />
      {children}
    </>
  );
}

/**
 * Layout for the gated admin panel (`/admin`, `/admin/teams`, `/admin/matches`).
 * It lives in the `(panel)` route group so the sibling `/admin/login` page —
 * which must stay sessionless — is *not* wrapped by the auth gate. `AuthProvider`
 * probes `/users/me/` and only renders its children once authenticated.
 */
export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PanelChrome>{children}</PanelChrome>
    </AuthProvider>
  );
}
