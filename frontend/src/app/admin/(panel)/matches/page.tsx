import { AdminTabs } from "@/components/admin/AdminTabs";
import { MatchesAdmin } from "@/components/admin/MatchesAdmin";

/**
 * Admin Matches section (`/admin/matches`). Mirrors the Teams page: the `.admin`
 * shell + section tabs are rendered here, and `MatchesAdmin` is the client island
 * that owns fixture selection + the editor (Details / Lineups / Live / Stats).
 * Wrapped by the `(panel)` layout's auth gate, so it only renders for an admin.
 */
export default function AdminMatchesPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-[22px] pt-4 pb-[70px] max-[620px]:px-[14px]">
      <div className="mb-[18px] flex flex-wrap items-end gap-3.5">
        <div>
          <h1 className="m-0 font-bold font-display text-[24px] tracking-[-0.02em]">
            Control panel
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">
            Manage teams, squads, fixtures and live match data.
          </p>
        </div>
        <AdminTabs />
      </div>
      <MatchesAdmin />
    </div>
  );
}
