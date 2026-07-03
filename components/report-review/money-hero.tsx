"use client";

import type { ReportReviewSample } from "@/data/report-review-sample";
import type { GoalPlanningSummary } from "@/lib/report-review/goal-planning";
import {
  formatNetWorthMoney,
  type NetWorthTrendPoint,
} from "@/lib/report-review/net-worth-chart";

import { NetWorthChart } from "./net-worth-chart";
import { useSnapshotView } from "./snapshot-view-context";

/**
 * Money screen hero. Presentation-only and current-session only.
 *
 * Net-worth chart, a factual "what you own / what you owe" composition bar,
 * and at-a-glance tiles. Every figure and status word is a deterministic
 * restatement of a value that already appears — with provenance and
 * disclosures — elsewhere on this surface. Status words are descriptive
 * ("Below target range"), never directive; missing values hide a tile rather
 * than being treated as zero.
 */
export function MoneyHero({
  report,
  topGoalSummary,
}: {
  report: ReportReviewSample;
  topGoalSummary: GoalPlanningSummary | null;
}) {
  const snapshotView = useSnapshotView();
  const portfolio = report.assetPortfolio;
  const trend: NetWorthTrendPoint[] = portfolio.netWorthTrend ?? [];
  const hasChart = trend.length > 1;

  const own = totalFor(portfolio, "total_assets");
  const owe = totalFor(portfolio, "total_liabilities");
  const composition =
    own !== null && owe !== null ? { own, owe, net: own - owe } : null;

  const tiles = [
    emergencyFundTile(report.decisionReadiness),
    spendingTile(report.chargeInspector),
    topGoalTile(topGoalSummary),
  ].filter((tile): tile is HeroTile => tile !== null);

  // Deep-links: each tile opens the surface that explains its number.
  const tileActions: Record<string, (() => void) | undefined> = {
    "emergency-fund": () => {
      const anchor = document.getElementById("decision-details");
      anchor?.closest("details")?.setAttribute("open", "");
      anchor?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    spending:
      snapshotView && tiles.find((tile) => tile.id === "spending")?.month
        ? () => {
            const month = tiles.find((tile) => tile.id === "spending")?.month;
            if (month) {
              snapshotView.selectMonth(month);
            }
            document
              .getElementById("portfolio")
              ?.scrollIntoView({ behavior: "smooth" });
          }
        : undefined,
    "top-goal": () => {
      window.location.hash = "goals";
    },
  };

  return (
    <div className="space-y-4" data-testid="money-hero">
      {hasChart ? (
        <NetWorthChart
          onMonthSelect={snapshotView?.selectMonth}
          selectableMonths={
            snapshotView ? (snapshotView.availableMonths ?? []) : null
          }
          selectedMonth={snapshotView?.selectedMonth ?? null}
          target={portfolio.netWorthTarget ?? null}
          trend={trend}
        />
      ) : null}

      {composition ? (
        <section
          aria-label="What you own and what you owe"
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
          data-testid="money-hero-composition"
        >
          {hasChart ? null : (
            <div className="mb-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-earth-500">
                Net worth
              </p>
              <p className="mt-1 font-serif text-3xl font-bold tabular-nums text-seed-950">
                {formatNetWorthMoney(composition.net)}
              </p>
              <p className="mt-1 text-xs text-earth-600">
                What you own minus what you owe, from the balances entered this
                session.
              </p>
            </div>
          )}
          <CompositionBar own={composition.own} owe={composition.owe} />
          {hasChart ? null : (
            <p
              className="mt-3 border-t border-stone-100 pt-3 text-[11px] text-earth-400"
              data-testid="money-hero-no-trend-note"
            >
              A month-by-month net-worth trend shows here when this review
              includes history. This session has a single point in time.
            </p>
          )}
        </section>
      ) : (
        <section
          aria-label="Net worth"
          className="rounded-2xl border border-dashed border-stone-300 bg-white p-5 text-center shadow-sm"
          data-testid="money-hero-empty"
        >
          <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-earth-500">
            Net worth
          </p>
          <p className="mt-2 text-sm text-earth-600">
            Net worth appears here once this review has asset and liability
            totals. Review or edit the balances below.
          </p>
        </section>
      )}

      {tiles.length > 0 ? (
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="money-hero-tiles"
        >
          {tiles.map((tile) => (
            <HeroTileCard
              key={tile.id}
              onActivate={tileActions[tile.id]}
              tile={tile}
            />
          ))}
        </div>
      ) : null}

      <p className="text-[11px] text-earth-400">
        Nothing here is saved. This stays in your browser for this session.
      </p>
    </div>
  );
}

type HeroTile = {
  id: string;
  label: string;
  value: string;
  valueUnit?: string;
  chip: { label: string; tone: "seed" | "earth" | "stone" };
  band?: {
    /** 0..1 position of the marker along the band. */
    position: number;
    leftLabel: string;
    rightLabel: string;
  };
  /** Small muted context line under the chip (e.g. "3 months reviewed"). */
  caption?: string;
  /** Machine month backing the tile, used by deep-link actions. */
  month?: string;
  detail: string;
};

function HeroTileCard({
  onActivate,
  tile,
}: {
  onActivate?: () => void;
  tile: HeroTile;
}) {
  const body = (
    <>
      <p className="flex items-start justify-between gap-2 text-xs font-semibold text-earth-600">
        {tile.label}
        {onActivate ? (
          <span aria-hidden="true" className="text-earth-300">
            ›
          </span>
        ) : null}
      </p>
      <p className="mt-1.5 font-serif text-[26px] font-bold leading-none tabular-nums text-seed-950">
        {tile.value}
        {tile.valueUnit ? (
          <span className="ml-1.5 font-sans text-xs font-semibold text-earth-500">
            {tile.valueUnit}
          </span>
        ) : null}
      </p>
      <p className="mt-2.5">
        <span className={tileChipClass(tile.chip.tone)}>
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-current"
          />
          {tile.chip.label}
        </span>
      </p>
      {tile.caption ? (
        <p className="mt-1.5 text-[10.5px] text-earth-400">{tile.caption}</p>
      ) : null}
      {tile.band ? (
        <div className="mt-3">
          <div className="relative h-1.5 rounded-full bg-gradient-to-r from-earth-200 via-seed-100 to-seed-300">
            <span
              aria-hidden="true"
              className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-seed-950"
              style={{
                left: `${Math.round(clamp01(tile.band.position) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] font-medium text-earth-400">
            <span>{tile.band.leftLabel}</span>
            <span>{tile.band.rightLabel}</span>
          </div>
        </div>
      ) : null}
      <p className="sr-only">{tile.detail}</p>
    </>
  );

  if (onActivate) {
    return (
      <button
        className="rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-seed-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-seed-500"
        data-testid={`money-hero-tile-${tile.id}`}
        onClick={onActivate}
        title={tile.detail}
        type="button"
      >
        {body}
      </button>
    );
  }

  return (
    <section
      aria-label={tile.label}
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
      data-testid={`money-hero-tile-${tile.id}`}
      title={tile.detail}
    >
      {body}
    </section>
  );
}

function tileChipClass(tone: "seed" | "earth" | "stone") {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold";
  if (tone === "seed") {
    return `${base} bg-seed-100 text-seed-800`;
  }
  if (tone === "earth") {
    return `${base} bg-earth-100 text-earth-800`;
  }
  return `${base} bg-stone-100 text-earth-700`;
}

/**
 * Emergency-fund coverage tile from the existing Emergency Fund Target v0
 * decision-readiness metrics. Status words describe position against the
 * source-backed 3–6 month educational range; they do not tell the user what
 * to do.
 */
function emergencyFundTile(
  decisionReadiness: ReportReviewSample["decisionReadiness"],
): HeroTile | null {
  const coverage = decisionReadiness.resultMetrics.find(
    (metric) => metric.id === "current_months_covered",
  );
  const range = decisionReadiness.resultMetrics.find(
    (metric) => metric.id === "target_months_range",
  );
  const months = coverage ? parseLeadingNumber(coverage.value) : null;
  const bounds = range ? parseMonthRange(range.value) : null;
  if (months === null || bounds === null) {
    return null;
  }

  const [low, high] = bounds;
  const chip =
    months < low
      ? { label: "Below target range", tone: "earth" as const }
      : months <= high
        ? { label: "In target range", tone: "seed" as const }
        : { label: "Above target range", tone: "seed" as const };

  return {
    id: "emergency-fund",
    label: "Emergency fund",
    value: months.toLocaleString("en-US", { maximumFractionDigits: 1 }),
    valueUnit: "months",
    chip,
    band: {
      position: months / high,
      leftLabel: "0",
      rightLabel: `${high} mo`,
    },
    detail: `${coverage?.detail ?? ""} Target range: ${range?.value ?? ""} (${range?.detail ?? ""})`.trim(),
  };
}

/**
 * Latest-month spending tile from the Charge Inspector monthly category
 * totals; the chip states the factual change against the previous month.
 */
function spendingTile(
  chargeInspector: ReportReviewSample["chargeInspector"],
): HeroTile | null {
  const totalsByMonth = new Map<string, number>();
  for (const row of chargeInspector.categoryMonthlySummary) {
    totalsByMonth.set(
      row.month,
      (totalsByMonth.get(row.month) ?? 0) + row.debitTotalCents,
    );
  }
  const months = [...totalsByMonth.keys()].sort();
  const latest = months[months.length - 1];
  if (!latest) {
    return null;
  }
  const latestCents = totalsByMonth.get(latest) ?? 0;
  const previous = months[months.length - 2];
  const previousCents = previous ? (totalsByMonth.get(previous) ?? null) : null;

  // The chip states the change factually in a neutral tone — more or less
  // spending is not framed as good or bad.
  let chip: HeroTile["chip"];
  if (previousCents === null || !previous) {
    chip = { label: `In ${monthName(latest)}`, tone: "stone" };
  } else {
    const deltaCents = latestCents - previousCents;
    chip =
      deltaCents > 0
        ? {
            label: `Up ${moneyFromCents(deltaCents)} vs ${monthName(previous)}`,
            tone: "stone",
          }
        : deltaCents < 0
          ? {
              label: `Down ${moneyFromCents(-deltaCents)} vs ${monthName(previous)}`,
              tone: "stone",
            }
          : { label: `Same as ${monthName(previous)}`, tone: "stone" };
  }

  return {
    id: "spending",
    label: `Spending in ${monthName(latest)}`,
    value: moneyFromCents(latestCents),
    chip,
    caption: `${months.length} ${months.length === 1 ? "month" : "months"} of transactions reviewed`,
    month: latest,
    detail:
      "Total categorized debits for the latest reviewed month, from the current Charge Inspector response. Comparison is against the previous reviewed month, which may cover fewer transactions.",
  };
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2026-05" → "May"; falls back to the raw value if unparseable. */
function monthName(month: string) {
  const index = Number(month.split("-")[1]) - 1;
  return MONTH_NAMES[index] ?? month;
}

/**
 * Top-priority goal tile from the user's own goal order; the status word is
 * the goal workspace's deterministic status label.
 */
function topGoalTile(summary: GoalPlanningSummary | null): HeroTile | null {
  if (!summary || summary.progressPercent === null) {
    return null;
  }

  return {
    id: "top-goal",
    label: `Goal #1 · ${summary.name}`,
    value: `${Math.round(summary.progressPercent)}%`,
    chip: {
      label: summary.statusLabel,
      tone:
        summary.status === "reached" || summary.status === "on_track_for_month"
          ? "seed"
          : summary.status === "needs_more_monthly_input"
            ? "earth"
            : "stone",
    },
    band: {
      position: summary.progressPercent / 100,
      leftLabel: "0%",
      rightLabel: "100%",
    },
    detail:
      "Progress on your first-priority goal: current saved divided by target amount, from the values you entered. Priority order is your choice.",
  };
}

function CompositionBar({ own, owe }: { own: number; owe: number }) {
  // Guard against a zero/negative denominator so the flex ratios stay valid.
  const ownWeight = Math.max(own, 0);
  const oweWeight = Math.max(owe, 0);
  const total = ownWeight + oweWeight;

  return (
    <div>
      <div
        aria-hidden="true"
        className="flex h-3.5 gap-0.5 overflow-hidden rounded-full"
      >
        <span
          className="block rounded-l-full bg-seed-600"
          style={{ flexGrow: total > 0 ? ownWeight : 1 }}
        />
        <span
          className="block rounded-r-full bg-earth-500"
          style={{ flexGrow: total > 0 ? oweWeight : 1 }}
        />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-sm bg-seed-600"
          />
          <span className="font-medium text-earth-600">What you own</span>
          <span className="font-serif font-bold tabular-nums text-seed-950">
            {formatNetWorthMoney(own)}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-sm bg-earth-500"
          />
          <span className="font-medium text-earth-600">What you owe</span>
          <span className="font-serif font-bold tabular-nums text-seed-950">
            {formatNetWorthMoney(owe)}
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * Parse a formatted total (e.g. "$68,000", "-$15,000") back to a number. Returns
 * null when the metric is missing or unparseable — missing optional financial
 * values must not be treated as zero.
 */
function totalFor(
  portfolio: ReportReviewSample["assetPortfolio"],
  id: string,
): number | null {
  const metric = portfolio.totals.find((item) => item.id === id);
  if (!metric) {
    return null;
  }
  const cleaned = metric.value.replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "-") {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLeadingNumber(value: string): number | null {
  const match = value.match(/^(\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Parse "3 to 6 months" into [3, 6]. */
function parseMonthRange(value: string): [number, number] | null {
  const match = value.match(/(\d+(?:\.\d+)?)\s*to\s*(\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }
  const low = Number(match[1]);
  const high = Number(match[2]);
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= 0) {
    return null;
  }
  return [low, high];
}

function moneyFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Math.round(cents / 100));
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
