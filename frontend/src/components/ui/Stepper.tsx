import { cn } from "@/lib/cn";

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  "aria-label"?: string;
}

/**
 * The `.stepper` (minus / value / plus) — used for score and minute steppers in
 * the admin live console. Clamps to [min, max]; the glyphs are bare −/+ text
 * (styled by `.stepper button`).
 */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  className,
  ...rest
}: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const stepBtn =
    "grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-line-strong bg-surface text-[18px] font-bold text-brand";
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="group"
      aria-label={rest["aria-label"]}
    >
      <button
        type="button"
        className={stepBtn}
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - step))}
      >
        −
      </button>
      <span className="min-w-[34px] text-center font-bold font-score text-[30px]">{value}</span>
      <button
        type="button"
        className={stepBtn}
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + step))}
      >
        +
      </button>
    </div>
  );
}
