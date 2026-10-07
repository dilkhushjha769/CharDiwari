// Placeholder elevation drawing until real project photos arrive: ink lines on
// graph paper. The same project id always draws the same building.

function hash(text) {
  let value = 2166136261
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619)
  return value >>> 0
}

function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

const GROUND = 262

export function ProjectArt({ seed }) {
  const random = seeded(hash(seed))
  const patternId = `paper-${seed}`
  const count = 2 + Math.floor(random() * 2)
  const towers = Array.from({ length: count }, (_, index) => {
    const width = 70 + random() * 50
    const height = 120 + random() * 130
    const slot = 400 / count
    const x = slot * index + (slot - width) / 2 + (random() - 0.5) * 20
    return { x, width, height }
  })

  return (
    <svg viewBox="0 0 400 300" className="size-full" aria-hidden="true" preserveAspectRatio="xMidYMax slice">
      <defs>
        <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" className="stroke-grid" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="400" height="300" className="fill-card" />
      <rect width="400" height="300" fill={`url(#${patternId})`} />
      <line x1="0" x2="400" y1={GROUND} y2={GROUND} className="stroke-foreground/40" strokeWidth="1.25" />
      {towers.map((tower, index) => {
        const top = GROUND - tower.height
        const columns = Math.max(3, Math.floor(tower.width / 18))
        const rows = Math.floor((tower.height - 16) / 20)
        const cellWidth = (tower.width - 16) / columns
        return (
          <g key={index}>
            <rect
              x={tower.x}
              y={top}
              width={tower.width}
              height={tower.height}
              className="fill-card stroke-foreground/55"
              strokeWidth="1.25"
            />
            <line
              x1={tower.x - 4}
              x2={tower.x + tower.width + 4}
              y1={top}
              y2={top}
              className="stroke-foreground/55"
              strokeWidth="1.25"
            />
            {Array.from({ length: rows * columns }, (_, cell) => {
              const lit = random() < 0.18
              return (
                <rect
                  key={cell}
                  x={tower.x + 8 + (cell % columns) * cellWidth + 2}
                  y={top + 10 + Math.floor(cell / columns) * 20}
                  width={cellWidth - 4}
                  height="10"
                  className={lit ? "fill-window" : "fill-none stroke-foreground/20"}
                  strokeWidth="1"
                />
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
