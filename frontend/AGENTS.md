<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Testing

Unit tests run on **Vitest** (`pnpm test`, `pnpm test:coverage`). Scope is **pure logic only** —
the helpers in `lib/` and extracted hook math (e.g. `computeMinute`). Tests are colocated as
`*.test.ts` and use the `node` environment (no jsdom). We deliberately **do not** test components
or the visual layer; mirror that when adding tests — put the testable logic in `lib/` (or extract a
pure function from a hook) and test that, rather than rendering UI.
