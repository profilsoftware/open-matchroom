import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Admin route gate. In Next.js 16 the `middleware` file convention is deprecated
 * and renamed to **`proxy`** (same `NextRequest`/`NextResponse` API) — see
 * `node_modules/next/dist/docs/.../proxy.md`. This runs before render and bounces
 * sessionless visitors away from `/admin/*` so protected pages never flash.
 *
 * It gates on the **`rt`** (refresh) cookie, not `at`: dj-rest-auth gives the
 * access cookie a 5-minute max-age but the refresh cookie a 24-hour one (backend
 * `SIMPLE_JWT`), so `at` is routinely absent on a live session while `rt`
 * reflects "is there a session at all". Presence ≠ validity — a stale `rt` still
 * passes here and is caught by the authoritative `/users/me/` probe in
 * `AuthProvider`, which is why we deliberately do **not** redirect an
 * already-"signed-in" visitor away from the login page (that would loop a stale
 * cookie between proxy and provider).
 */

const SESSION_COOKIE = "rt";
const LOGIN_PATH = "/admin/login";

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const onLoginPage = pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);
  if (onLoginPage) return NextResponse.next();

  if (!hasSession) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // `:path*` is zero-or-more, so this also matches the bare `/admin`; the API
  // proxy (`/api/*` rewrite) is untouched. Matchers must be static literals.
  matcher: ["/admin", "/admin/:path*"],
};
