import ky, { type KyInstance, type Options } from "ky";

import { AUTH_PATHS, endpoints } from "./endpoints";

/**
 * The shared ky HTTP client. We standardise on **ky** (not axios) and implement
 * the backend's cookie-JWT **refresh semantics**: `credentials: "include"`, and an
 * `afterResponse` hook that, on a `401` for a non-auth path, runs a
 * single-flight `auth/token/refresh` then retries the original request once —
 * redirecting to the admin login on refresh failure.
 *
 * Base URL:
 * - **Browser** → same-origin. The app calls `/api/...` and Next's `rewrites()`
 *   proxy forwards to the backend, so the httpOnly `at`/`rt` cookies stay
 *   first-party (no SameSite/CORS friction).
 * - **Server (SSR)** → straight to the backend over the internal network; there
 *   is no same-origin proxy to ride during server rendering, and public reads
 *   are unauthenticated so no cookies are needed.
 */

const isServer = typeof window === "undefined";

// ky resolves a page-relative `input` (e.g. `api/matches/`) against `baseUrl`;
// the trailing slash makes it extend the base path rather than replace it.
const baseUrl = isServer
  ? `${(process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "")}/`
  : `${window.location.origin}/`;

// Single-flight refresh: concurrent 401s share one in-flight refresh call so
// they don't stampede the refresh endpoint (a shared refresh promise).
let refreshPromise: Promise<boolean> | null = null;

function refreshTokens(): Promise<boolean> {
  refreshPromise ??= ky
    // Use the base `ky` (not `http`) so the refresh call never re-enters the
    // 401 hook below; it rotates the `at`/`rt` cookies as a side effect.
    .post(endpoints.auth.refresh, { baseUrl, credentials: "include", retry: 0 })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

function redirectToLogin(): void {
  if (isServer) return;
  if (window.location.pathname.startsWith("/admin/login")) return;
  window.location.href = "/admin/login";
}

const http: KyInstance = ky.create({
  baseUrl,
  credentials: "include",
  // The forced retry below needs a non-zero limit; 401 is not in ky's default
  // auto-retry status codes, so only our explicit refresh retry fires.
  retry: { limit: 1 },
  timeout: 30000,
  // Public SSR reads revalidate every 30s; services can override per call.
  next: { revalidate: 30 },
  hooks: {
    afterResponse: [
      async ({ request, response, retryCount }) => {
        // Only the first 401 on a non-auth path, browser-side, triggers refresh.
        if (response.status !== 401 || retryCount > 0 || isServer) return;
        if (AUTH_PATHS.some((path) => request.url.includes(path))) return;

        const refreshed = await refreshTokens();
        if (!refreshed) {
          redirectToLogin();
          return; // surface the original 401
        }
        // Cookies are rotated; retry the original request immediately once.
        return ky.retry({ code: "TOKEN_REFRESHED", delay: 0 });
      },
    ],
  },
});

export function get<T>(url: string, options?: Options): Promise<T> {
  return http.get(url, options).json<T>();
}

export function post<T>(url: string, options?: Options): Promise<T> {
  return http.post(url, options).json<T>();
}

export function put<T>(url: string, options?: Options): Promise<T> {
  return http.put(url, options).json<T>();
}

/**
 * Multipart variants for file uploads (e.g. a team logo). Pass a `FormData`
 * body — ky lets the browser set the `multipart/form-data` boundary header, so
 * we must **not** set `Content-Type` ourselves. The backend's
 * `CamelCaseMultiPartParser` underscoreizes the field names, so the body uses
 * the same camelCase keys as our JSON payloads.
 */
export function postForm<T>(url: string, body: FormData, options?: Options): Promise<T> {
  return http.post(url, { ...options, body }).json<T>();
}

export function putForm<T>(url: string, body: FormData, options?: Options): Promise<T> {
  return http.put(url, { ...options, body }).json<T>();
}

/**
 * DELETE returns the raw `Response` — DRF replies `204 No Content`, so there is
 * no JSON body to parse (calling `.json()` would throw on the empty payload).
 */
export function destroy(url: string, options?: Options): Promise<Response> {
  return http.delete(url, options);
}

export { http };
