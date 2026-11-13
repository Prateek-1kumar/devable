/** Each brand's mark on its colour: you in the ink, the rest in muted brand hues. Fictional, like the sample data. */
const BRAND = ["#172c21", "#3a63c9", "#7a5fc7", "#d99a2b", "#2b9a88"];
export function Brand({ i, size = 18 }: { i: number; size?: number }) {
  const glyph = [
    <path key="y" d="M4.2 10.6 8 5.4l3.8 5.2" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
    <g key="n" fill="#fff">
      <rect x="4" y="4.6" width="8" height="1.9" rx=".9" />
      <rect x="4" y="7.1" width="8" height="1.9" rx=".9" />
      <rect x="4" y="9.6" width="5.2" height="1.9" rx=".9" />
    </g>,
    <g key="l" fill="#fff">
      <circle cx="5.6" cy="5.6" r="1.35" />
      <circle cx="10.4" cy="5.6" r="1.35" />
      <circle cx="5.6" cy="10.4" r="1.35" />
      <circle cx="10.4" cy="10.4" r="1.35" />
    </g>,
    <g key="m" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="3.6" />
      <path d="M2.8 8h10.4" />
    </g>,
    <circle key="o" cx="8" cy="8" r="3.4" fill="none" stroke="#fff" strokeWidth="1.8" />,
  ];
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect width="16" height="16" rx="4" fill={BRAND[i]} />
      {glyph[i]}
    </svg>
  );
}
