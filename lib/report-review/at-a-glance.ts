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
  /** The `summaryMetrics` id whose value answers the question. */
  metricId: string;
};

export const AT_A_GLANCE_QUESTIONS: AtAGlanceQuestion[] = [
  {
    id: "money-left",
    question: "Is money left at the end of the month?",
    metricId: "monthly_cash_flow",
  },
  {
    id: "income-resilience",
    question: "How long could you handle an income interruption?",
    metricId: "emergency_coverage",
  },
  {
    id: "debt-pressure",
    question: "How much pressure is debt creating?",
    metricId: "debt_pressure",
  },
  {
    id: "own-owe",
    question: "What do you own and owe?",
    metricId: "net_worth",
  },
];

export type AtAGlanceRow = {
  id: string;
  question: string;
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
      rows.push({ id: question.id, question: question.question, metric });
    }
    return rows;
  }, []);
}

/** DOM id of the metric's full provenance card in the Report & findings surface. */
export function atAGlanceMetricAnchor(metricId: string): string {
  return `metric-${metricId}`;
}
