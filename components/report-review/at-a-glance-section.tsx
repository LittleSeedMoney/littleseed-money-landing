"use client";

import type { SummaryMetric } from "@/data/report-review-sample";
import {
  atAGlanceMetricAnchor,
  buildAtAGlanceRows,
} from "@/lib/report-review/at-a-glance";
import { revealAnchor } from "@/lib/report-review/reveal-anchor";

import { provenanceLabels, reviewPanelClass } from "./shared";

/**
 * Compact restatement of the household questions using existing
 * `summaryMetrics`, sized for the right rail. An emoji-led answer list: the
 * question is a quiet lead-in and the already-computed value reads as the
 * answer. Provenance stays visible as light inline text and an info control
 * deep-links to the metric's full provenance card. Renders nothing when no
 * answerable metric is present, so a data-less session shows no empty console.
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
      className={reviewPanelClass("scroll-mt-24 p-4")}
      data-testid="at-a-glance"
      id="at-a-glance"
    >
      <h2
        className="text-sm font-semibold text-seed-950"
        id="at-a-glance-heading"
      >
        At a glance
      </h2>

      <dl className="mt-2 divide-y divide-stone-100">
        {rows.map((row) => (
          <AtAGlanceRow
            key={row.id}
            glyph={row.glyph}
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
  glyph,
  metric,
  question,
  rowId,
}: {
  glyph: string;
  metric: SummaryMetric;
  question: string;
  rowId: string;
}) {
  const anchor = atAGlanceMetricAnchor(metric.id);

  return (
    <div
      className="py-2.5 first:pt-1 last:pb-1"
      data-testid="at-a-glance-row"
      data-question={rowId}
    >
      <dt className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-seed-50 text-sm"
        >
          {glyph}
        </span>
        <span className="min-w-0 flex-1 text-xs font-semibold leading-4 text-seed-950">
          {question}
        </span>
      </dt>
      <dd className="mt-1 pl-9">
        {/* Value left, info control right — a consistent column across rows so
            the varying value widths don't leave the row ragged. */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-serif text-xl font-bold tabular-nums leading-none text-seed-950">
            {metric.value}
          </span>
          {/* Repeated "what we counted" text is replaced with one accessible
              icon control (per the Phase 5.22 density pattern); it opens the
              metric's full provenance card. */}
          <button
            aria-label={`What we counted for ${question}`}
            className="grid size-6 shrink-0 place-items-center rounded-md text-earth-400 outline-none hover:bg-seed-50 hover:text-seed-700 focus:ring-2 focus:ring-seed-500"
            data-testid="at-a-glance-provenance-link"
            onClick={() => revealAnchor(anchor)}
            type="button"
          >
            <InfoIcon />
          </button>
        </div>
        {/* Provenance stays disclosed as a light caption under the value,
            left-aligned so it never wraps against the value. */}
        <span className="mt-0.5 block text-[11px] font-medium text-earth-500">
          {provenanceLabels[metric.provenance]}
        </span>
      </dd>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" strokeLinecap="round" />
      <path d="M12 7.75h.01" strokeLinecap="round" />
    </svg>
  );
}
