"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import {
  readStoredTheme,
  resolveAccentVars,
  storeTheme,
  type ThemeConfig,
  type ThemeMode,
} from "@/lib/theme";

interface ThemeContextValue {
  config: ThemeConfig;
  setConfig: (next: ThemeConfig) => void;
  /** Switch the light/dark/midnight mode and persist the visitor's choice. */
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ACCENT_VARS = ["--brand", "--brand-strong", "--brand-soft"] as const;

/**
 * White-label theme applier. The root layout renders the deploy default
 * `data-theme`/`data-font`/`data-density` + accent vars on <html> server-side,
 * and a blocking inline script overrides `data-theme` with the visitor's saved
 * choice before first paint (no FOUC). This provider seeds its state from that
 * same saved choice, re-asserts the attributes on the client, and exposes
 * `setTheme` so the light/dark switch re-themes without a reload.
 */
export function ThemeProvider({
  config: initial,
  children,
}: {
  config: ThemeConfig;
  children: ReactNode;
}) {
  // Lazy init from the persisted choice so the toggle reflects the theme the
  // inline script already applied. Renders no theme-dependent markup, so the
  // server/client divergence here is safe (no hydration mismatch).
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const stored = readStoredTheme();
    return stored ? { ...initial, theme: stored } : initial;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", config.theme);
    root.setAttribute("data-font", config.font);
    root.setAttribute("data-density", config.density);
    const vars = resolveAccentVars(config);
    for (const key of ACCENT_VARS) {
      if (vars) root.style.setProperty(key, vars[key]);
      else root.style.removeProperty(key);
    }
  }, [config]);

  function setTheme(mode: ThemeMode) {
    storeTheme(mode);
    setConfig((current) => ({ ...current, theme: mode }));
  }

  return (
    <ThemeContext.Provider value={{ config, setConfig, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
