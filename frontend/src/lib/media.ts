/**
 * Normalise a media URL to a same-origin path.
 *
 * DRF returns **absolute** media URLs built from the request host
 * (`http://backend:8000/media/...` under `make up`, `https://host/media/...` in
 * prod). Only the prod/public host is browser-reachable; the docker-internal one
 * is not. We strip the host and keep just the path (`/media/...`) so the image
 * loads same-origin — proxied to the backend by `next.config.ts` in dev and
 * served by Traefik in prod (mirroring how `/api` already works).
 *
 * `blob:`/`data:` URLs (e.g. an unsaved upload preview) and already-relative
 * paths are returned untouched.
 */
export function mediaPath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return `${parsed.pathname}${parsed.search}`;
    }
    return url;
  } catch {
    // Not absolute (no protocol) — already a relative path.
    return url;
  }
}
