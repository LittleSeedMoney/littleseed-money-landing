"use client";

import type { ReportReviewSample } from "@/data/report-review-sample";
import {
  formatNetWorthMoney,
  type NetWorthTrendPoint,
} from "@/lib/report-review/net-worth-chart";

import { NetWorthChart } from "./net-worth-chart";
import { useSnapshotView } from "./snapshot-view-context";

/**
 * Money screen hero. Presentation-only and current-session only.
 *
 * Promotes the net-worth trend chart to the top of the default screen and adds
 * a factual "what you own / what you owe" composition bar derived from the
 * already-computed portfolio totals. Nothing here is advice: every figure is a
 * reported/calculated value that also appears — with provenance and
 * disclosures — in the snapshot totals below.
 */
export function MoneyHero({
  portfolio,
}: {
  portfolio: ReportReviewSample["assetPortfolio"];
}) {
  const snapshotView = useSnapshotView();
  const trend: NetWorthTrendPoint[] = portfolio.netWorthTrend ?? [];
  const hasChart = trend.length > 1;

  const own = totalFor(portfolio, "total_assets");
  const owe = totalFor(portfolio, "total_liabilities");
  const composition =
    own !== null && owe !== null ? { own, owe, net: own - owe } : null;

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
          <p className="mt-4 text-[11px] text-earth-400">
            Balances are this session&rsquo;s sample values — nothing here is
            saved.
          </p>
        </section>
      ) : null}
    </div>
  );
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
