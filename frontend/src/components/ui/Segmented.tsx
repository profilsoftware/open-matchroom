import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}

/**
 * The `.seg` segmented control (used for status toggles, side pickers, etc. in
 * the admin). Controlled — the consuming Client Component owns
 * `value`/`onChange`.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  ...rest
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex gap-[2px] rounded-[9px] border border-line bg-surface-2 p-[3px]",
        className,
      )}
      role="group"
      aria-label={rest["aria-label"]}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={cn(
            "rounded-[6px] border-0 bg-transparent px-3 py-1.5 font-semibold text-[12.5px]",
            value === o.value ? "bg-brand text-white" : "text-ink-2",
          )}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
