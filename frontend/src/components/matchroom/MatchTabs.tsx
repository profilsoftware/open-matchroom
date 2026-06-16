import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export type MatchTab = "lineup" | "live" | "stats";

const TABS: { id: MatchTab; label: string; icon: IconName }[] = [
  { id: "lineup", label: "Lineup", icon: "shirt" },
  { id: "live", label: "Live", icon: "live" },
  { id: "stats", label: "Statistics", icon: "stats" },
];

/**
 * The matchroom's `.tabs` segmented control (Lineup / Live / Statistics).
 * Controlled — the `MatchroomView` client island owns the active tab. Rendered
 * inside that client boundary, so it ships to the client without its own
 * directive (standard tabbed layout only; split/ticker variants are not shipped).
 */
export function MatchTabs({
  active,
  onChange,
}: {
  active: MatchTab;
  onChange: (tab: MatchTab) => void;
}) {
  return (
    <div
      className="tabs mt-[22px] mb-[18px] flex gap-1 rounded-[14px] border border-line bg-surface p-[5px] shadow-[var(--shadow-sm)]"
      role="tablist"
      aria-label="Match center sections"
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-[10px] border-0 bg-transparent p-[11px] font-semibold text-[14px] transition-colors",
            active === t.id
              ? "bg-brand text-white"
              : "text-ink-2 hover:bg-surface-2 hover:text-ink",
          )}
          onClick={() => onChange(t.id)}
        >
          <Icon name={t.icon} size={16} />
          <span className="max-[620px]:text-[13px]">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
