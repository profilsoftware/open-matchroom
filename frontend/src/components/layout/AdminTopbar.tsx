"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LogoLockup } from "./LogoLockup";

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
 */
export function AdminTopbar({
  userName = "Admin",
  userInitials = "AD",
  onSignOut,
  signingOut = false,
}: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center gap-4 border-line border-b bg-surface px-[22px]">
      <LogoLockup />
      <span className="rounded-full border border-[color-mix(in_srgb,var(--brand)_22%,transparent)] bg-brand-tint px-[10px] py-1 font-mono font-semibold text-[11px] text-brand-strong">
        CONTROL PANEL
      </span>
      <div className="ml-auto flex items-center gap-2.5">
        <Link className={buttonClasses("ghost", true)} href="/">
          <Icon name="eye" size={15} /> View matchroom
        </Link>
        <div className="flex items-center gap-[9px] pr-1.5 text-[13px] text-ink-2">
          <div className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[linear-gradient(150deg,var(--brand-soft),var(--brand-strong))] font-bold text-[12px] text-white">
            {userInitials}
          </div>{" "}
          {userName}
        </div>
        <button
          type="button"
          className={buttonClasses("default", true)}
          onClick={onSignOut}
          disabled={signingOut}
        >
          <Icon name="logout" size={15} /> {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
}
