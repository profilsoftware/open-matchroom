import { cn } from "@/lib/cn";
import { mediaPath } from "@/lib/media";

/** Minimal shape an emblem needs — `TeamBrief` (types/team.ts) is a superset. */
export interface EmblemTeam {
  name: string;
  abbreviation?: string | null;
  color?: string | null;
  /** Uploaded club logo URL (normalised to same-origin via `mediaPath`). */
  logo?: string | null;
}

export interface EmblemProps {
  team: EmblemTeam;
  size?: number;
  radius?: number;
  className?: string;
}

/**
 * Club emblem. When a logo is set it renders the logo on its own — transparent,
 * no tile or background. Otherwise it falls back to a placeholder: the club
 * initials on a colour gradient. Initials come from the abbreviation (or the
 * club name when unset); the gradient uses the brand colour when no crest colour
 * is set.
 */
export function Emblem({ team, size = 84, radius = 18, className }: EmblemProps) {
  const logo = mediaPath(team.logo);

  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- proxied /media URL, no next/image config
      <img
        src={logo}
        alt={team.name}
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: "contain", display: "block" }}
      />
    );
  }

  const c = team.color || "var(--brand)";
  const initials =
    team.abbreviation ||
    team.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
  return (
    <div
      className={cn(
        "grid place-items-center font-bold font-display text-white tracking-[-0.02em] shadow-[0_8px_22px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.14)]",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: size * 0.36,
        background: `linear-gradient(150deg, ${c}, color-mix(in srgb, ${c} 62%, #000))`,
      }}
    >
      {initials}
    </div>
  );
}
