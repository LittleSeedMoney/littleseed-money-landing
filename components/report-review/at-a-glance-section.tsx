"use client";

import type { ReactElement } from "react";

import type { SummaryMetric } from "@/data/report-review-sample";
import {
  atAGlanceNeedsHints,
  buildAtAGlanceRows,
  type AtAGlanceIcon,
} from "@/lib/report-review/at-a-glance";
import { revealAnchor } from "@/lib/report-review/reveal-anchor";

import { joinClasses, provenanceLabels, reviewPanelClass } from "./shared";

/**
 * Compact restatement of the household questions using existing
 * `summaryMetrics`. An icon-led answer list: the question is a quiet lead-in and
 * the already-computed value reads as the answer. Provenance stays visible as a
 * light caption per row, and one section-level control deep-links to the full
 * provenance cards in Report & findings — a per-row icon repeated four times
 * read as duplicate noise (owner feedback), since every destination lives in
 * the same disclosure. Questions the response cannot answer yet follow the
 * answered rows as a muted "needs a bit more" list stating the missing inputs
 * (Phase 5.5.7b) — never a fabricated zero, never a directive about money.
 *
 * The section uses `aria-label` (not a heading id) so it can be rendered twice
 * for responsive placement — a mobile instance in the Money narrative and a
 * desktop instance in the sticky rail — without duplicate DOM ids; each instance
 * is display-toggled by breakpoint so only one is in the accessibility tree.
 */
export function AtAGlanceSection({
  className,
  summaryMetrics,
}: {
  className?: string;
  summaryMetrics: SummaryMetric[];
}) {
  const rows = buildAtAGlanceRows(summaryMetrics);
  // Questions this response cannot answer yet (Phase 5.5.7b). Answered rows
  // lead; the rest state what is still needed instead of disappearing
  // silently or rendering a fabricated zero.
  const needs = atAGlanceNeedsHints(summaryMetrics);

  if (rows.length === 0 && needs.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="At a glance"
      className={joinClasses(reviewPanelClass("scroll-mt-24 p-4"), className)}
      data-testid="at-a-glance"
    >
      <h2 className="text-sm font-semibold text-seed-950">At a glance</h2>

      {rows.length > 0 ? (
        <dl className="mt-2 divide-y divide-stone-100">
          {rows.map((row) => (
            <AtAGlanceRow
              key={row.id}
              icon={row.icon}
              metric={row.metric}
              question={row.question}
              rowId={row.id}
            />
          ))}
        </dl>
      ) : null}

      {needs.length > 0 ? (
        <div
          className={
            rows.length > 0 ? "mt-2 border-t border-stone-100 pt-3" : "mt-2"
          }
        >
          <h3 className="text-[11px] font-bold uppercase tracking-[0.13em] text-earth-600">
            Needs a bit more
          </h3>
          <ul className="mt-2 space-y-2.5">
            {needs.map((need) => (
              <li
                className="flex items-start gap-2"
                data-question={need.id}
                data-testid="at-a-glance-needs-row"
                key={need.id}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stone-100 text-earth-500">
                  <AtAGlanceGlyph icon={need.icon} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-4 text-earth-700">
                    {need.question}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-4 text-earth-600">
                    {need.hint}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* One deep link for the whole section: the metric provenance cards all
          live together in the Report & findings overview. Only meaningful when
          at least one metric is present. */}
      {rows.length > 0 ? (
        <div className="mt-2 flex justify-end">
          <button
            className="inline-flex min-h-7 items-center text-xs font-medium text-seed-700 underline-offset-4 outline-none hover:underline focus:ring-2 focus:ring-seed-500"
            data-testid="at-a-glance-provenance-link"
            onClick={() => revealAnchor("overview")}
            type="button"
          >
            What we counted →
          </button>
        </div>
      ) : null}
    </section>
  );
}

function AtAGlanceRow({
  icon,
  metric,
  question,
  rowId,
}: {
  icon: AtAGlanceIcon;
  metric: SummaryMetric;
  question: string;
  rowId: string;
}) {
  return (
    <div
      className="py-2.5 first:pt-1 last:pb-1"
      data-testid="at-a-glance-row"
      data-question={rowId}
    >
      <dt className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-seed-50 text-seed-700">
          <AtAGlanceGlyph icon={icon} />
        </span>
        <span className="min-w-0 flex-1 text-xs font-semibold leading-4 text-seed-950">
          {question}
        </span>
      </dt>
      <dd className="mt-1 pl-9">
        <span className="font-serif text-2xl font-bold tabular-nums leading-none text-seed-950">
          {metric.value}
        </span>
        {/* Provenance stays disclosed as a light caption under the value. */}
        <span className="mt-0.5 block text-[12px] font-medium text-earth-600">
          {provenanceLabels[metric.provenance]}
        </span>
      </dd>
    </div>
  );
}

/**
 * App-drawn decorative mark per question, in Seed/Earth line geometry (inherits
 * `currentColor`). Decorative only — `aria-hidden`, no status meaning.
 */
function AtAGlanceGlyph({ icon }: { icon: AtAGlanceIcon }) {
  const paths: Record<AtAGlanceIcon, ReactElement> = {
    // Sprout — what's left, growing.
    "cash-flow": (
      <>
        <path d="M12 21v-9" strokeLinecap="round" />
        <path d="M12 13c-3 0-5-1.8-5-4.8 3 0 5 1.8 5 4.8Z" />
        <path d="M12 11.5c0-2.8 2-4.6 4.8-4.6 0 2.8-2 4.6-4.8 4.6Z" />
      </>
    ),
    // Shield — a cushion against an income gap.
    resilience: (
      <path d="M12 3.5l6.5 2.6v4.4c0 3.7-2.7 6.4-6.5 8.2-3.8-1.8-6.5-4.5-6.5-8.2V6.1L12 3.5Z" />
    ),
    // Balance — obligations weighed.
    debt: (
      <>
        <path d="M12 4.5v15" strokeLinecap="round" />
        <path d="M6 8.5h12" strokeLinecap="round" />
        <path d="M6 8.5l-2.5 4.5a2.5 2.5 0 005 0L6 8.5Z" />
        <path d="M18 8.5l-2.5 4.5a2.5 2.5 0 005 0L18 8.5Z" />
        <path d="M8.5 19.5h7" strokeLinecap="round" />
      </>
    ),
    // Concentric circles — accumulated worth, the seed-growth motif.
    "net-worth": (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3.4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      {paths[icon]}
    </svg>
  );
}
