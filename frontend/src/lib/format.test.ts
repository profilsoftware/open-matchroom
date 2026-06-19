import { describe, expect, it } from "vitest";

import {
  formatMatchDate,
  formatMatchTime,
  isLive,
  isScheduled,
  joinKickoff,
  splitKickoff,
  statusLabel,
} from "./format";

// Wed 10 Jun 2026, 18:00 UTC. The backend stores kickoff as a UTC-aware ISO and
// every formatter is pinned to UTC, so the output is timezone-stable.
const KICKOFF = "2026-06-10T18:00:00Z";

describe("formatMatchDate", () => {
  it("renders an en-GB short date in UTC", () => {
    // Assert the meaningful parts, not the locale's separator punctuation
    // (which varies across Node/ICU versions, e.g. "Wed 10 Jun" vs "Wed, 10 Jun").
    const formatted = formatMatchDate(KICKOFF);
    expect(formatted).toContain("Wed");
    expect(formatted).toContain("10");
    expect(formatted).toContain("Jun");
  });

  it("returns an empty string for a null kickoff", () => {
    expect(formatMatchDate(null)).toBe("");
  });
});

describe("formatMatchTime", () => {
  it("renders a 24h time in UTC", () => {
    expect(formatMatchTime(KICKOFF)).toBe("18:00");
  });

  it("returns an empty string for a null kickoff", () => {
    expect(formatMatchTime(null)).toBe("");
  });
});

describe("splitKickoff / joinKickoff", () => {
  it("splits an ISO datetime into UTC date + time inputs", () => {
    expect(splitKickoff(KICKOFF)).toEqual({ date: "2026-06-10", time: "18:00" });
  });

  it("returns empty inputs for a null kickoff", () => {
    expect(splitKickoff(null)).toEqual({ date: "", time: "" });
  });

  it("joins date + time back into a UTC ISO datetime", () => {
    expect(joinKickoff("2026-06-10", "18:00")).toBe("2026-06-10T18:00:00.000Z");
  });

  it("returns null when either input is missing", () => {
    expect(joinKickoff("", "18:00")).toBeNull();
    expect(joinKickoff("2026-06-10", "")).toBeNull();
  });

  it("round-trips split -> join", () => {
    const { date, time } = splitKickoff(KICKOFF);
    expect(joinKickoff(date, time)).toBe("2026-06-10T18:00:00.000Z");
  });
});

describe("statusLabel", () => {
  it("labels each status", () => {
    expect(statusLabel("LIVE")).toBe("Live");
    expect(statusLabel("FINISHED")).toBe("Full time");
    expect(statusLabel("SCHEDULED")).toBe("Upcoming");
  });
});

describe("isLive / isScheduled", () => {
  it("reflects the status", () => {
    expect(isLive("LIVE")).toBe(true);
    expect(isLive("FINISHED")).toBe(false);
    expect(isScheduled("SCHEDULED")).toBe(true);
    expect(isScheduled("LIVE")).toBe(false);
  });
});
