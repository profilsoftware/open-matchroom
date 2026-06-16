"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

interface AdminTab {
  href: string;
  label: string;
  icon: IconName;
  /** Whether the section's route exists yet. */
  ready: boolean;
}

const TABS: AdminTab[] = [
  { href: "/admin/teams", label: "Teams", icon: "users", ready: true },
  { href: "/admin/matches", label: "Matches", icon: "calendar", ready: true },
];

/**
 * The admin section switcher (`.admin-tabs`). Each section is a route, so a
 * ready tab is a `<Link>` with the active pill driven by the pathname (mirrors
 * `PublicTopbar`). A not-yet-built section renders as a disabled tab until it
 * ships.
 */
export function AdminTabs() {
  const pathname = usePathname();
  const tab =
    "flex items-center gap-[7px] rounded-[8px] border-0 bg-transparent px-[15px] py-2 text-[13px] font-semibold no-underline";
  return (
    <nav
      className="ml-auto flex gap-1 rounded-md border border-line bg-surface p-1 max-[620px]:ml-0 max-[620px]:w-full max-[620px]:overflow-x-auto"
      aria-label="Admin sections"
    >
      {TABS.map((item) =>
        item.ready ? (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              tab,
              pathname.startsWith(item.href) ? "bg-brand text-white" : "text-ink-2",
            )}
          >
            <Icon name={item.icon} size={15} /> {item.label}
          </Link>
        ) : (
          <button
            key={item.href}
            type="button"
            disabled
            title="Available soon"
            className={cn(tab, "text-ink-2 disabled:cursor-not-allowed disabled:opacity-45")}
          >
            <Icon name={item.icon} size={15} /> {item.label}
          </button>
        ),
      )}
    </nav>
  );
}
