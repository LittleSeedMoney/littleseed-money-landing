import type {
  MetricDisclosure,
  ReportReviewSample,
  SummaryMetric,
} from "@/data/report-review-sample";

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
            className="mt-1 text-2xl font-semibold text-seed-950"
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
        className={`mt-5 rounded-lg border px-4 py-3 text-sm leading-6 ${noticeToneClass(
          report.connectionNotice.tone,
        )}`}
      >
        {report.connectionNotice.message}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {report.summaryMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
}

function noticeToneClass(tone: ReportReviewSample["connectionNotice"]["tone"]) {
  return {
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    red: "border-red-200 bg-red-50 text-red-950",
    seed: "border-seed-200 bg-seed-50 text-seed-950",
  }[tone];
}

function MetricCard({ metric }: { metric: SummaryMetric }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-earth-700">{metric.label}</h3>
        <ProvenanceTag provenance={metric.provenance} />
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-seed-950">
        {metric.value}
      </p>
      <p className="mt-2 text-sm leading-6 text-earth-700">{metric.detail}</p>

      {metric.disclosure ? (
        <MetricDisclosureDetails disclosure={metric.disclosure} />
      ) : null}
    </article>
  );
}

function MetricDisclosureDetails({
  disclosure,
}: {
  disclosure: MetricDisclosure;
}) {
  return (
    <details className="mt-4 rounded-lg border border-stone-200 bg-white">
      <summary className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-seed-800 outline-none focus:ring-2 focus:ring-seed-500">
        Metric details
      </summary>
      <dl className="space-y-3 border-t border-stone-200 px-3 py-3 text-sm leading-6">
        <DetailItem label="Measures" value={disclosure.measures} />
        <DetailItem label="Calculation" value={disclosure.calculation} />
        <DetailList label="Assumptions" values={disclosure.assumptions} />
        <DetailList label="Limitations" values={disclosure.limitations} />
      </dl>
    </details>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-earth-500">
        {label}
      </dt>
      <dd className="mt-1 text-earth-700">{value}</dd>
    </div>
  );
}

function DetailList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-earth-500">
        {label}
      </dt>
      <dd className="mt-1">
        <ul className="space-y-1 text-earth-700">
          {values.map((value, index) => (
            <li key={`${value}-${index}`}>{value}</li>
          ))}
        </ul>
      </dd>
    </div>
  );
}
