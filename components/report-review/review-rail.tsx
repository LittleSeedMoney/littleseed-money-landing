import type { ReportReviewSample } from "@/data/report-review-sample";

import { MetaItem } from "./shared";

export function ReviewRail({ report }: { report: ReportReviewSample }) {
  return (
    <aside className="min-w-0 space-y-4">
      <section
        aria-labelledby="review-state-heading"
        className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
      >
        <h2
          id="review-state-heading"
          className="text-sm font-semibold text-earth-950"
        >
          Review state
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <MetaItem label="Data mode" value={report.dataMode} />
          <MetaItem label="Completeness" value={report.dataCompleteness.status} />
          <MetaItem label="Persistence" value="In-session only" />
        </dl>
        <p className="mt-4 text-sm leading-6 text-earth-700">
          {report.dataCompleteness.explanation}
        </p>
      </section>

      <section
        aria-labelledby="missing-context-heading"
        className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
      >
        <h2
          id="missing-context-heading"
          className="text-sm font-semibold text-earth-950"
        >
          Missing context
        </h2>
        {report.dataCompleteness.missingContext.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm leading-6 text-earth-700">
            {report.dataCompleteness.missingContext.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-earth-700">
            No explicit missing user fields were recorded for this sample.
          </p>
        )}
      </section>

      <section
        aria-labelledby="uncertainty-heading"
        className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
      >
        <h2
          id="uncertainty-heading"
          className="text-sm font-semibold text-earth-950"
        >
          Uncertainty
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-earth-700">
          {report.dataCompleteness.uncertainty.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="unmeasured-heading"
        className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
      >
        <h2
          id="unmeasured-heading"
          className="text-sm font-semibold text-earth-950"
        >
          Possibly unmeasured
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-earth-700">
          {report.dataCompleteness.potentiallyUnmeasuredCategories.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="quick-sources-heading"
        className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
      >
        <h2
          id="quick-sources-heading"
          className="text-sm font-semibold text-earth-950"
        >
          Quick sources
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-6">
          {report.evidenceSources.map((source) => (
            <li key={source.id}>
              <a
                href={source.url}
                className="font-medium text-seed-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-seed-500"
                rel="noreferrer"
                target="_blank"
              >
                {source.publisher}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
