"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

/**
 * react-query client. One client per browser session, created
 * lazily in state so it survives re-renders but is never shared across requests
 * during SSR. Public reads are SSR'd + server-revalidated, so the client
 * `staleTime` is generous; the match-center live poll sets its own
 * `refetchInterval` while `status === "LIVE"`.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
