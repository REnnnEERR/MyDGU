export function LogoMark({ inverted = false }: { inverted?: boolean }) {
  const fg = inverted ? "#ffffff" : "#0a0a0a";
  const bg = inverted ? "#0a0a0a" : "#ffffff";
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="6" fill={fg} />
      <rect x="4" y="4" width="6" height="6" fill={bg} />
      <rect x="12" y="4" width="6" height="6" fill={bg} />
      <rect x="4" y="12" width="6" height="6" fill={bg} />
      <rect x="18" y="12" width="6" height="6" fill={bg} />
      <rect x="12" y="18" width="6" height="6" fill={bg} />
      <rect x="18" y="18" width="6" height="6" fill={bg} />
    </svg>
  );
}