"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { resolveAccentVars, type ThemeConfig } from "@/lib/theme";

interface ThemeContextValue {
  config: ThemeConfig;
  setConfig: (next: ThemeConfig) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ACCENT_VARS = ["--brand", "--brand-strong", "--brand-soft"] as const;

/**
 * White-label theme applier (config-driven, no runtime tweaks UI). The root
 * layout already renders the initial `data-theme`/`data-font`/`data-density` +
 * accent vars on <html> server-side (no FOUC); this re-asserts them on the
 * client and exposes `setConfig` so a future runtime switch (or per-tenant
 * override) re-themes without a reload.
 */
export function ThemeProvider({
  config: initial,
  children,
}: {
  config: ThemeConfig;
  children: ReactNode;
}) {
  const [config, setConfig] = useState<ThemeConfig>(initial);

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

  return <ThemeContext.Provider value={{ config, setConfig }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
