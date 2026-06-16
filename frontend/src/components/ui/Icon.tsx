import type { CSSProperties } from "react";

/**
 * Icon set defined inline (stroke = currentColor, 24×24 viewBox). Keeping the
 * exact `<path d>`s is lighter than swapping in an icon library. The path
 * string may contain several subpaths; we split on "M" and render one <path>
 * each.
 */
const PATHS = {
  menu: "M3 6h18M3 12h18M3 18h18",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-3.5-3.5",
  settings:
    "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 6 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 .9 14H.8a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 6a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 8 .9h.1a2 2 0 1 1 4 0V1a1.7 1.7 0 0 0 2.9 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  live: "M5 8a7 7 0 0 1 14 0M8 11a4 4 0 0 1 8 0M12 14v0M9.5 20l2.5-6 2.5 6",
  shirt: "M9 3 5 5 3 9l3 1v10h12V10l3-1-2-4-4-2a3 3 0 0 1-6 0Z",
  stats: "M5 21V10M12 21V4M19 21v-7",
  calendar:
    "M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  whistle: "M14 9a5 5 0 1 0 0 6h7V9h-7ZM3 12h2",
  ball: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8l3.5 2.5-1.3 4h-4.4l-1.3-4L12 8Z",
  sub: "M7 17V5M7 5 4 8M7 5l3 3M17 7v12M17 19l3-3M17 19l-3-3",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  trash:
    "M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13",
  pencil: "M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4",
  check: "M5 12l5 5L20 6",
  chevron: "M9 6l6 6-6 6",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1A4 4 0 0 1 16 11",
  shield: "M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  x: "M6 6l12 12M18 6 6 18",
  github:
    "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-1-2.6c3-.3 6-1.5 6-6.6a5 5 0 0 0-1.4-3.5 4.7 4.7 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12.3 12.3 0 0 0-6.5 0C6.4 1.5 5.3 1.8 5.3 1.8a4.7 4.7 0 0 0-.1 3.5A5 5 0 0 0 3.8 8.8c0 5 3 6.3 6 6.6a3.4 3.4 0 0 0-1 2.6V22",
  plug: "M9 3v6M15 3v6M6 9h12v3a6 6 0 0 1-12 0V9ZM12 18v3",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  flame: "M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 11 10 12 3Z",
  target:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h0M3 12h0M3 18h0",
  copy: "M9 9h10v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1ZM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  palette:
    "M12 3a9 9 0 1 0 0 18c1 0 2-1 2-2 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.3a2 2 0 0 1 2-2h2a4 4 0 0 0 4-4c0-4-4-7-9-7ZM7.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM11 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM16 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  broadcast:
    "M4.9 5A10 10 0 0 0 4.9 19M19.1 5a10 10 0 0 1 0 14M7.8 8a6 6 0 0 0 0 8M16.2 8a6 6 0 0 1 0 8M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  lock: "M7 10V7a5 5 0 0 1 10 0v3M6 10h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1ZM12 15v2",
  logout: "M15 17l5-5-5-5M20 12H9M11 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5",
  // Added for the match-center manual Refresh control. Standard two-arrow
  // circular reload, 24×24 grid.
  refresh:
    "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
} as const;

export type IconName = keyof typeof PATHS;

export interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
  /** "solid" fills with currentColor; default is a stroke-only outline. */
  fill?: "none" | "solid";
}

export function Icon({ name, size = 18, stroke = 2, className, style, fill = "none" }: IconProps) {
  const d = PATHS[name] ?? PATHS.grid;
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill === "solid" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d
        .split("M")
        .filter(Boolean)
        .map((seg, i) => (
          <path key={i} d={`M${seg}`} />
        ))}
    </svg>
  );
}
