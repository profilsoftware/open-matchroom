import type { NextConfig } from "next";

/**
 * API proxy (FD4). The browser calls same-origin `/api/...`; Next rewrites those
 * to the backend so the httpOnly `at`/`rt` cookies stay first-party (no
 * SameSite/CORS friction). `INTERNAL_API_URL` is the server-side backend address
 * (the docker service `http://backend:8000`); it defaults to localhost for a
 * bare `pnpm dev`. SSR reads talk to the backend directly (see services/http.ts),
 * so this rewrite only serves browser/client requests.
 *
 * DRF requires the trailing slash, but a `:path*` rewrite drops it. So the
 * source/destination both carry an explicit trailing slash (every endpoint in
 * `services/endpoints.ts` ends with `/`), and `skipTrailingSlashRedirect` stops
 * Next from 308-stripping it before the rewrite can match.
 *
 * `/media/...` (uploaded logos/photos) is proxied the same way so media stays
 * same-origin in the browser — mirroring production, where Traefik serves
 * `/media` on the public host. The serializer returns relative media URLs, so
 * the same `<img src="/media/...">` resolves in both dev and prod.
 */
const backend = (process.env.INTERNAL_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*/",
        destination: `${backend}/api/:path*/`,
      },
      {
        source: "/media/:path*",
        destination: `${backend}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
