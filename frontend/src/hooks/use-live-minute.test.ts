import { afterEach, describe, expect, it, vi } from "vitest";

import { computeMinute } from "./use-live-minute";

afterEach(() => {
  vi.useRealTimers();
});

describe("computeMinute", () => {
  it("trusts the server minute when the clock is paused", () => {
    expect(computeMinute(45, null, 0)).toBe(45);
  });

  it("derives the minute from elapsed wall-clock time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T18:07:05Z"));
    // Clock started at kickoff with 0s banked -> 7m05s elapsed -> floor = 7.
    expect(computeMinute(0, "2026-06-10T18:00:00Z", 0)).toBe(7);
  });

  it("adds banked elapsed seconds from earlier running periods", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T18:00:00Z"));
    // 120s banked, just resumed -> 2m.
    expect(computeMinute(0, "2026-06-10T18:00:00Z", 120)).toBe(2);
  });

  it("never goes negative if the anchor is in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T17:59:00Z"));
    expect(computeMinute(0, "2026-06-10T18:00:00Z", 0)).toBe(0);
  });
});
