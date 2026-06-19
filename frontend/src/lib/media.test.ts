import { describe, expect, it } from "vitest";

import { mediaPath } from "./media";

describe("mediaPath", () => {
  it("strips the host from an absolute backend URL", () => {
    expect(mediaPath("http://backend:8000/media/logos/fc.png")).toBe("/media/logos/fc.png");
  });

  it("keeps the query string", () => {
    expect(mediaPath("https://cdn.example.com/media/fc.png?v=2")).toBe("/media/fc.png?v=2");
  });

  it("returns already-relative paths untouched", () => {
    expect(mediaPath("/media/fc.png")).toBe("/media/fc.png");
  });

  it("leaves blob: and data: preview URLs untouched", () => {
    const blob = "blob:https://app/abc-123";
    const data = "data:image/png;base64,iVBORw0KGgo=";
    expect(mediaPath(blob)).toBe(blob);
    expect(mediaPath(data)).toBe(data);
  });

  it("returns null for empty input", () => {
    expect(mediaPath(null)).toBeNull();
    expect(mediaPath(undefined)).toBeNull();
    expect(mediaPath("")).toBeNull();
  });
});
