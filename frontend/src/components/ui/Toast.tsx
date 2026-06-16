import { Icon } from "@/components/ui/Icon";

export interface ToastProps {
  message: string;
}

/**
 * Presentational toast (`.toast`) — the bottom-centre confirmation ("Pushed to
 * matchroom", "Team created"). Visibility/auto-dismiss is owned by the
 * ToastProvider (providers/toast-provider.tsx); this just renders markup.
 */
export function Toast({ message }: ToastProps) {
  return (
    <div
      className="fixed bottom-[22px] left-1/2 z-[80] flex -translate-x-1/2 animate-[toastin_0.3s_ease] items-center gap-[9px] rounded-md bg-navy px-[18px] py-[11px] font-semibold text-[13.5px] text-white shadow-[var(--shadow-lg)]"
      role="status"
      aria-live="polite"
    >
      <Icon name="check" size={16} /> {message}
    </div>
  );
}
