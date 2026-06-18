import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names: clsx for conditional composition, tailwind-merge to
 * de-dupe conflicting Tailwind utilities. Authored semantic classes (e.g.
 * `btn primary`) pass straight through untouched.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
