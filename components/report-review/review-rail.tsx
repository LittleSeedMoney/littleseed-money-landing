import type { ReportReviewSample } from "@/data/report-review-sample";

import {
  dataSourceStatusLabels,
  dataSourceStatusTone,
  MetaItem,
  reviewPanelClass,
  reviewSubtlePanelClass,
  ReviewDisclosure,
  StatusPill,
} from "./shared";

export function ReviewRail({ report }: { report: ReportReviewSample }) {
  return (
    <aside className="min-w-0">
      <section
        aria-labelledby="review-state-heading"
        className={reviewPanelClass("p-3")}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2
            id="review-state-heading"
            className="text-sm font-semibold text-seed-950"
          >
            Review context
          </h2>
          <StatusPill label={report.dataCompleteness.status} tone="stone" />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm lg:grid-cols-1">
          <MetaItem label="Data mode" value={report.dataMode} />
          <MetaItem label="Sources" value={sourceCountLabel(report)} />
          <MetaItem label="Persistence" value="In-session only" />
        </dl>

        <p className="sr-only">
          {report.dataCompleteness.explanation}
        </p>
        <a
          href="#snapshot"
          className="mt-3 inline-flex rounded-md text-sm font-medium text-seed-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-seed-500"
        >
          Snapshot context
        </a>

        <ReviewDisclosure
          className="mt-3 bg-white p-3"
          summary={
            <div>
              <h3 className="text-sm font-semibold text-seed-950">
                Sources
              </h3>
              <p className="sr-only">
                Data source state and external evidence publishers.
              </p>
            </div>
          }
        >
          <ul className="mt-3 space-y-2 text-sm">
            {report.dataSources.map((source) => (
              <li
                className={reviewSubtlePanelClass("p-2.5")}
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
                <p className="mt-1 text-xs leading-5 text-earth-600">
                  {source.freshnessLabel}
                </p>
              </li>
            ))}
          </ul>

          <h3 className="mt-4 text-sm font-semibold text-seed-950">
            Evidence
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm leading-6">
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
        </ReviewDisclosure>
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
