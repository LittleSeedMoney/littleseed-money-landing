import type { SummaryMetric } from "@/data/report-review-sample";

/**
 * At-a-glance answers restate the four household questions from
 * `docs/20_FINANCIAL_REPORT_UX.md` using metrics the platform already computed.
 * This layer adds no calculation: each row maps a question to an existing
 * `summaryMetrics` entry and deep-links to that metric's full provenance card.
 * When a metric is absent from the response, its row is omitted rather than
 * shown as a fabricated zero.
 */
export type AtAGlanceQuestion = {
  /** Stable id for the question row (e.g. for keys and test hooks). */
  id: string;
  /** The plain household question this row answers. */
  question: string;
  /**
   * Decorative, deterministic glyph for the question. Warmth only — it carries
   * no status or judgment (a green-leaning seed/earth motif per the design
   * system), mirroring the decorative topic icons in `education-section.tsx`.
   */
  glyph: string;
  /** The `summaryMetrics` id whose value answers the question. */
  metricId: string;
};

export const AT_A_GLANCE_QUESTIONS: AtAGlanceQuestion[] = [
  {
    id: "money-left",
    question: "Money left this month",
    glyph: "🌿",
    metricId: "monthly_cash_flow",
  },
  {
    id: "income-resilience",
    question: "Income cushion",
    glyph: "☂️",
    metricId: "emergency_coverage",
  },
  {
    id: "debt-pressure",
    question: "Debt on the books",
    glyph: "⚖️",
    metricId: "debt_pressure",
  },
  {
    id: "own-owe",
    question: "Net worth",
    glyph: "🌳",
    metricId: "net_worth",
  },
];

export type AtAGlanceRow = {
  id: string;
  question: string;
  glyph: string;
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
        glyph: question.glyph,
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
