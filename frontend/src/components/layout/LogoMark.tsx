/**
 * OpenMatchroom logo mark — the gradient "broadcast pin" SVG. The gradient is a
 * fixed brand mark in its own right, not a themed accent.
 */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      className="flex-none rounded-md shadow-[0_3px_10px_rgba(22,39,60,0.18)]"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="omLogo" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8aa1cd" />
          <stop offset="0.5" stopColor="#3b6fa6" />
          <stop offset="1" stopColor="#284a72" />
        </linearGradient>
        <linearGradient id="omShine" x1="24" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#omLogo)" />
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#omShine)" />
      <line
        x1="24"
        y1="11"
        x2="24"
        y2="37"
        stroke="#fff"
        strokeOpacity="0.26"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="9" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" />
      <path
        d="M30.5 17.5a9 9 0 0 1 0 13"
        stroke="#fff"
        strokeOpacity="0.85"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="3.2" fill="#fff" />
    </svg>
  );
}
