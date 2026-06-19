import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ACCENTS,
  getThemeConfig,
  readStoredTheme,
  resolveAccentVars,
  storeTheme,
  type ThemeConfig,
  themeBootstrapScript,
} from "./theme";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const base: ThemeConfig = { theme: "light", font: "grotesk", density: "regular", accent: "steel" };

describe("getThemeConfig", () => {
  it("defaults to steel / light / grotesk / regular with no env", () => {
    const config = getThemeConfig();
    expect(config).toMatchObject({
      theme: "light",
      font: "grotesk",
      density: "regular",
      accent: "steel",
    });
    expect(config.brand).toBeUndefined();
  });

  it("reads valid NEXT_PUBLIC_* overrides", () => {
    vi.stubEnv("NEXT_PUBLIC_THEME", "dark");
    vi.stubEnv("NEXT_PUBLIC_FONT", "archivo");
    vi.stubEnv("NEXT_PUBLIC_DENSITY", "compact");
    vi.stubEnv("NEXT_PUBLIC_ACCENT", "indigo");
    expect(getThemeConfig()).toMatchObject({
      theme: "dark",
      font: "archivo",
      density: "compact",
      accent: "indigo",
    });
  });

  it("falls back to defaults for invalid values", () => {
    vi.stubEnv("NEXT_PUBLIC_THEME", "neon");
    vi.stubEnv("NEXT_PUBLIC_ACCENT", "chartreuse");
    expect(getThemeConfig()).toMatchObject({ theme: "light", accent: "steel" });
  });

  it("builds a brand override from NEXT_PUBLIC_BRAND (soft falls back to brand)", () => {
    vi.stubEnv("NEXT_PUBLIC_BRAND", "#ff0066");
    vi.stubEnv("NEXT_PUBLIC_BRAND_STRONG", "#cc0044");
    expect(getThemeConfig().brand).toEqual({
      brand: "#ff0066",
      strong: "#cc0044",
      soft: "#ff0066",
    });
  });
});

describe("resolveAccentVars", () => {
  it("returns null for the default steel accent (keeps stylesheet defaults)", () => {
    expect(resolveAccentVars(base)).toBeNull();
  });

  it("emits CSS vars for a non-steel preset", () => {
    expect(resolveAccentVars({ ...base, accent: "indigo" })).toEqual({
      "--brand": ACCENTS.indigo.brand,
      "--brand-strong": ACCENTS.indigo.strong,
      "--brand-soft": ACCENTS.indigo.soft,
    });
  });

  it("lets an explicit brand override win over the preset", () => {
    const brand = { brand: "#111", strong: "#000", soft: "#333" };
    expect(resolveAccentVars({ ...base, brand })).toEqual({
      "--brand": "#111",
      "--brand-strong": "#000",
      "--brand-soft": "#333",
    });
  });
});

describe("readStoredTheme / storeTheme", () => {
  it("returns null on the server (no window)", () => {
    expect(readStoredTheme()).toBeNull();
  });

  it("reads a valid stored theme", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => "dark", setItem: vi.fn() } });
    expect(readStoredTheme()).toBe("dark");
  });

  it("ignores an invalid stored value", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => "neon", setItem: vi.fn() } });
    expect(readStoredTheme()).toBeNull();
  });

  it("swallows localStorage errors when reading (private mode)", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("storage denied");
        },
        setItem: vi.fn(),
      },
    });
    expect(readStoredTheme()).toBeNull();
  });

  it("swallows localStorage errors when writing (storage disabled)", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("storage denied");
        },
      },
    });
    expect(() => storeTheme("dark")).not.toThrow();
  });

  it("persists a choice via localStorage", () => {
    const setItem = vi.fn();
    vi.stubGlobal("window", { localStorage: { getItem: () => null, setItem } });
    storeTheme("midnight");
    expect(setItem).toHaveBeenCalledWith("om-theme", "midnight");
  });
});

describe("themeBootstrapScript", () => {
  it("embeds the storage key and valid modes", () => {
    const script = themeBootstrapScript();
    expect(script).toContain('"om-theme"');
    expect(script).toContain("data-theme");
    expect(script).toContain("light");
    expect(script).toContain("midnight");
  });
});
