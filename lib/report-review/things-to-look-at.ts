import type {
  DecisionReadiness,
  Finding,
  SummaryMetric,
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
  /** Short plain-language observation title, never a directive. */
  observation: string;
  /** One-line factual detail (a dollar delta, a baseline, a summary). */
  detail: string;
  /** DOM id of the surface that explains the observation. */
  anchor: string;
};

export function buildThingsToLookAt({
  findings,
  decisionReadiness,
  chargeInspector,
  summaryMetrics,
}: {
  findings: Finding[];
  decisionReadiness: DecisionReadiness;
  chargeInspector: ChargeInspectorReview;
  summaryMetrics: SummaryMetric[];
}): ThingToLookAt[] {
  return [
    ...findingObservations(findings, summaryMetrics),
    ...readinessObservations(decisionReadiness),
    ...spendingChangeObservations(chargeInspector.categoryMonthlySummary),
  ];
}

/**
 * Deterministic finding → summary-metric association for a compact amount
 * detail, in the same spirit as the at-a-glance question → metric mapping. The
 * metric's `detail` is an already-computed platform string (for example
 * "$2,000 meets the high-interest review rule."); we surface its leading
 * dollar amount next to the finding. Unmapped findings, missing metrics, or a
 * detail without a leading amount all fail closed to no detail.
 */
const FINDING_AMOUNT_METRIC: Record<string, string> = {
  high_interest_debt_detected: "debt_pressure",
};

// Evidence-linked findings, in their existing (already-thresholded) order. The
// detail is a compact dollar amount from the finding's mapped summary metric
// when one exists — never the long-form summary sentence, which truncates badly
// and lives one tap away behind "what we observed".
function findingObservations(
  findings: Finding[],
  summaryMetrics: SummaryMetric[],
): ThingToLookAt[] {
  const metricById = new Map(
    summaryMetrics.map((metric) => [metric.id, metric]),
  );

  return findings
    .filter((finding) => finding.evidenceSourceIds.length > 0)
    .map((finding) => {
      const metricId = FINDING_AMOUNT_METRIC[finding.id];
      const metric = metricId ? metricById.get(metricId) : undefined;
      const facts = [
        leadingCurrencyAmount(metric?.detail),
        finding.accountCount !== undefined
          ? `${finding.accountCount} account${finding.accountCount === 1 ? "" : "s"}`
          : null,
      ].filter((fact): fact is string => fact !== null);
      return {
        id: `finding-${finding.id}`,
        kind: "finding" as const,
        observation: compactFindingTitle(finding.title),
        detail: facts.join(" · "),
        anchor: "report-findings-details",
      };
    });
}

/** Extract a leading dollar amount ("$2,000") from an already-computed string. */
function leadingCurrencyAmount(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const match = value.match(/^\$[\d,]+(\.\d+)?/);
  return match ? match[0] : null;
}

/**
 * Compact a sentence-shaped finding title into a scannable noun phrase by
 * stripping a passive "was identified/detected/found" tail — a deterministic
 * presentation trim that drops no meaning ("High-interest debt was identified"
 * → "High-interest debt"). Unrecognized shapes pass through unchanged.
 */
export function compactFindingTitle(title: string): string {
  const trimmed = title
    .replace(/\s+was\s+(identified|detected|found)\.?$/i, "")
    .trim();
  return trimmed.length > 0 ? trimmed : title;
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
      observation: `Emergency coverage ${formatMonths(current)} months`,
      detail: `below the ${range.min}–${range.max} month baseline`,
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
    const deltaLabel = formatCents(Math.abs(deltaCents));
    changes.push({
      item: {
        id: `spending-${row.category}`,
        kind: "spending-change",
        observation: `${row.label} ${direction} ${percent}%`,
        detail: `${deltaCents >= 0 ? "+" : "−"}${deltaLabel} vs ${previous}`,
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

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
