import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "default" | "primary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Compact size. */
  sm?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border px-4 py-2.5 text-[13.5px] font-semibold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-45";

const VARIANTS: Record<ButtonVariant, string> = {
  default: "border-line-strong bg-surface text-ink hover:border-brand-soft",
  primary: "border-brand bg-brand text-white hover:border-brand-strong hover:bg-brand-strong",
  ghost: "border-transparent bg-transparent text-ink-2 hover:bg-surface-2",
  danger:
    "border-[color-mix(in_srgb,var(--danger)_30%,var(--line))] text-danger hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]",
};

const SM = "px-[11px] py-[7px] text-[12.5px]";

/**
 * Button styling as a class string — for the cases that need button looks on a
 * non-`<button>` element (e.g. a `next/link` `<Link>`).
 */
export function buttonClasses(variant: ButtonVariant = "default", sm = false, className?: string) {
  return cn(BASE, VARIANTS[variant], sm && SM, className);
}

/**
 * The button primitive with its variants. This is a presentational primitive —
 * it has no hooks, so it is usable from both server and client trees; only the
 * caller passing an `onClick` closure needs to be a Client Component.
 */
export function Button({
  variant = "default",
  sm,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, sm, className)} {...props} />;
}
