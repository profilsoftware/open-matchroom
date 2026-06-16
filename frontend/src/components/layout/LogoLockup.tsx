import { LogoMark } from "./LogoMark";

/** Logo mark + "OpenMatchroom" wordmark with a neutral tagline. */
export function LogoLockup() {
  return (
    <div className="flex items-center gap-[11px]">
      <LogoMark size={34} />
      <div>
        <div className="font-bold font-display text-[16px] text-ink leading-[1.05] tracking-[-0.015em]">
          Open<b className="text-brand">Matchroom</b>
        </div>
        <div className="mt-px text-[9.5px] text-muted uppercase tracking-[0.18em]">
          live match center
        </div>
      </div>
    </div>
  );
}
