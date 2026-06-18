/**
 * White-label theme config: config-driven, NOT a runtime tweaks panel.
 *
 * Theming is resolved from NEXT_PUBLIC_* env at build time (default = steel /
 * light) and applied as `data-theme` / `data-font` / `data-density` attributes
 * plus accent CSS vars on <html>. The token swaps live in globals.css.
 */

export type ThemeMode = "light" | "dark" | "midnight";
export type FontChoice = "grotesk" | "archivo" | "condensed";
export type Density = "regular" | "compact";

export interface Accent {
  name: string;
  brand: string;
  strong: string;
  soft: string;
}

/** Built-in accent presets; choose one via NEXT_PUBLIC_ACCENT. */
export const ACCENTS = {
  steel: { name: "Steel", brand: "#3b6fa6", strong: "#2f5d8e", soft: "#7e97c8" },
  indigo: { name: "Indigo", brand: "#4f5bd5", strong: "#3f49b0", soft: "#9aa2e8" },
  teal: { name: "Teal", brand: "#0f8a8a", strong: "#0c6f6f", soft: "#67c2c2" },
  ember: { name: "Ember", brand: "#c2522b", strong: "#9e3f20", soft: "#e0a285" },
} as const satisfies Record<string, Accent>;

export type AccentKey = keyof typeof ACCENTS;

export interface ThemeConfig {
  theme: ThemeMode;
  font: FontChoice;
  density: Density;
  accent: AccentKey;
  /** Optional fully-custom brand overrides (win over the accent preset). */
  brand?: { brand: string; strong: string; soft: string };
}

const THEME_MODES: readonly ThemeMode[] = ["light", "dark", "midnight"];
const FONTS: readonly FontChoice[] = ["grotesk", "archivo", "condensed"];
const DENSITIES: readonly Density[] = ["regular", "compact"];

function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/**
 * Resolve the deploy's theme from NEXT_PUBLIC_* env. NEXT_PUBLIC vars are
 * inlined at build, so this is safe to call on both server and client and
 * returns the same value (no hydration drift). Defaults = steel light.
 */
export function getThemeConfig(): ThemeConfig {
  const accent = pick<AccentKey>(
    process.env.NEXT_PUBLIC_ACCENT,
    Object.keys(ACCENTS) as AccentKey[],
    "steel",
  );
  const brandEnv = process.env.NEXT_PUBLIC_BRAND;
  const brand = brandEnv
    ? {
        brand: brandEnv,
        strong: process.env.NEXT_PUBLIC_BRAND_STRONG ?? brandEnv,
        soft: process.env.NEXT_PUBLIC_BRAND_SOFT ?? brandEnv,
      }
    : undefined;

  return {
    theme: pick(process.env.NEXT_PUBLIC_THEME, THEME_MODES, "light"),
    font: pick(process.env.NEXT_PUBLIC_FONT, FONTS, "grotesk"),
    density: pick(process.env.NEXT_PUBLIC_DENSITY, DENSITIES, "regular"),
    accent,
    brand,
  };
}

/**
 * The accent colours to set inline on <html>, or `null` to keep the stylesheet
 * defaults. The default steel accent sets NO inline vars, so the [data-theme]
 * dark/midnight `--brand` overrides apply. A non-steel accent (or an explicit
 * brand override) wins over everything (inline > sheet).
 */
export function resolveAccentVars(config: ThemeConfig): Record<string, string> | null {
  const a = config.brand ?? (config.accent !== "steel" ? ACCENTS[config.accent] : null);
  if (!a) return null;
  return {
    "--brand": a.brand,
    "--brand-strong": a.strong,
    "--brand-soft": a.soft,
  };
}

/* ------------------------------------------------------------------ *
 * Per-visitor theme preference (light/dark switch).
 *
 * The deploy's NEXT_PUBLIC_THEME is the default; once a visitor flips the
 * switch we persist their choice here and re-apply it before first paint via
 * `themeBootstrapScript()` (so a saved dark choice doesn't flash light).
 * ------------------------------------------------------------------ */

export const THEME_STORAGE_KEY = "om-theme";

/** The visitor's saved theme, or `null` (server, no choice yet, bad value). */
export function readStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return v && (THEME_MODES as readonly string[]).includes(v) ? (v as ThemeMode) : null;
  } catch {
    return null;
  }
}

/** Persist the visitor's theme choice (no-op if localStorage is unavailable). */
export function storeTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* private mode / storage disabled — the choice just won't persist */
  }
}

/**
 * Blocking inline script for <head>: applies a persisted theme to <html>
 * before the browser paints, so a saved dark choice doesn't flash light. Built
 * from the same key + valid modes as the helpers above. See the Next.js guide
 * "Preventing flash before hydration".
 */
export function themeBootstrapScript(): string {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY,
  )});if(t&&${JSON.stringify(
    THEME_MODES,
  )}.indexOf(t)>-1)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
}
