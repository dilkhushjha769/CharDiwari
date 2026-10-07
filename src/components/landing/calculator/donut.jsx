const RADIUS = 50
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Principal vs interest. Colours match the legend dots next to it.
export function Donut({ principal, interest }) {
  const total = principal + interest
  const share = total > 0 ? principal / total : 1
  const percent = Math.round(share * 100)

  return (
    <svg
      viewBox="0 0 120 120"
      className="size-32 shrink-0 sm:size-36"
      role="img"
      aria-label={`Principal is ${percent}% and interest is ${100 - percent}% of the total you pay`}
    >
      <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="14" className="stroke-chart-1" />
      <circle
        cx="60"
        cy="60"
        r={RADIUS}
        fill="none"
        strokeWidth="14"
        strokeDasharray={`${share * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        transform="rotate(-90 60 60)"
        className="stroke-primary"
      />
      <text x="60" y="58" textAnchor="middle" className="fill-foreground text-[18px] font-semibold">
        {percent}%
      </text>
      <text x="60" y="74" textAnchor="middle" className="fill-muted-foreground text-[9px]">
        principal
      </text>
    </svg>
  )
}

export function LegendDot({ className }) {
  return <span className={`inline-block size-2.5 rounded-full ${className}`} aria-hidden="true" />
}
