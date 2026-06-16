"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Admin landing (`/admin`) → redirect to the Matches section (the primary admin
 * surface). The redirect runs inside the `(panel)` auth gate, so
 * it only fires for a signed-in admin.
 */
export default function AdminHomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/matches");
  }, [router]);
  return null;
}
