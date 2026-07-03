"use client";

import { useState, type ReactElement } from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import {
  buildThingsToLookAt,
  THINGS_TO_LOOK_AT_CAP,
  type ThingKind,
  type ThingToLookAt,
} from "@/lib/report-review/things-to-look-at";
import { revealAnchor } from "@/lib/report-review/reveal-anchor";

import { reviewPanelClass } from "./shared";

/**
 * Deterministic "things to look at" list: plain observations consolidated from
 * existing findings, decision-readiness, and month-over-month spending changes,
 * each with a deep link to the surface that explains it. Rendered as a quiet
 * timeline spine — a thin seed-tone line with one app-drawn icon node per
 * observation (icon shape, not color, distinguishes the kind). Observations
 * only — never a directive or a ranked priority. Overflow past the fixed cap is
 * reachable through "see all", with total/shown/omitted disclosed. When nothing
 * qualifies, a calm empty state shows instead of a fabricated concern.
 */
export function ThingsToLookAtSection({
  report,
}: {
  report: ReportReviewSample;
}) {
  const [showAll, setShowAll] = useState(false);

  const items = buildThingsToLookAt({
    findings: report.findings,
    decisionReadiness: report.decisionReadiness,
    chargeInspector: report.chargeInspector,
    summaryMetrics: report.summaryMetrics,
  });

  const total = items.length;
  const visible = showAll ? items : items.slice(0, THINGS_TO_LOOK_AT_CAP);
  const omitted = total - visible.length;

  // The panel "lights up" only when something qualifies: an attention-toned
  // surface (semantic amber, separate from brand colors per the design system)
  // with a left accent bar and elevated shadow, so the one section asking for
  // the user's serious attention is the one tinted panel on the page. With
  // nothing to show it stays a plain quiet panel — the visual weight itself is
  // deterministic. Attention is carried by the surface; the copy stays
  // observational, never alarmist.
  const hasItems = total > 0;

  return (
    <section
      aria-labelledby="things-to-look-at-heading"
      className={
        hasItems
          ? "scroll-mt-24 rounded-lg border border-amber-200 border-l-4 border-l-amber-400 bg-gradient-to-br from-amber-50 to-white p-4 shadow-md"
          : reviewPanelClass("scroll-mt-24 p-4")
      }
      data-testid="things-to-look-at"
      id="things-to-look-at"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          className="font-serif text-base font-bold text-seed-950"
          id="things-to-look-at-heading"
        >
          Things to look at
        </h2>
        {hasItems ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
            <span
              aria-hidden="true"
              className="inline-block size-1.5 rounded-full bg-amber-500"
            />
            {total.toLocaleString("en-US")} to review
            {omitted > 0 ? ` · ${visible.length} shown` : ""}
          </span>
        ) : null}
      </div>

      {total === 0 ? (
        <p
          className="mt-2 text-xs leading-5 text-earth-600"
          data-testid="things-to-look-at-empty"
        >
          Nothing stands out for a closer look from this session&apos;s data. A
          quiet list is not a guarantee that everything is fine — it only
          reflects what these deterministic checks can see.
        </p>
      ) : (
        <>
          <p className="mt-0.5 text-xs text-earth-600">
            Observations, not recommendations.
            <span className="sr-only">
              Neutral observations from values already computed this session —
              never a directive or a ranked priority.
            </span>
          </p>
          <ul className="mt-4" data-testid="things-to-look-at-list">
            {visible.map((item) => (
              <ThingRow item={item} key={item.id} />
            ))}
          </ul>
          {total > THINGS_TO_LOOK_AT_CAP ? (
            <button
              className="mt-2 inline-flex min-h-7 items-center rounded-md pl-11 text-xs font-semibold text-seed-700 underline-offset-4 outline-none hover:underline focus:ring-2 focus:ring-seed-500"
              data-testid="things-to-look-at-see-all"
              onClick={() => setShowAll((current) => !current)}
              type="button"
            >
              {showAll ? "Show fewer" : `See all ${total}`}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

function ThingRow({ item }: { item: ThingToLookAt }) {
  return (
    <li
      className="group relative flex gap-3 pb-4 last:pb-0"
      data-kind={item.kind}
      data-testid="things-to-look-at-item"
    >
      {/* Spine segment connecting this node to the next (hidden on the last). */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-4 top-9 w-px -translate-x-1/2 bg-amber-200 group-last:hidden"
      />
      {/* Node: app-drawn icon chip; the icon shape (not color) marks the kind. */}
      <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-amber-200 bg-amber-100 text-amber-800">
        <ThingKindIcon kind={item.kind} />
      </span>

      {/* One scannable line: short title, then a compact factual detail
          (a dollar delta, a baseline, a summary), truncated to keep each
          observation a single line. */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-0.5 pt-1">
        <p className="min-w-0 flex-1 truncate text-sm leading-6">
          <span className="font-semibold text-seed-950">
            {item.observation}
          </span>
          {item.detail ? (
            <span className="text-earth-600"> — {item.detail}</span>
          ) : null}
        </p>
        <button
          className="inline-flex min-h-6 shrink-0 items-center rounded-md text-xs font-medium text-seed-700 underline-offset-4 outline-none hover:underline focus:ring-2 focus:ring-seed-500"
          data-testid="things-to-look-at-observed-link"
          onClick={() => revealAnchor(item.anchor)}
          type="button"
        >
          what we observed →
        </button>
      </div>
    </li>
  );
}

/**
 * Decorative per-kind mark in the same Seed/Earth line style as the at-a-glance
 * glyphs. aria-hidden; the accessible kind lives on the row's data-kind and the
 * observation text itself.
 */
function ThingKindIcon({ kind }: { kind: ThingKind }) {
  const paths: Record<ThingKind, ReactElement> = {
    // Magnifier — something the report found.
    finding: (
      <>
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="M14.8 14.8L20 20" strokeLinecap="round" />
      </>
    ),
    // Shield — resilience/coverage context.
    readiness: (
      <path d="M12 3.5l6.5 2.6v4.4c0 3.7-2.7 6.4-6.5 8.2-3.8-1.8-6.5-4.5-6.5-8.2V6.1L12 3.5Z" />
    ),
    // Trend line — a month-over-month movement.
    "spending-change": (
      <>
        <path d="M4 16l4.5-4.5 3 3L18 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.5 8H18v3.5" strokeLinecap="round" strokeLinejoin="round" />
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
      {paths[kind]}
    </svg>
  );
}
