import type { SummaryMetric } from "@/data/report-review-sample";

/**
 * At-a-glance answers restate the four household questions from
 * `docs/20_FINANCIAL_REPORT_UX.md` using metrics the platform already computed.
 * This layer adds no calculation: each row maps a question to an existing
 * `summaryMetrics` entry and deep-links to that metric's full provenance card.
 * When a metric is absent, its answered row is omitted and the UI may surface
 * the question separately as a factual needs hint (`atAGlanceNeedsHints`)
 * rather than a fabricated zero.
 */
/**
 * Semantic icon key for a question. The UI owns the actual mark (an app-drawn
 * SVG in Seed/Earth geometry), so the data layer stays presentation-agnostic and
 * cross-platform consistent rather than depending on OS emoji rendering.
 */
export type AtAGlanceIcon = "cash-flow" | "resilience" | "debt" | "net-worth";

export type AtAGlanceQuestion = {
  /** Stable id for the question row (e.g. for keys and test hooks). */
  id: string;
  /** The plain household question this row answers. */
  question: string;
  /** Decorative, deterministic icon key. Warmth only — no status or judgment. */
  icon: AtAGlanceIcon;
  /** The `summaryMetrics` id whose value answers the question. */
  metricId: string;
  /**
   * What the review still needs before this question can be answered
   * (Phase 5.5.7b). Shown instead of a fabricated zero when the metric is
   * absent — a factual statement of missing inputs, never a directive about
   * what to do with money.
   */
  needsHint: string;
};

export const AT_A_GLANCE_QUESTIONS: AtAGlanceQuestion[] = [
  {
    id: "money-left",
    question: "Money left this month",
    icon: "cash-flow",
    metricId: "monthly_cash_flow",
    needsHint:
      "Add income and monthly expenses to see what's left each month.",
  },
  {
    id: "income-resilience",
    question: "Income cushion",
    icon: "resilience",
    metricId: "emergency_coverage",
    needsHint:
      "Add emergency-eligible cash and monthly costs to see this cushion.",
  },
  {
    id: "debt-pressure",
    question: "Debt on the books",
    icon: "debt",
    metricId: "debt_pressure",
    needsHint: "Add debts to see debt pressure.",
  },
  {
    id: "own-owe",
    question: "Net worth",
    icon: "net-worth",
    metricId: "net_worth",
    needsHint: "Add asset and liability balances to see net worth.",
  },
];

export type AtAGlanceRow = {
  id: string;
  question: string;
  icon: AtAGlanceIcon;
  metric: SummaryMetric;
};

/**
 * Build the at-a-glance rows in fixed question order, keeping only questions
 * whose metric is present in the response.
 */
export function buildAtAGlanceRows(
  summaryMetrics: SummaryMetric[],
): AtAGlanceRow[] {
  const metricById = new Map(
    summaryMetrics.map((metric) => [metric.id, metric]),
  );

  return AT_A_GLANCE_QUESTIONS.reduce<AtAGlanceRow[]>((rows, question) => {
    const metric = metricById.get(question.metricId);
    if (metric) {
      rows.push({
        id: question.id,
        question: question.question,
        icon: question.icon,
        metric,
      });
    }
    return rows;
  }, []);
}

/** DOM id of the metric's full provenance card in the Report & findings surface. */
export function atAGlanceMetricAnchor(metricId: string): string {
  return `metric-${metricId}`;
}

export type AtAGlanceNeedsHint = {
  id: string;
  question: string;
  icon: AtAGlanceIcon;
  hint: string;
};

/**
 * Questions the current response cannot answer yet, in the same fixed order
 * (Phase 5.5.7b "needs a bit more"). Answered questions lead; these follow as
 * factual statements of what is still needed — never a zero, a judgment, or a
 * directive about money.
 */
export function atAGlanceNeedsHints(
  summaryMetrics: SummaryMetric[],
): AtAGlanceNeedsHint[] {
  const presentIds = new Set(summaryMetrics.map((metric) => metric.id));

  return AT_A_GLANCE_QUESTIONS.filter(
    (question) => !presentIds.has(question.metricId),
  ).map((question) => ({
    id: question.id,
    question: question.question,
    icon: question.icon,
    hint: question.needsHint,
  }));
}
