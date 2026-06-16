import type { ReactNode } from "react";
import type { ThemeConfig } from "@/lib/theme";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

/**
 * Composes the app-wide providers: Query wraps Theme + Toast.
 * The AuthProvider slots in under QueryProvider so it can use hooks.
 *
 * This is a Server Component that nests the Client provider boundaries; the
 * resolved `themeConfig` is threaded in from the root layout so it is computed
 * once and matches the server-rendered <html> attributes.
 */
export function Providers({
  themeConfig,
  children,
}: {
  themeConfig: ThemeConfig;
  children: ReactNode;
}) {
  return (
    <QueryProvider>
      <ThemeProvider config={themeConfig}>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
