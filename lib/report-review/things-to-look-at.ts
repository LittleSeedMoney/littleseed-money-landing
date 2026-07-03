import type {
  DecisionReadiness,
  Finding,
} from "@/data/report-review-sample";
import type {
  ChargeInspectorCategoryMonthlySummary,
  ChargeInspectorReview,
} from "@/lib/report-review/charge-inspector";

/**
 * "Things to look at" is a deterministic consumer review list (Phase 5.5.4). It
 * consolidates already-computed facts into plain observations — never advice,
 * never a ranked priority. An item qualifies only from existing data:
 *
 * - an evidence-linked report finding,
 * - a decision-readiness metric outside its own source-backed range (emergency
 *   coverage below the baseline months), or
 * - a month-over-month category spending change past a fixed, documented
 *   threshold.
 *
 * Ordering is deterministic: by source strength (finding, then readiness, then
 * spending change), then by magnitude within spending changes. It adds no new
 * calculation beyond comparing values the response already carries.
 */

/** Fixed, documented month-over-month spending-change threshold (relative). */
export const SPENDING_CHANGE_THRESHOLD = 0.2;

/** Fixed display cap; overflow is reachable through "see all". */
export const THINGS_TO_LOOK_AT_CAP = 5;

export type ThingKind = "finding" | "readiness" | "spending-change";

export type ThingToLookAt = {
  id: string;
  kind: ThingKind;
  /** Plain-language observation ("what we observed"), never a directive. */
  observation: string;
  /** DOM id of the surface that explains the observation. */
  anchor: string;
};

export function buildThingsToLookAt({
  findings,
  decisionReadiness,
  chargeInspector,
}: {
  findings: Finding[];
  decisionReadiness: DecisionReadiness;
  chargeInspector: ChargeInspectorReview;
}): ThingToLookAt[] {
  return [
    ...findingObservations(findings),
    ...readinessObservations(decisionReadiness),
    ...spendingChangeObservations(chargeInspector.categoryMonthlySummary),
  ];
}

// Evidence-linked findings, in their existing (already-thresholded) order.
function findingObservations(findings: Finding[]): ThingToLookAt[] {
  return findings
    .filter((finding) => finding.evidenceSourceIds.length > 0)
    .map((finding) => ({
      id: `finding-${finding.id}`,
      kind: "finding" as const,
      observation: finding.title,
      anchor: "report-findings-details",
    }));
}

// Emergency coverage below its source-backed baseline range.
function readinessObservations(
  decisionReadiness: DecisionReadiness,
): ThingToLookAt[] {
  const current = leadingNumber(
    metricValue(decisionReadiness, "current_months_covered"),
  );
  const range = monthsRange(
    metricValue(decisionReadiness, "target_months_range"),
  );

  if (current === null || range === null || current >= range.min) {
    return [];
  }

  return [
    {
      id: "readiness-emergency-coverage",
      kind: "readiness",
      observation: `Emergency coverage is ${formatMonths(current)} months, below the ${range.min}–${range.max} month baseline`,
      anchor: "decision-details",
    },
  ];
}

// Month-over-month category spending changes past the threshold, largest first.
function spendingChangeObservations(
  rows: ChargeInspectorCategoryMonthlySummary[],
): ThingToLookAt[] {
  const months = [...new Set(rows.map((row) => row.month))].sort();
  const current = months[months.length - 1];
  const previous = months[months.length - 2];

  if (!current || !previous) {
    return [];
  }

  const previousByCategory = new Map(
    rows
      .filter((row) => row.month === previous)
      .map((row) => [row.category, row]),
  );

  const changes: { item: ThingToLookAt; magnitude: number }[] = [];

  for (const row of rows) {
    if (row.month !== current) {
      continue;
    }
    const priorRow = previousByCategory.get(row.category);
    if (!priorRow || priorRow.debitTotalCents <= 0) {
      continue;
    }

    const deltaCents = row.debitTotalCents - priorRow.debitTotalCents;
    const change = deltaCents / priorRow.debitTotalCents;
    if (Math.abs(change) < SPENDING_CHANGE_THRESHOLD) {
      continue;
    }

    const direction = deltaCents >= 0 ? "up" : "down";
    const percent = Math.round(Math.abs(change) * 100);
    changes.push({
      item: {
        id: `spending-${row.category}`,
        kind: "spending-change",
        observation: `${row.label} ${direction} ${percent}% vs ${previous}`,
        anchor: "spending-detail",
      },
      magnitude: Math.abs(deltaCents),
    });
  }

  return changes
    .sort((a, b) => b.magnitude - a.magnitude)
    .map((entry) => entry.item);
}

function metricValue(
  decisionReadiness: DecisionReadiness,
  id: string,
): string | null {
  return (
    decisionReadiness.resultMetrics.find((metric) => metric.id === id)?.value ??
    null
  );
}

function leadingNumber(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  const match = value.match(/-?\d+(\.\d+)?/);
  if (!match) {
    return null;
  }
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function monthsRange(
  value: string | null,
): { min: number; max: number } | null {
  if (value === null) {
    return null;
  }
  const matches = value.match(/-?\d+(\.\d+)?/g);
  if (!matches || matches.length < 2) {
    return null;
  }
  const min = Number(matches[0]);
  const max = Number(matches[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }
  return { min, max };
}

function formatMonths(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
