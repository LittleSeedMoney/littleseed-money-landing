"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";

import {
  buildNetWorthChartGeometry,
  formatNetWorthMoney,
  summarizeNetWorthChange,
  type NetWorthTrendPoint,
} from "@/lib/report-review/net-worth-chart";

const VIEW_W = 600;
const VIEW_H = 160;

type RangeId = "6m" | "1y" | "all";

const RANGES: { id: RangeId; label: string; months: number | null }[] = [
  { id: "6m", label: "6M", months: 6 },
  { id: "1y", label: "1Y", months: 12 },
  { id: "all", label: "All", months: null },
];

function shortMonth(month: string) {
  const [, monthPart] = month.split("-");
  const index = Number(monthPart) - 1;
  const labels = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return labels[index] ?? month;
}

export function NetWorthChart({
  trend,
  target = null,
  selectedMonth = null,
  selectableMonths = null,
  onMonthSelect,
}: {
  trend: NetWorthTrendPoint[];
  target?: number | null;
  selectedMonth?: string | null;
  /** Months that have monthly detail; only these get click targets. */
  selectableMonths?: string[] | null;
  onMonthSelect?: (month: string) => void;
}) {
  const [rangeId, setRangeId] = useState<RangeId>("1y");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const selectable = typeof onMonthSelect === "function";
  const selectableSet =
    selectableMonths === null ? null : new Set(selectableMonths);

  const rangeTrend = useMemo(() => {
    const months = RANGES.find((range) => range.id === rangeId)?.months ?? null;
    if (months === null || trend.length <= months) {
      return trend;
    }
    return trend.slice(trend.length - months);
  }, [rangeId, trend]);

  const geometry = useMemo(
    () =>
      buildNetWorthChartGeometry(
        rangeTrend,
        { width: VIEW_W, height: VIEW_H },
        target,
      ),
    [rangeTrend, target],
  );
  const change = useMemo(
    () => summarizeNetWorthChange(rangeTrend),
    [rangeTrend],
  );

  if (geometry.points.length < 2 || change.last === null) {
    return null;
  }

  const active =
    hoverIndex === null ? null : geometry.points[hoverIndex] ?? null;
  const selected =
    selectedMonth === null
      ? null
      : geometry.points.find((point) => point.month === selectedMonth) ?? null;

  // Horizontal band boundaries so each month has a full-height click target.
  function bandFor(index: number) {
    const point = geometry.points[index];
    const previous = geometry.points[index - 1];
    const next = geometry.points[index + 1];
    const left = previous ? (previous.x + point.x) / 2 : 0;
    const right = next ? (point.x + next.x) / 2 : VIEW_W;
    return { left, width: Math.max(0, right - left) };
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || geometry.points.length < 2) {
      return;
    }
    const rect = svg.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const raw = Math.round(ratio * (geometry.points.length - 1));
    const index = Math.max(0, Math.min(geometry.points.length - 1, raw));
    setHoverIndex(index);
  }

  const changeLabel =
    change.direction === "up"
      ? `Up ${formatNetWorthMoney(change.delta)}`
      : change.direction === "down"
        ? `Down ${formatNetWorthMoney(Math.abs(change.delta))}`
        : "No change";
  const rangeWord =
    rangeId === "6m" ? "in 6 months" : rangeId === "1y" ? "this year" : "all time";
  const arrow = change.direction === "up" ? "▲" : change.direction === "down" ? "▼" : "•";

  return (
    <section
      aria-label="Net worth over time"
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      data-testid="net-worth-chart"
    >
      {/* The range toggle shares the first row with the small caps label only.
          The value and change copy below vary in width per range ("this year"
          vs "in 6 months"), and on narrow screens a shared wrapping row made
          the toggle jump lines right under the user's finger. Keeping the
          toggle beside the short fixed-width label pins it in place across
          every range. */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-earth-500">
          Net worth
        </p>
        <div
          className="inline-flex shrink-0 gap-0.5 rounded-lg border border-seed-100 bg-seed-50 p-0.5"
          role="group"
          aria-label="Time range"
        >
          {RANGES.map((range) => {
            const isActive = range.id === rangeId;
            return (
              <button
                aria-pressed={isActive}
                className={`rounded-md px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-seed-500 ${
                  isActive ? "bg-seed-700 text-white" : "text-earth-600"
                }`}
                key={range.id}
                onClick={() => {
                  setRangeId(range.id);
                  setHoverIndex(null);
                }}
                type="button"
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mt-1 font-serif text-2xl font-bold tabular-nums text-seed-950">
          {formatNetWorthMoney(change.last)}
        </p>
        <p className="mt-1 text-sm font-semibold text-seed-600">
          {arrow} {changeLabel}
          {change.percent !== null ? (
            <span className="font-medium text-earth-600">
              {" "}
              ({change.percent >= 0 ? "+" : ""}
              {change.percent}%) {rangeWord}
            </span>
          ) : (
            <span className="font-medium text-earth-600"> {rangeWord}</span>
          )}
        </p>
      </div>

      <div className="relative mt-3">
        <svg
          aria-label={`Net worth ${changeLabel.toLowerCase()} ${rangeWord}, now ${formatNetWorthMoney(change.last)}`}
          // Fluid height: grows with the viewport (dvh accounts for mobile
          // browser chrome) but stays bounded so it never dwarfs the tiles on
          // very tall screens or collapses on short ones.
          className="block h-[clamp(13rem,34dvh,22rem)] w-full overflow-visible sm:h-[clamp(15rem,36dvh,22rem)]"
          onPointerLeave={() => setHoverIndex(null)}
          onPointerMove={handlePointerMove}
          preserveAspectRatio="none"
          ref={svgRef}
          role="img"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        >
          <defs>
            <linearGradient id="net-worth-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#67894A" stopOpacity="0.24" />
              <stop offset="1" stopColor="#67894A" stopOpacity="0" />
            </linearGradient>
          </defs>

          <line
            stroke="#efe9dc"
            strokeWidth="1"
            x1="0"
            x2={VIEW_W}
            y1={VIEW_H - 24}
            y2={VIEW_H - 24}
          />
          {geometry.goalY !== null ? (
            <line
              stroke="#C48A39"
              strokeDasharray="5 4"
              strokeWidth="1.5"
              x1="0"
              x2={VIEW_W}
              y1={geometry.goalY}
              y2={geometry.goalY}
            />
          ) : null}

          <path d={geometry.areaPath} fill="url(#net-worth-fill)" />
          <path
            className="animate-[money-line-draw_900ms_ease-out] [stroke-dasharray:1] motion-reduce:animate-none motion-reduce:[stroke-dasharray:none]"
            d={geometry.linePath}
            fill="none"
            pathLength={1}
            stroke="#3F562F"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />

          {active ? (
            <line
              stroke="#c9c3b4"
              strokeDasharray="3 3"
              strokeWidth="1"
              x1={active.x}
              x2={active.x}
              y1="6"
              y2={VIEW_H - 24}
            />
          ) : null}

          {selectable && selectableSet !== null
            ? geometry.points.map((point) =>
                selectableSet.has(point.month) &&
                point.month !== selectedMonth &&
                point.month !== geometry.endpoint?.month ? (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    fill="#67894A"
                    key={`dot-${point.month}`}
                    r="3.5"
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                ) : null,
              )
            : null}

          {selected ? (
            <>
              <line
                stroke="#C48A39"
                strokeWidth="1.5"
                x1={selected.x}
                x2={selected.x}
                y1="6"
                y2={VIEW_H - 24}
              />
              <circle
                cx={selected.x}
                cy={selected.y}
                fill="#C48A39"
                r="6"
                stroke="#fff"
                strokeWidth="2.5"
              />
            </>
          ) : null}

          <circle
            cx={geometry.endpoint?.x}
            cy={geometry.endpoint?.y}
            fill="#3F562F"
            r="5"
            stroke="#fff"
            strokeWidth="2.5"
          />
          {active ? (
            <circle
              cx={active.x}
              cy={active.y}
              fill="#3F562F"
              r="5"
              stroke="#fff"
              strokeWidth="2"
            />
          ) : null}

          {geometry.points.map((point, index) =>
            index % Math.ceil(geometry.points.length / 6) === 0 ||
            index === geometry.points.length - 1 ? (
              <text
                className="fill-earth-400 font-sans"
                fontSize="10.5"
                key={point.month}
                textAnchor="middle"
                x={point.x}
                y={VIEW_H - 6}
              >
                {shortMonth(point.month)}
              </text>
            ) : null,
          )}

          {selectable
            ? geometry.points.map((point, index) => {
                if (selectableSet !== null && !selectableSet.has(point.month)) {
                  return null;
                }
                const band = bandFor(index);
                const isSelected = point.month === selectedMonth;
                return (
                  <rect
                    aria-label={`Select ${shortMonth(point.month)}`}
                    aria-pressed={isSelected}
                    className="cursor-pointer outline-none [&:focus-visible]:fill-[rgba(103,137,74,0.12)]"
                    data-month={point.month}
                    data-testid="net-worth-chart-month"
                    fill="transparent"
                    height={VIEW_H}
                    key={`hit-${point.month}`}
                    onClick={() => onMonthSelect?.(point.month)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onMonthSelect?.(point.month);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    width={band.width}
                    x={band.left}
                    y={0}
                  />
                );
              })
            : null}
        </svg>

        {active ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-[120%] whitespace-nowrap rounded-lg bg-seed-950 px-2.5 py-1.5 text-xs font-semibold text-white"
            style={{
              left: `${(active.x / VIEW_W) * 100}%`,
              top: `${(active.y / VIEW_H) * 100}%`,
            }}
          >
            {shortMonth(active.month)} ·{" "}
            <span className="font-serif tabular-nums">
              {formatNetWorthMoney(active.value)}
            </span>
          </div>
        ) : null}
      </div>

      {target !== null ? (
        // items-start + a fixed-top marker keeps the dash aligned with the
        // first line when the caption wraps on narrow screens (items-center
        // floated it between the wrapped lines).
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-earth-600">
          <span
            aria-hidden="true"
            className="mt-[9px] inline-block w-5 shrink-0 border-t-2 border-dashed border-earth-500"
          />
          <span className="min-w-0">
            Goal line {formatNetWorthMoney(target)} — your net-worth target,
            not a recommendation.
          </span>
        </p>
      ) : null}

      <p className="mt-2 text-[11px] text-earth-400">
        Sample history for this session. Nothing here is saved.
      </p>
    </section>
  );
}
