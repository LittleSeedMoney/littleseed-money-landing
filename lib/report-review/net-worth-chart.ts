// Deterministic geometry + summary helpers for the report-review net-worth chart.
//
// Pure, presentation-only, and current-session only. This module never fetches,
// stores, or sends data; it turns an already-computed net-worth trend into SVG
// path strings and a factual change summary. Trend points are landing-owned
// sample/fixture history — they are not persisted user data and are not part of
// any platform contract.

export type NetWorthTrendPoint = {
  /** Posted-date month in YYYY-MM form. */
  month: string;
  /** Net worth in whole dollars for that month. */
  value: number;
};

export type NetWorthChartPoint = {
  x: number;
  y: number;
  month: string;
  value: number;
};

export type NetWorthChartLayout = {
  width: number;
  height: number;
  paddingX?: number;
  paddingTop?: number;
  paddingBottom?: number;
};

export type NetWorthChartGeometry = {
  points: NetWorthChartPoint[];
  linePath: string;
  areaPath: string;
  goalY: number | null;
  endpoint: NetWorthChartPoint | null;
};

export type NetWorthChangeSummary = {
  first: number | null;
  last: number | null;
  delta: number;
  percent: number | null;
  direction: "up" | "down" | "flat";
};

const DOMAIN_PADDING_RATIO = 0.18;

function resolveLayout(layout: NetWorthChartLayout) {
  return {
    width: layout.width,
    height: layout.height,
    paddingX: layout.paddingX ?? 14,
    paddingTop: layout.paddingTop ?? 14,
    paddingBottom: layout.paddingBottom ?? 24,
  };
}

/**
 * Build deterministic SVG geometry for a net-worth trend. Returns empty paths
 * (and a null endpoint) when there are fewer than two points, since a single
 * point cannot describe a line.
 */
export function buildNetWorthChartGeometry(
  trend: readonly NetWorthTrendPoint[],
  layout: NetWorthChartLayout,
  target: number | null = null,
): NetWorthChartGeometry {
  const { width, height, paddingX, paddingTop, paddingBottom } =
    resolveLayout(layout);

  if (trend.length < 2) {
    return { points: [], linePath: "", areaPath: "", goalY: null, endpoint: null };
  }

  const values = trend.map((point) => point.value);
  const domainValues =
    target === null ? values : [...values, target];
  const rawMin = Math.min(...domainValues);
  const rawMax = Math.max(...domainValues);
  const spread = rawMax - rawMin;
  const pad = spread > 0 ? spread * DOMAIN_PADDING_RATIO : Math.abs(rawMax) * 0.1 || 1;
  const lo = rawMin - pad;
  const hi = rawMax + pad;

  const innerW = width - 2 * paddingX;
  const innerH = height - paddingTop - paddingBottom;
  const yFor = (value: number) =>
    paddingTop + (1 - (value - lo) / (hi - lo)) * innerH;

  const points: NetWorthChartPoint[] = trend.map((point, index) => ({
    x: paddingX + (index * innerW) / (trend.length - 1),
    y: yFor(point.value),
    month: point.month,
    value: point.value,
  }));

  const linePath = smoothPath(points);
  const baselineY = height - paddingBottom;
  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = `${linePath} L ${round(last.x)},${round(baselineY)} L ${round(first.x)},${round(baselineY)} Z`;

  return {
    points,
    linePath,
    areaPath,
    goalY: target === null ? null : yFor(target),
    endpoint: last,
  };
}

/** Factual change over the trend window. Not a recommendation. */
export function summarizeNetWorthChange(
  trend: readonly NetWorthTrendPoint[],
): NetWorthChangeSummary {
  if (trend.length === 0) {
    return { first: null, last: null, delta: 0, percent: null, direction: "flat" };
  }

  const first = trend[0].value;
  const last = trend[trend.length - 1].value;
  const delta = last - first;
  const percent = first !== 0 ? Math.round((delta / first) * 100) : null;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  return { first, last, delta, percent, direction };
}

export function formatNetWorthMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

// Catmull-Rom spline expressed as cubic beziers for a gentle, deterministic
// line — calm growth, not a jagged trading chart.
function smoothPath(points: NetWorthChartPoint[]): string {
  let path = `M ${round(points[0].x)},${round(points[0].y)}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${round(c1x)},${round(c1y)} ${round(c2x)},${round(c2y)} ${round(p2.x)},${round(p2.y)}`;
  }

  return path;
}
