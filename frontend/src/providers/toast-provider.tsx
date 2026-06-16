"use client";

import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react";
import { Toast } from "@/components/ui/Toast";

type ToastFn = (message: string) => void;

const ToastContext = createContext<ToastFn | null>(null);

/** Auto-dismiss delay — a 1.9s flash. */
const TOAST_MS = 1900;

/**
 * Single transient toast (only ever one is shown at a time). Exposes
 * `useToast()` so admin mutations can flash "Pushed to matchroom" etc. after a
 * successful API write.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback<ToastFn>((msg) => {
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), TOAST_MS);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {message && <Toast message={message} />}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
