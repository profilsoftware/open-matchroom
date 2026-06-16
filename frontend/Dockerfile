# Local development image for the Next.js frontend.
# The compose service bind-mounts ./frontend over /app and keeps node_modules
# in an anonymous volume, so this image only needs the toolchain + deps.
FROM node:22-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Pin pnpm via corepack to match the project (pnpm 10 workspace-config schema, lockfile 9.0).
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Install dependencies first for better layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the source (overlaid by the bind mount during dev).
COPY . .

EXPOSE 3000

# Bind to 0.0.0.0 so the dev server is reachable from the host.
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]
