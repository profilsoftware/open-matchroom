import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Pure-logic unit tests only (lib/* + extracted hook math). No component or
// visual-layer tests — those are intentionally out of scope, so the default
// `node` environment (no jsdom) is enough and keeps the run fast.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Measure the pure-logic surface we comprehensively unit-test, so the %
      // reflects intent. `cn.ts` is a trivial clsx+tailwind-merge wrapper we
      // intentionally don't test; React hooks/components are out of scope (the
      // `computeMinute` test still runs and guards that helper, but the hook
      // file isn't part of the measured denominator).
      include: ["src/lib/**"],
      exclude: ["src/lib/cn.ts"],
    },
  },
});
