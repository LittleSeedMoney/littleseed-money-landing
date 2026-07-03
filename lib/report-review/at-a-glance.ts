import type { SummaryMetric } from "@/data/report-review-sample";

/**
 * At-a-glance answers restate the four household questions from
 * `docs/20_FINANCIAL_REPORT_UX.md` using metrics the platform already computed.
 * This layer adds no calculation: each row maps a question to an existing
 * `summaryMetrics` entry and deep-links to that metric's full provenance card.
 * When a metric is absent from the response, its row is omitted rather than
 * shown as a fabricated zero.
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
};

export const AT_A_GLANCE_QUESTIONS: AtAGlanceQuestion[] = [
  {
    id: "money-left",
    question: "Money left this month",
    icon: "cash-flow",
    metricId: "monthly_cash_flow",
  },
  {
    id: "income-resilience",
    question: "Income cushion",
    icon: "resilience",
    metricId: "emergency_coverage",
  },
  {
    id: "debt-pressure",
    question: "Debt on the books",
    icon: "debt",
    metricId: "debt_pressure",
  },
  {
    id: "own-owe",
    question: "Net worth",
    icon: "net-worth",
    metricId: "net_worth",
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
