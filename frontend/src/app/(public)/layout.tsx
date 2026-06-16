import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { PublicTopbar } from "@/components/layout/PublicTopbar";

/**
 * Public shell: sticky topbar, page body, site footer — the `.app`
 * column (min-height 100vh, footer pinned via margin-top:auto). Wraps the
 * match center (`/`, `/matches/[pid]`) and fixtures (`/fixtures`).
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicTopbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
