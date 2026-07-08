import type { ReportReviewSample } from "@/data/report-review-sample";
import {
  buildSnapshotBreakdown,
  type AssetBreakdownGroup,
  type AssetBreakdownItem,
} from "@/lib/report-review/asset-breakdown";
import { formatNetWorthMoney } from "@/lib/report-review/net-worth-chart";

import { provenanceLabels, reviewPanelClass } from "./shared";

/**
 * Grouped breakdown of what the household owns and owes, from the existing
 * flat snapshot lists. Redesigned per owner feedback from the tile-like
 * disclosure style to a flat account ledger: every account row is always
 * visible under its category (no tap to expand), each carries a
 * provenance-and-freshness caption, categories keep their subtotal, and each
 * column leads with its total. Assets and liabilities stay visually distinct
 * (seed vs earth accents, mirroring the hero composition bar).
 *
 * Presentation only. The column header totals are the canonical
 * `assetPortfolio.totals` figures — the same source the hero composition bar
 * reads — shown verbatim, NOT a sum of the visible rows: the preserved
 * linked/CSV row flow can append rows without updating the canonical totals,
 * and one screen must never spell the same own/owe figure two ways (review
 * catch on this PR). Group subtotals remain sums of their visible rows;
 * missing balances stay labeled and excluded, never zeroed.
 * A real per-account "last updated" timestamp only exists once accounts are
 * linked (Phase 6); until then the caption pairs the existing provenance with
 * the session-freshness wording, and the linked-account timestamp can take
 * this slot later.
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
          totalLabel={canonicalTotal(portfolio, "total_assets")}
        />
        <BreakdownColumn
          accent="owe"
          groups={liabilityGroups}
          testid="breakdown-liabilities"
          title="What you owe"
          totalLabel={canonicalTotal(portfolio, "total_liabilities")}
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
  totalLabel,
}: {
  accent: "own" | "owe";
  groups: AssetBreakdownGroup[];
  testid: string;
  title: string;
  /** Canonical total (verbatim `assetPortfolio.totals` value), or null to omit. */
  totalLabel: string | null;
}) {
  if (groups.length === 0) {
    return null;
  }

  const dotClass = accent === "own" ? "bg-seed-600" : "bg-earth-500";
  const totalClass = accent === "own" ? "text-seed-800" : "text-earth-700";

  return (
    <section aria-label={title} data-testid={testid}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-earth-600">
          <span
            aria-hidden="true"
            className={`inline-block size-2.5 rounded-sm ${dotClass}`}
          />
          {title}
        </h3>
        {totalLabel !== null ? (
          <span
            className={`shrink-0 font-serif text-xl font-bold tabular-nums ${totalClass}`}
            data-testid="breakdown-total"
          >
            {totalLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white">
        {groups.map((group, index) => (
          <BreakdownGroup
            accent={accent}
            first={index === 0}
            group={group}
            key={group.category}
          />
        ))}
      </div>
    </section>
  );
}

function BreakdownGroup({
  accent,
  first,
  group,
}: {
  accent: "own" | "owe";
  first: boolean;
  group: AssetBreakdownGroup;
}) {
  const subtotalClass = accent === "own" ? "text-seed-800" : "text-earth-700";
  const railClass = accent === "own" ? "bg-seed-500" : "bg-earth-500";

  // A single-holding category stays one row (no redundant subtotal): the
  // account row itself carries the category in its caption.
  if (group.single) {
    const item = group.items[0]!;
    return (
      <div
        className={first ? undefined : "border-t border-stone-100"}
        data-category={group.category}
        data-testid="breakdown-group"
      >
        <AccountRow
          categoryCaption={group.category}
          item={item}
          railClass={railClass}
        />
      </div>
    );
  }

  return (
    <div
      className={first ? undefined : "border-t border-stone-100"}
      data-category={group.category}
      data-testid="breakdown-group"
    >
      <div className="flex items-baseline justify-between gap-3 bg-stone-50/70 px-3 py-2">
        <span className="min-w-0 text-xs font-semibold uppercase tracking-[0.08em] text-earth-600">
          {group.category}
        </span>
        <span
          className={`shrink-0 font-serif text-base font-bold tabular-nums ${subtotalClass}`}
          data-testid="breakdown-subtotal"
        >
          {formatNetWorthMoney(group.subtotal)}
          {group.hasMissing ? (
            <span className="ml-1 align-middle text-[12px] font-medium text-amber-700">
              + missing
            </span>
          ) : null}
        </span>
      </div>
      <ul className="divide-y divide-stone-100">
        {group.items.map((item) => (
          <li key={item.id}>
            <AccountRow item={item} railClass={railClass} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * One account: name, a provenance-and-freshness caption, and the balance.
 * The caption's freshness half is the session boundary until linked accounts
 * (Phase 6) supply a real per-account timestamp for this slot.
 */
function AccountRow({
  categoryCaption,
  item,
  railClass,
}: {
  categoryCaption?: string;
  item: AssetBreakdownItem;
  railClass: string;
}) {
  const caption = [
    categoryCaption,
    provenanceLabels[item.provenance],
    "this session",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="relative flex items-center justify-between gap-3 py-2.5 pl-4 pr-3"
      data-testid="breakdown-account"
    >
      <span
        aria-hidden="true"
        className={`absolute bottom-2 left-1.5 top-2 w-[3px] rounded-full ${railClass} opacity-60`}
      />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-seed-950">
          {item.name}
        </span>
        <span className="mt-0.5 block text-[12px] text-earth-600">
          {caption}
        </span>
      </span>
      {item.missing ? (
        <span className="shrink-0 text-xs font-medium text-amber-700">
          Missing
        </span>
      ) : (
        <span className="shrink-0 font-serif text-base font-bold tabular-nums text-seed-950">
          {item.valueLabel}
        </span>
      )}
    </div>
  );
}

/**
 * Verbatim canonical total from `assetPortfolio.totals` — the identical
 * source string the hero composition bar derives from, so the ledger header
 * and the hero can never disagree. Missing metric omits the header figure.
 */
function canonicalTotal(
  portfolio: ReportReviewSample["assetPortfolio"],
  id: string,
): string | null {
  return portfolio.totals.find((metric) => metric.id === id)?.value ?? null;
}
