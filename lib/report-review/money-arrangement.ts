/**
 * In-session arrangement of the Money narrative blocks (Phase 5.5.6).
 *
 * A user-chosen arrangement is explicit user input, not an app recommendation —
 * the same principle as Phase 5.19 goal ordering. The arrangement lives only in
 * component state for the current browser session: it is never stored, sent, or
 * synced, and a reload restores the default order.
 *
 * Pinned vs movable follows the consumer surface spec: the net-worth hero,
 * the session-boundary notice, and any active limitation/fallback/sample-data
 * disclosure stay pinned and are not part of this list. Only the blocks below
 * can be reordered or hidden, and hidden blocks must stay reachable (see the
 * "show" event used by `revealAnchor` and the hidden-sections list).
 *
 * Rearranging changes presentation order only — never a calculation, a
 * provenance label, or a safety disclosure.
 */

export const MONEY_BLOCK_IDS = [
  "breakdown",
  "things-to-look-at",
  "at-a-glance",
  "spending-detail",
  "charge-inspector",
  "report-findings",
  "balance-details",
  "review-support",
] as const;

export type MoneyBlockId = (typeof MONEY_BLOCK_IDS)[number];

export type MoneyArrangement = {
  /** Full block order, including currently hidden blocks (position survives hide/show). */
  order: MoneyBlockId[];
  /** Hidden blocks. Hiding never deletes: content stays reachable and restorable. */
  hidden: MoneyBlockId[];
};

export const MONEY_BLOCK_LABELS: Record<MoneyBlockId, string> = {
  breakdown: "What you own and owe",
  "things-to-look-at": "Things to look at",
  "at-a-glance": "At a glance",
  "spending-detail": "This month's spending",
  "charge-inspector": "Charge Inspector",
  "report-findings": "Report & findings",
  "balance-details": "Balance details",
  "review-support": "Review support",
};

/**
 * Bubbling CustomEvent dispatched at a hidden block's wrapper to ask the React
 * owner of the arrangement state to show that block again. Used by
 * `revealAnchor` and the hash deep-link path so hidden content stays reachable
 * from every existing deep link without threading state through the DOM
 * helpers.
 */
export const MONEY_BLOCK_SHOW_EVENT = "littleseed:money-block-show";

export function isMoneyBlockId(value: unknown): value is MoneyBlockId {
  return (
    typeof value === "string" &&
    (MONEY_BLOCK_IDS as readonly string[]).includes(value)
  );
}

export function defaultMoneyArrangement(): MoneyArrangement {
  return { order: [...MONEY_BLOCK_IDS], hidden: [] };
}

export function isDefaultMoneyArrangement(
  arrangement: MoneyArrangement,
): boolean {
  return (
    arrangement.hidden.length === 0 &&
    arrangement.order.length === MONEY_BLOCK_IDS.length &&
    arrangement.order.every((id, index) => id === MONEY_BLOCK_IDS[index])
  );
}

/**
 * Swap `id` with its nearest neighbour among the blocks the user can currently
 * see (`presentIds` are the blocks actually rendered for this report state;
 * hidden blocks are skipped). Swapping in the full `order` keeps hidden and
 * absent blocks anchored to their surroundings, so showing a block later
 * returns it near where the user left it.
 */
export function moveMoneyBlock(
  arrangement: MoneyArrangement,
  id: MoneyBlockId,
  direction: "up" | "down",
  presentIds: readonly MoneyBlockId[],
): MoneyArrangement {
  const visible = arrangement.order.filter(
    (block) => presentIds.includes(block) && !arrangement.hidden.includes(block),
  );
  const from = visible.indexOf(id);
  if (from < 0) {
    return arrangement;
  }
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= visible.length) {
    return arrangement;
  }

  const other = visible[to];
  const order = [...arrangement.order];
  const a = order.indexOf(id);
  const b = order.indexOf(other);
  order[a] = other;
  order[b] = id;
  return { ...arrangement, order };
}

export function hideMoneyBlock(
  arrangement: MoneyArrangement,
  id: MoneyBlockId,
): MoneyArrangement {
  if (arrangement.hidden.includes(id)) {
    return arrangement;
  }
  return { ...arrangement, hidden: [...arrangement.hidden, id] };
}

/** Showing restores the block at the position it kept in `order` while hidden. */
export function showMoneyBlock(
  arrangement: MoneyArrangement,
  id: MoneyBlockId,
): MoneyArrangement {
  if (!arrangement.hidden.includes(id)) {
    return arrangement;
  }
  return {
    ...arrangement,
    hidden: arrangement.hidden.filter((block) => block !== id),
  };
}
