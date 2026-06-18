import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "live" | "finished" | "scheduled";

const DEFAULT_LABEL: Record<BadgeVariant, string> = {
  live: "LIVE",
  finished: "Finished",
  scheduled: "Soon",
};

export interface BadgeProps {
  variant: BadgeVariant;
  children?: ReactNode;
  className?: string;
}

const BASE =
  "inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[11px] font-bold tracking-[0.03em]";

const VARIANTS: Record<BadgeVariant, string> = {
  live: "bg-live-tint text-live",
  finished: "bg-surface-2 text-muted",
  scheduled: "bg-brand-tint text-brand-strong",
};

/**
 * Status pill, used in fixtures rows and admin lists. The `live` variant carries
 * a pulsing dot. Pass children to override the default per-variant label.
 */
export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn(BASE, VARIANTS[variant], className)}>
      {variant === "live" && (
        <span className="h-1.5 w-1.5 animate-[pulse_1.6s_infinite] rounded-full bg-live" />
      )}
      {children ?? DEFAULT_LABEL[variant]}
    </span>
  );
}
