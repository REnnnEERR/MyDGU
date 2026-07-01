export function DiamondPattern() {
  const cell = 56;
  const cols = 4;
  const rows = 7;
  const diamonds: { x: number; y: number; color: string }[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if ((row + col) % 2 !== 0) continue;
      const color = (row * cols + col) % 3 === 0 ? "var(--du-blue)" : "var(--du-yellow-deep)";
      diamonds.push({ x: col * cell, y: row * cell, color });
    }
  }

  const width = cols * cell;
  const height = rows * cell;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
      className="opacity-90"
    >
      {diamonds.map((d, i) => (
        <rect
          key={i}
          x={d.x}
          y={d.y}
          width={cell * 0.78}
          height={cell * 0.78}
          fill={d.color}
          transform={`rotate(45 ${d.x + (cell * 0.78) / 2} ${d.y + (cell * 0.78) / 2})`}
        />
      ))}
    </svg>
  );
}