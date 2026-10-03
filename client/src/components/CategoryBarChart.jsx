import React from 'react';

/**
 * Horizontal bar chart for recurring finding categories.
 *
 * Built as plain SVG rather than pulling in a charting library: this is one
 * chart with one shape, and a dependency would outweigh it.
 *
 * The bars are a list, so the same data is reachable without seeing the chart.
 */
const ROW_HEIGHT = 40;
const BAR_HEIGHT = 18;
const LABEL_WIDTH = 220;

const TREND_TEXT = {
  up: 'More often lately',
  down: 'Less often lately',
  flat: 'No change',
};

export default function CategoryBarChart({ categories }) {
  if (!categories?.length) return null;

  const max = Math.max(...categories.map((c) => c.count));
  const height = categories.length * ROW_HEIGHT;
  // Viewbox units are arbitrary; the SVG scales to its container width.
  const width = 720;
  const barArea = width - LABEL_WIDTH - 48;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={`Recurring issue categories. ${categories
          .map((c) => `${c.label}: ${c.count}`)
          .join('. ')}.`}
        className="min-w-[640px]"
      >
        {categories.map((c, i) => {
          const y = i * ROW_HEIGHT;
          const barWidth = max > 0 ? Math.max((c.count / max) * barArea, 2) : 2;

          return (
            <g key={c.category}>
              <text
                x={0}
                y={y + ROW_HEIGHT / 2}
                dominantBaseline="middle"
                className="fill-fg text-[13px]"
              >
                {c.label}
              </text>

              {/* track */}
              <rect
                x={LABEL_WIDTH}
                y={y + (ROW_HEIGHT - BAR_HEIGHT) / 2}
                width={barArea}
                height={BAR_HEIGHT}
                rx={4}
                className="fill-raised"
              />
              {/* value */}
              <rect
                x={LABEL_WIDTH}
                y={y + (ROW_HEIGHT - BAR_HEIGHT) / 2}
                width={barWidth}
                height={BAR_HEIGHT}
                rx={4}
                className="fill-accent"
              />

              <text
                x={LABEL_WIDTH + barArea + 12}
                y={y + ROW_HEIGHT / 2}
                dominantBaseline="middle"
                className="fill-fg text-[13px] font-mono"
              >
                {c.count}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="sr-only">
        {categories.map((c) => (
          <li key={c.category}>
            {c.label}: {c.count} findings. {TREND_TEXT[c.trend]}.
          </li>
        ))}
      </ul>
    </div>
  );
}

export { TREND_TEXT };
