"use client";

import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/providers/theme-provider";

/**
 * Light/dark theme switch for the topbars. The deploy's NEXT_PUBLIC_THEME is the
 * default; flipping this persists the visitor's choice (localStorage) and the
 * inline bootstrap script re-applies it before first paint on the next load. A
 * `midnight` deploy counts as the dark side of the switch.
 */
export function ThemeToggle() {
  const { config, setTheme } = useTheme();
  const isDark = config.theme !== "light";
  return (
    <button
      type="button"
      className={buttonClasses("ghost", true, "px-[9px]")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
    >
      <Icon name={isDark ? "sun" : "moon"} size={17} />
    </button>
  );
}
