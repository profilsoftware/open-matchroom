"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LogoLockup } from "./LogoLockup";
import { ThemeToggle } from "./ThemeToggle";

export interface AdminTopbarProps {
  /** Display name + avatar initials of the signed-in admin. */
  userName?: string;
  userInitials?: string;
  onSignOut?: () => void;
  /** Disables the sign-out button while the logout request is in flight. */
  signingOut?: boolean;
}

/**
 * Admin control-panel topbar: logo + "CONTROL PANEL" tag, a "View matchroom"
 * link back to the public site, the admin chip, and sign out. The signed-in
 * user + `onSignOut` are wired by the panel layout.
 *
 * Below 720px the inline actions would overflow, so they collapse behind a
 * hamburger toggle into a dropdown panel; the theme toggle stays inline. The
 * 720px split is complementary with the hamburger (`min-[721px]:hidden`) so
 * exactly one of the two layouts shows at any width.
 */
export function AdminTopbar({
  userName = "Admin",
  userInitials = "AD",
  onSignOut,
  signingOut = false,
}: AdminTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const userChip = (
    <div className="flex items-center gap-[9px] text-[13px] text-ink-2">
      <div className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[linear-gradient(150deg,var(--brand-soft),var(--brand-strong))] font-bold text-[12px] text-white">
        {userInitials}
      </div>
      {userName}
    </div>
  );

  const viewLink = (className?: string) => (
    <Link
      className={buttonClasses("ghost", true, className)}
      href="/"
      onClick={() => setMenuOpen(false)}
    >
      <Icon name="eye" size={15} /> View matchroom
    </Link>
  );

  const signOutButton = (className?: string) => (
    <button
      type="button"
      className={buttonClasses("default", true, className)}
      onClick={onSignOut}
      disabled={signingOut}
    >
      <Icon name="logout" size={15} /> {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center gap-4 border-line border-b bg-surface px-[22px] max-[620px]:gap-2.5 max-[620px]:px-[14px]">
      <LogoLockup />
      <span className="rounded-full border border-[color-mix(in_srgb,var(--brand)_22%,transparent)] bg-brand-tint px-[10px] py-1 font-mono font-semibold text-[11px] text-brand-strong max-[620px]:hidden">
        CONTROL PANEL
      </span>
      <div className="ml-auto flex items-center gap-2.5">
        <ThemeToggle />
        {/* Actions inline on desktop; collapsed into the dropdown on mobile. */}
        <div className="flex items-center gap-2.5 max-[720px]:hidden">
          {viewLink()}
          <div className="pr-1.5">{userChip}</div>
          {signOutButton()}
        </div>
        <button
          type="button"
          className={buttonClasses("ghost", true, "px-[9px] min-[721px]:hidden")}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? "x" : "menu"} size={18} />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute inset-x-0 top-[60px] z-40 flex flex-col gap-2.5 border-line border-b bg-surface p-4 shadow-[var(--shadow-lg)] min-[721px]:hidden">
          {userChip}
          {viewLink("w-full justify-start")}
          {signOutButton("w-full justify-start")}
        </div>
      )}
    </header>
  );
}
