import type { ReportReviewSample } from "@/data/report-review-sample";

import {
  dataSourceStatusLabels,
  dataSourceStatusTone,
  MetaItem,
  reviewPanelClass,
  reviewSubtlePanelClass,
  StatusPill,
} from "./shared";

export function ReviewRail({ report }: { report: ReportReviewSample }) {
  return (
    <aside className="min-w-0 space-y-4">
      <section
        aria-labelledby="review-state-heading"
        className={reviewPanelClass("p-4")}
      >
        <h2
          id="review-state-heading"
          className="text-sm font-semibold text-seed-950"
        >
          Review state
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <MetaItem label="Data mode" value={report.dataMode} />
          <MetaItem label="Completeness" value={report.dataCompleteness.status} />
          <MetaItem label="Sources" value={sourceCountLabel(report)} />
          <MetaItem label="Persistence" value="In-session only" />
        </dl>
        <p className="mt-4 text-sm leading-6 text-earth-700">
          {report.dataCompleteness.explanation}
        </p>
        <a
          href="#inputs"
          className="mt-4 inline-flex rounded-lg text-sm font-medium text-seed-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-seed-500"
        >
          Review context and uncertainty
        </a>
      </section>

      <section
        aria-labelledby="data-source-state-heading"
        className={reviewPanelClass("p-4")}
      >
        <h2
          id="data-source-state-heading"
          className="text-sm font-semibold text-seed-950"
        >
          Data source state
        </h2>
        <ul className="mt-3 space-y-3 text-sm">
          {report.dataSources.map((source) => (
            <li
              className={reviewSubtlePanelClass("p-3")}
              key={source.id}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 font-medium text-seed-950">
                  {source.label}
                </p>
                <StatusPill
                  label={dataSourceStatusLabels[source.status]}
                  tone={dataSourceStatusTone(source.status)}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-earth-600">
                {source.freshnessLabel}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="quick-sources-heading"
        className={reviewPanelClass("p-4")}
      >
        <h2
          id="quick-sources-heading"
          className="text-sm font-semibold text-seed-950"
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

function sourceCountLabel(report: ReportReviewSample) {
  const activeCount = report.dataSources.filter(
    (source) => source.status === "active",
  ).length;

  return `${activeCount.toLocaleString("en-US")} active / ${report.dataSources.length.toLocaleString("en-US")} mapped`;
}
