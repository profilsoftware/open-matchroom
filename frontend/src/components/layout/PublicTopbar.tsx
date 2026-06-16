"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useHasLiveMatch } from "@/hooks/use-matchroom";
import { cn } from "@/lib/cn";
import { LogoLockup } from "./LogoLockup";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Match center also owns /matches/[pid]; Fixtures owns /fixtures. */
  match: (pathname: string) => boolean;
  /** Show the live pulse on this item when a match is in progress. */
  live?: boolean;
}

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Match center",
    icon: "broadcast",
    match: (p) => p === "/" || p.startsWith("/matches"),
    live: true,
  },
  {
    href: "/fixtures",
    label: "Fixtures",
    icon: "calendar",
    match: (p) => p.startsWith("/fixtures"),
  },
];

/**
 * Public topbar: logo lockup + the Match center / Fixtures nav segment. These
 * are routes, with the active pill driven by the pathname.
 *
 * The "live" pulse on Match center is data-dependent: `useHasLiveMatch` polls
 * for any in-progress fixture and lights the same red pulse used across the
 * app. It pauses while the tab is hidden.
 */
export function PublicTopbar() {
  const pathname = usePathname();
  const hasLive = useHasLiveMatch();
  return (
    <header className="topbar">
      <LogoLockup />
      <nav className="ml-auto flex gap-[3px] rounded-full border border-line bg-surface-2 p-[3px]">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-[7px] rounded-full border-0 bg-transparent px-4 py-[7px] font-semibold text-[13px] no-underline transition-colors",
              item.match(pathname)
                ? "bg-brand text-white shadow-[var(--shadow-sm)]"
                : "text-ink-2 hover:text-ink",
            )}
          >
            <Icon name={item.icon} size={16} />
            <span className="max-[880px]:hidden">{item.label}</span>
            {item.live && hasLive && (
              <span
                className="h-[7px] w-[7px] animate-[pulse_1.6s_infinite] rounded-full bg-live shadow-[0_0_0_0_rgba(226,58,58,0.6)]"
                aria-label="A match is live"
              />
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}
