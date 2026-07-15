const s = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
} as const;
const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const icon = {
  grid: (
    <svg {...s}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" {...stroke} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" {...stroke} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" {...stroke} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" {...stroke} />
    </svg>
  ),
  plus: (
    <svg {...s}>
      <path d="M12 5v14M5 12h14" {...stroke} />
    </svg>
  ),
  users: (
    <svg {...s}>
      <circle cx="9" cy="8" r="3" {...stroke} />
      <path
        d="M3 20a6 6 0 0112 0M16 6a3 3 0 010 6m5 8a6 6 0 00-4-5.6"
        {...stroke}
      />
    </svg>
  ),
  calendar: (
    <svg {...s}>
      <rect x="3" y="5" width="18" height="16" rx="2" {...stroke} />
      <path d="M3 9h18M8 3v4M16 3v4" {...stroke} />
    </svg>
  ),
  receipt: (
    <svg {...s}>
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" {...stroke} />
      <path d="M9 7h6M9 11h6" {...stroke} />
    </svg>
  ),
  shield: (
    <svg {...s}>
      <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z" {...stroke} />
    </svg>
  ),
  chart: (
    <svg {...s}>
      <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" {...stroke} />
    </svg>
  ),
  cog: (
    <svg {...s}>
      <circle cx="12" cy="12" r="3" {...stroke} />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"
        {...stroke}
      />
    </svg>
  ),
  scan: (
    <svg {...s}>
      <path
        d="M4 8V5a1 1 0 011-1h3M20 8V5a1 1 0 00-1-1h-3M4 16v3a1 1 0 001 1h3m12-4v3a1 1 0 01-1 1h-3"
        {...stroke}
      />
      <path d="M3 12h18" {...stroke} />
    </svg>
  ),
  list: (
    <svg {...s}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" {...stroke} />
    </svg>
  ),
};
