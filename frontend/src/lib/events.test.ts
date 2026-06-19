import { describe, expect, it } from "vitest";

import { EVENT_TYPES, evMeta, POSITION_LABELS, POSITIONS } from "./events";

describe("evMeta", () => {
  it("maps a goal to its display metadata", () => {
    expect(evMeta("GOAL")).toMatchObject({ label: "Goal", icon: "ball", major: true });
  });

  it("marks a yellow card as a non-major chip", () => {
    expect(evMeta("YELLOW")).toMatchObject({
      label: "Yellow card",
      icon: null,
      card: "y",
      major: false,
    });
  });

  it("falls back to a default for unknown types", () => {
    expect(evMeta("NOPE")).toEqual({ label: "Update", icon: "list", cls: "", major: false });
  });

  it("is case-sensitive (API types are uppercase)", () => {
    expect(evMeta("goal")).toMatchObject({ label: "Update" });
  });
});

describe("enumerations", () => {
  it("offers a de-duplicated set of event types in the admin form", () => {
    expect(EVENT_TYPES).toContain("GOAL");
    expect(EVENT_TYPES).toContain("WHISTLE");
    expect(new Set(EVENT_TYPES).size).toBe(EVENT_TYPES.length);
  });

  it("labels squad positions", () => {
    expect(POSITIONS).toEqual(["GK", "DF", "MF", "FW"]);
    expect(POSITION_LABELS.GK).toBe("Goalkeeper");
  });
});
