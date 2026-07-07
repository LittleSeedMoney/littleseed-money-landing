import type { Provenance, SnapshotItem } from "@/data/report-review-sample";

/**
 * Grouped, presentation-only view of the flat asset / liability snapshot lists
 * for the consumer Money screen (Phase 5.5.3). It groups existing
 * `SnapshotItem`s by their `category`, keeps each named holding, and derives a
 * group subtotal — with no new calculation beyond summing already-entered
 * balances.
 *
 * Boundaries, matching the spec and the existing `totalFor` behavior:
 * - A missing or unparseable balance is labeled missing, never coerced to zero,
 *   and is excluded from the group subtotal.
 * - An empty category is omitted (groups are built from present items only).
 * - Category order follows first appearance in the source list (deterministic).
 */
export type AssetBreakdownItem = {
  id: string;
  name: string;
  /** The original formatted balance for display (e.g. "$12,000"). */
  valueLabel: string;
  /** Parsed numeric balance, or null when missing/unparseable. */
  valueNumber: number | null;
  missing: boolean;
  /**
   * Where the balance came from, passed through for the per-account caption.
   * A real per-account "last updated" timestamp only exists once accounts are
   * linked (Phase 6); until then the caption pairs this provenance with the
   * session-freshness wording.
   */
  provenance: Provenance;
};

export type AssetBreakdownGroup = {
  category: string;
  items: AssetBreakdownItem[];
  /** Sum of parsed balances, excluding missing items. */
  subtotal: number;
  /** True when the group has exactly one holding (skip a redundant subtotal). */
  single: boolean;
  /** True when at least one holding has a missing/unparseable balance. */
  hasMissing: boolean;
};

/** Parse a formatted balance back to a number, or null when unparseable. */
export function parseSnapshotValue(value: string): number | null {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "-") {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Group snapshot items by category into an ordered breakdown. Categories appear
 * in first-seen order; empty categories never appear because groups are built
 * from present items only.
 */
export function buildSnapshotBreakdown(
  items: SnapshotItem[],
): AssetBreakdownGroup[] {
  const groups = new Map<string, AssetBreakdownItem[]>();

  for (const item of items) {
    const valueNumber = parseSnapshotValue(item.value);
    const breakdownItem: AssetBreakdownItem = {
      id: item.id,
      name: item.name,
      valueLabel: item.value,
      valueNumber,
      missing: valueNumber === null,
      provenance: item.provenance,
    };

    const existing = groups.get(item.category);
    if (existing) {
      existing.push(breakdownItem);
    } else {
      groups.set(item.category, [breakdownItem]);
    }
  }

  return Array.from(groups, ([category, groupItems]) => ({
    category,
    items: groupItems,
    subtotal: groupItems.reduce(
      (sum, item) => sum + (item.valueNumber ?? 0),
      0,
    ),
    single: groupItems.length === 1,
    hasMissing: groupItems.some((item) => item.missing),
  }));
}

export type BreakdownColumnTotal = {
  /** Sum of every group subtotal (missing balances stay excluded). */
  total: number;
  /** True when any holding in the column has a missing balance. */
  hasMissing: boolean;
};

/**
 * Column total for "what you own" / "what you owe": the sum of the group
 * subtotals the breakdown already derives. Same presentation-only arithmetic
 * as the subtotals themselves — missing balances are excluded and flagged,
 * never coerced to zero.
 */
export function breakdownColumnTotal(
  groups: AssetBreakdownGroup[],
): BreakdownColumnTotal {
  return {
    total: groups.reduce((sum, group) => sum + group.subtotal, 0),
    hasMissing: groups.some((group) => group.hasMissing),
  };
}
