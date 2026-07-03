import type { ReportReviewSample } from "@/data/report-review-sample";
import {
  buildSnapshotBreakdown,
  type AssetBreakdownGroup,
} from "@/lib/report-review/asset-breakdown";
import { formatNetWorthMoney } from "@/lib/report-review/net-worth-chart";

import { reviewPanelClass, reviewSubtlePanelClass } from "./shared";

/**
 * Grouped, expandable breakdown of what the household owns and owes, from the
 * existing flat snapshot lists. Assets and liabilities stay visually distinct
 * (seed vs earth accents, mirroring the hero composition bar). Presentation
 * only — no new calculation, and missing balances are labeled, not zeroed.
 */
export function AssetLiabilityBreakdown({
  portfolio,
}: {
  portfolio: ReportReviewSample["assetPortfolio"];
}) {
  const assetGroups = buildSnapshotBreakdown(portfolio.assets);
  const liabilityGroups = buildSnapshotBreakdown(portfolio.liabilities);

  if (assetGroups.length === 0 && liabilityGroups.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="breakdown-heading"
      className={reviewPanelClass("scroll-mt-24 p-4")}
      data-testid="asset-liability-breakdown"
      id="breakdown"
    >
      <h2
        className="text-sm font-semibold text-seed-950"
        id="breakdown-heading"
      >
        What you own and owe
      </h2>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <BreakdownColumn
          accent="own"
          groups={assetGroups}
          testid="breakdown-assets"
          title="What you own"
        />
        <BreakdownColumn
          accent="owe"
          groups={liabilityGroups}
          testid="breakdown-liabilities"
          title="What you owe"
        />
      </div>
    </section>
  );
}

function BreakdownColumn({
  accent,
  groups,
  testid,
  title,
}: {
  accent: "own" | "owe";
  groups: AssetBreakdownGroup[];
  testid: string;
  title: string;
}) {
  if (groups.length === 0) {
    return null;
  }

  const dotClass = accent === "own" ? "bg-seed-600" : "bg-earth-500";

  return (
    <section aria-label={title} data-testid={testid}>
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-earth-600">
        <span
          aria-hidden="true"
          className={`inline-block size-2.5 rounded-sm ${dotClass}`}
        />
        {title}
      </h3>
      <div className="mt-2 space-y-2">
        {groups.map((group) => (
          <BreakdownGroup accent={accent} group={group} key={group.category} />
        ))}
      </div>
    </section>
  );
}

function BreakdownGroup({
  accent,
  group,
}: {
  accent: "own" | "owe";
  group: AssetBreakdownGroup;
}) {
  const subtotalClass =
    accent === "own" ? "text-seed-800" : "text-earth-700";

  // A single-holding group shows one row without a redundant subtotal.
  if (group.single) {
    const item = group.items[0]!;
    return (
      <div
        className={reviewSubtlePanelClass("flex items-baseline justify-between gap-3 p-3")}
        data-category={group.category}
        data-testid="breakdown-group"
      >
        <span className="min-w-0 text-sm font-medium text-seed-950">
          {item.name}
        </span>
        <HoldingValue item={item} />
      </div>
    );
  }

  return (
    <details
      className={reviewSubtlePanelClass("overflow-hidden p-0")}
      data-category={group.category}
      data-testid="breakdown-group"
    >
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3 p-3 outline-none focus-visible:ring-2 focus-visible:ring-seed-500 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 text-sm font-semibold text-seed-950">
          {group.category}
          <span className="ml-1.5 text-xs font-normal text-earth-500">
            {group.items.length} holdings
          </span>
        </span>
        <span
          className={`shrink-0 font-serif text-sm font-bold tabular-nums ${subtotalClass}`}
          data-testid="breakdown-subtotal"
        >
          {formatNetWorthMoney(group.subtotal)}
          {group.hasMissing ? (
            <span className="ml-1 align-middle text-[10px] font-medium text-amber-700">
              + missing
            </span>
          ) : null}
        </span>
      </summary>
      <ul className="divide-y divide-stone-100 border-t border-stone-100">
        {group.items.map((item) => (
          <li
            className="flex items-baseline justify-between gap-3 px-3 py-2"
            key={item.id}
          >
            <span className="min-w-0 text-sm text-earth-800">{item.name}</span>
            <HoldingValue item={item} />
          </li>
        ))}
      </ul>
    </details>
  );
}

function HoldingValue({
  item,
}: {
  item: AssetBreakdownGroup["items"][number];
}) {
  if (item.missing) {
    return (
      <span className="shrink-0 text-xs font-medium text-amber-700">
        Missing
      </span>
    );
  }
  return (
    <span className="shrink-0 font-serif text-sm font-bold tabular-nums text-seed-950">
      {item.valueLabel}
    </span>
  );
}
