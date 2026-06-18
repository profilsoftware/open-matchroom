import type { Metadata, Viewport } from "next";
import {
  Archivo,
  Barlow_Condensed,
  IBM_Plex_Sans,
  JetBrains_Mono,
  Manrope,
  Space_Grotesk,
} from "next/font/google";
import type { CSSProperties } from "react";
import "./globals.css";
import { getThemeConfig, resolveAccentVars, themeBootstrapScript } from "@/lib/theme";
import { Providers } from "@/providers";

// Six font families map onto switchable semantic tokens (--font-display /
// --font-body / --font-score / --font-mono). We self-host each family via
// next/font and expose it as a CSS variable; the semantic tokens + their
// [data-font] white-label variants are wired in globals.css.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const fontVariables = [
  spaceGrotesk.variable,
  manrope.variable,
  archivo.variable,
  ibmPlexSans.variable,
  barlowCondensed.variable,
  jetbrainsMono.variable,
].join(" ");

export const metadata: Metadata = {
  title: "OpenMatchroom - live match center",
  description: "Open-source, white-label live football match-center.",
};

// Separate `viewport` export (Next 16): viewport-fit=cover; theme-color is the
// hero navy.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16273c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // White-label theme resolved from NEXT_PUBLIC_* env (default steel).
  // Rendered as <html> attributes server-side so the first paint is themed
  // (no FOUC); <ThemeProvider> re-asserts them on the client for runtime swaps.
  const themeConfig = getThemeConfig();
  const accentVars = resolveAccentVars(themeConfig);
  return (
    <html
      lang="en"
      className={fontVariables}
      data-theme={themeConfig.theme}
      data-font={themeConfig.font}
      data-density={themeConfig.density}
      style={accentVars ? (accentVars as CSSProperties) : undefined}
      // The inline script below overrides data-theme with the visitor's saved
      // choice before hydration, so the attribute may differ from the SSR value.
      suppressHydrationWarning
    >
      <head>
        {/* Apply a persisted light/dark choice before first paint (no flash).
            The script is a static string built only from our own constants (no
            user input), so it is not an XSS vector. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted static theme bootstrap, no user input */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript() }} />
      </head>
      <body>
        <Providers themeConfig={themeConfig}>{children}</Providers>
      </body>
    </html>
  );
}
