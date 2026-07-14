/**
 * CrmOpportunityCompletionGauge.tsx
 * Semi-circle completion meter with needle — CRM Opportunities aesthetic.
 */

type CrmOpportunityCompletionGaugeProps = {
  /** 0–100 */
  percent: number;
  /** compact for tables/home; default for record header */
  size?: "sm" | "md";
  className?: string;
};

/**
 * Clamps a percent into the 0–100 range.
 */
function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(percent)));
}

/**
 * Semi-circle gauge with filled arc, needle, and percent label.
 */
export function CrmOpportunityCompletionGauge({
  percent,
  size = "md",
  className = "",
}: CrmOpportunityCompletionGaugeProps): React.ReactElement {
  const value = clampPercent(percent);
  const isSm = size === "sm";
  const width = isSm ? 72 : 112;
  const height = isSm ? 44 : 68;
  const cx = width / 2;
  const cy = isSm ? 38 : 58;
  const radius = isSm ? 28 : 46;
  const stroke = isSm ? 5 : 7;

  // Arc from π (left) to 0 (right); needle angle from left.
  const angle = Math.PI * (1 - value / 100);
  const needleLen = radius - stroke;
  const needleX = cx + needleLen * Math.cos(angle);
  const needleY = cy - needleLen * Math.sin(angle);

  const trackD = describeArc(cx, cy, radius, 180, 0);
  const endAngleDeg = 180 - (value / 100) * 180;
  const valueD = value > 0 ? describeArc(cx, cy, radius, 180, endAngleDeg) : "";

  return (
    <div
      className={`inline-flex flex-col items-center ${className}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={`Opportunity ${value}% complete`}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
        <path
          d={trackD}
          fill="none"
          stroke="#dfe6e4"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {valueD ? (
          <path
            d={valueD}
            fill="none"
            stroke="#0f4c4c"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        ) : null}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#003434"
          strokeWidth={isSm ? 1.5 : 2}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={isSm ? 2.5 : 3.5} fill="#c9a84c" />
      </svg>
      <span
        className={`font-semibold tabular-nums text-[#003434] leading-none ${
          isSm ? "text-[11px] -mt-1" : "text-sm -mt-1.5"
        }`}
      >
        {value}%
      </span>
    </div>
  );
}

/**
 * SVG arc path for a semicircle segment (degrees: 180 = left, 90 = top, 0 = right).
 */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  // Clockwise sweep so 180 → 0 draws the upper semicircle.
  const sweep = 1;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

/**
 * Converts polar degrees to SVG coords (y increases downward; 90° points up).
 */
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy - radius * Math.sin(rad),
  };
}
