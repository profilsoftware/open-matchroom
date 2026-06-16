import { AdminTabs } from "@/components/admin/AdminTabs";
import { TeamsAdmin } from "@/components/admin/TeamsAdmin";

/**
 * Admin Teams section (`/admin/teams`). The `.admin` shell + section tabs are
 * rendered per page (the Matches section mirrors this); `TeamsAdmin`
 * is the client island that owns selection + the editor. Wrapped by the
 * `(panel)` layout's auth gate, so it only renders for a signed-in admin.
 */
export default function AdminTeamsPage() {
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
      <TeamsAdmin />
    </div>
  );
}
