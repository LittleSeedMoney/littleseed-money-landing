"use client";

import type { SummaryMetric } from "@/data/report-review-sample";
import {
  atAGlanceMetricAnchor,
  buildAtAGlanceRows,
} from "@/lib/report-review/at-a-glance";
import { revealAnchor } from "@/lib/report-review/reveal-anchor";

import { ProvenanceTag, reviewPanelClass, reviewSubtlePanelClass } from "./shared";

/**
 * Compact restatement of the four household questions using existing
 * `summaryMetrics`. Each row deep-links to the metric's full provenance card in
 * the Report & findings disclosure. Renders nothing when no answerable metric
 * is present, so a data-less session never shows an empty console.
 */
export function AtAGlanceSection({
  summaryMetrics,
}: {
  summaryMetrics: SummaryMetric[];
}) {
  const rows = buildAtAGlanceRows(summaryMetrics);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="at-a-glance-heading"
      className={reviewPanelClass("p-4")}
      data-testid="at-a-glance"
    >
      <h2
        className="text-sm font-semibold text-seed-950"
        id="at-a-glance-heading"
      >
        At a glance
      </h2>
      <p className="mt-0.5 text-xs text-earth-600">
        The questions this review can answer right now, from values already
        computed for this session.
      </p>

      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <AtAGlanceRow
            key={row.id}
            metric={row.metric}
            question={row.question}
            rowId={row.id}
          />
        ))}
      </dl>
    </section>
  );
}

function AtAGlanceRow({
  metric,
  question,
  rowId,
}: {
  metric: SummaryMetric;
  question: string;
  rowId: string;
}) {
  const anchor = atAGlanceMetricAnchor(metric.id);

  return (
    <div
      className={reviewSubtlePanelClass("p-3")}
      data-testid="at-a-glance-row"
      data-question={rowId}
    >
      <dt className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium leading-5 text-earth-700">
          {question}
        </span>
        <ProvenanceTag provenance={metric.provenance} />
      </dt>
      <dd className="mt-1.5">
        <span className="block text-lg font-semibold tabular-nums text-seed-950">
          {metric.value}
        </span>
        <button
          className="mt-1 inline-flex min-h-7 items-center rounded-md text-xs font-medium text-seed-700 underline-offset-4 outline-none hover:underline focus:ring-2 focus:ring-seed-500"
          data-testid="at-a-glance-provenance-link"
          onClick={() => revealAnchor(anchor)}
          type="button"
        >
          What we counted
        </button>
      </dd>
    </div>
  );
}
