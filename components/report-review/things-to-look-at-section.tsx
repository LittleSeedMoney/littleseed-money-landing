"use client";

import { useState } from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import {
  buildThingsToLookAt,
  THINGS_TO_LOOK_AT_CAP,
  type ThingToLookAt,
} from "@/lib/report-review/things-to-look-at";
import { revealAnchor } from "@/lib/report-review/reveal-anchor";

import { reviewPanelClass, reviewSubtlePanelClass } from "./shared";

/**
 * Deterministic "things to look at" list: plain observations consolidated from
 * existing findings, decision-readiness, and month-over-month spending changes,
 * each with a deep link to the surface that explains it. Observations only —
 * never a directive or a ranked priority. Overflow past the fixed cap is
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
  });

  const total = items.length;
  const visible = showAll ? items : items.slice(0, THINGS_TO_LOOK_AT_CAP);
  const omitted = total - visible.length;

  return (
    <section
      aria-labelledby="things-to-look-at-heading"
      className={reviewPanelClass("scroll-mt-24 p-4")}
      data-testid="things-to-look-at"
      id="things-to-look-at"
    >
      <h2
        className="text-sm font-semibold text-seed-950"
        id="things-to-look-at-heading"
      >
        Things to look at
      </h2>

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
            Neutral observations from values already computed this session — not
            recommendations or a ranked priority.
          </p>
          <ul className="mt-3 space-y-2" data-testid="things-to-look-at-list">
            {visible.map((item) => (
              <ThingRow item={item} key={item.id} />
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-earth-500">
            {total.toLocaleString("en-US")} total · {visible.length} shown
            {omitted > 0 ? ` · ${omitted} more` : ""}
          </p>
          {total > THINGS_TO_LOOK_AT_CAP ? (
            <button
              className="mt-1 inline-flex min-h-7 items-center rounded-md text-xs font-semibold text-seed-700 underline-offset-4 outline-none hover:underline focus:ring-2 focus:ring-seed-500"
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
      className={reviewSubtlePanelClass("flex items-center justify-between gap-3 p-3")}
      data-kind={item.kind}
      data-testid="things-to-look-at-item"
    >
      <span className="min-w-0 text-sm leading-5 text-seed-950">
        {item.observation}
      </span>
      <button
        className="inline-flex min-h-7 shrink-0 items-center rounded-md text-xs font-medium text-seed-700 underline-offset-4 outline-none hover:underline focus:ring-2 focus:ring-seed-500"
        data-testid="things-to-look-at-observed-link"
        onClick={() => revealAnchor(item.anchor)}
        type="button"
      >
        what we observed →
      </button>
    </li>
  );
}
