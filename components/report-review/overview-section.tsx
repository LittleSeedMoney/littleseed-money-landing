import type { ReportReviewSample } from "@/data/report-review-sample";

import { MetaItem, ProvenanceTag } from "./shared";

export function OverviewSection({
  generatedAt,
  report,
}: {
  generatedAt: string;
  report: ReportReviewSample;
}) {
  return (
    <section
      id="overview"
      aria-labelledby="overview-heading"
      className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-seed-700">
            {report.profileName}
          </p>
          <h2
            id="overview-heading"
            className="mt-1 text-2xl font-semibold text-earth-950"
          >
            Financial health report review
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-earth-700">
            {report.disclaimer}
          </p>
        </div>

        <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
          <MetaItem label="Status" value={report.reportStatus} />
          <MetaItem label="Generated" value={`${generatedAt} UTC`} />
          <MetaItem label="Schema" value={report.schemaVersion} />
        </dl>
      </div>

      <div
        role="status"
        className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
      >
        Platform API connector is not configured in this slice. Showing sample
        report data for layout review. No user data was sent or saved.
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {report.summaryMetrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-lg border border-stone-200 bg-stone-50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium text-earth-700">
                {metric.label}
              </h3>
              <ProvenanceTag provenance={metric.provenance} />
            </div>
            <p className="mt-3 text-2xl font-semibold text-earth-950">
              {metric.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-earth-700">
              {metric.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
