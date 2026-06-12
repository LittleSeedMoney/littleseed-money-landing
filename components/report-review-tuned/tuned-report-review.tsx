import Link from "next/link";

import { EvidenceSection } from "@/components/report-review/evidence-section";
import { FindingsSection } from "@/components/report-review/findings-section";
import { InputsSection } from "@/components/report-review/inputs-section";
import { ReportSections } from "@/components/report-review/report-sections";
import { SeedMark } from "@/components/seed-mark";
import {
  type Provenance,
  type ReportReviewSample,
  type SummaryMetric,
  reportReviewSample,
} from "@/data/report-review-sample";

const generatedAt = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
}).format(new Date(reportReviewSample.generatedAt));

const sourceById = new Map(
  reportReviewSample.evidenceSources.map((source) => [source.id, source]),
);

const navItems = [
  ["Overview", "#overview"],
  ["Sections", "#sections"],
  ["Findings", "#findings"],
  ["Evidence", "#evidence"],
  ["Inputs", "#inputs"],
] as const;

const provenanceLabels: Record<Provenance, string> = {
  sample: "Sample",
  "user-entered": "User-entered",
  calculated: "Calculated",
  "source-backed": "Source-backed",
  missing: "Missing context",
};

const metricDetails: Record<
  string,
  {
    calculation: string;
    limitation: string;
    measures: string;
  }
> = {
  "Monthly cash flow": {
    measures: "Money left after reported monthly outflows and contributions.",
    calculation:
      "Reported income minus living expenses, debt payments, and contributions.",
    limitation: "Irregular income and expenses are not normalized here.",
  },
  "Emergency coverage": {
    measures: "How many months reported cash could cover required outflows.",
    calculation: "Emergency-eligible cash divided by required monthly outflows.",
    limitation: "This preview does not set a personalized emergency target.",
  },
  "Debt pressure": {
    measures: "Total reported debt and debt areas that triggered review.",
    calculation: "Reported liability balances grouped by debt type.",
    limitation: "This is not a repayment priority or underwriting ratio.",
  },
  "Net worth": {
    measures: "Reported assets minus reported liabilities.",
    calculation: "Total assets minus total liabilities.",
    limitation: "Taxes, selling costs, penalties, and market movement are excluded.",
  },
  "Known contributions": {
    measures: "Employee and employer contributions in the sample profile.",
    calculation: "Monthly employee and employer contributions summed together.",
    limitation: "Eligibility, limits, vesting, and tax treatment are not validated.",
  },
  "Data completeness": {
    measures: "Whether unknown inputs limit the interpretation.",
    calculation: "Known missing fields and unmeasured categories reviewed together.",
    limitation: "Missing optional values are not treated as zero.",
  },
};

export function TunedReportReview() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-stone-900">
      <TunedHeader />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:px-8">
        <TunedNav />

        <div className="min-w-0 space-y-7">
          <TunedOverview report={reportReviewSample} />
          <ReportSections
            sections={reportReviewSample.sections}
            sourceById={sourceById}
          />
          <FindingsSection findings={reportReviewSample.findings} />
          <EvidenceSection sources={reportReviewSample.evidenceSources} />
          <InputsSection snapshot={reportReviewSample.assetSnapshot} />
        </div>

        <TunedRail report={reportReviewSample} />
      </div>
    </main>
  );
}

function TunedHeader() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link
          href="/"
          className="flex w-fit items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-seed-500 focus:ring-offset-2"
          aria-label="LittleSeed Money home"
        >
          <SeedMark className="h-9 w-9 text-seed-600" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-seed-800">
              LittleSeed Money
            </p>
            <h1 className="text-xl font-semibold text-stone-950">
              Report review
            </h1>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <StatusPill label="Private review" tone="seed" />
          <StatusPill label="In-session only" tone="stone" />
          <StatusPill label="Sample data" tone="warm" />
        </div>
      </div>
    </header>
  );
}

function TunedNav() {
  return (
    <aside className="hidden lg:block">
      <nav
        aria-label="Report review sections"
        className="sticky top-6 space-y-1 text-sm"
      >
        {navItems.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="block rounded-lg px-3 py-2 font-medium text-stone-600 hover:bg-white hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-seed-500"
          >
            {label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

function TunedOverview({ report }: { report: ReportReviewSample }) {
  return (
    <section id="overview" aria-labelledby="overview-heading" className="space-y-4">
      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-seed-700">
              {report.profileName}
            </p>
            <h2
              id="overview-heading"
              className="mt-1 text-2xl font-semibold text-stone-950"
            >
              Financial health report review
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {report.summaryMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
    </section>
  );
}

function MetricCard({ metric }: { metric: SummaryMetric }) {
  const detail = metricDetails[metric.label];

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-700">{metric.label}</h3>
        <ProvenanceTag provenance={metric.provenance} />
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-stone-950">
        {metric.value}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-700">{metric.detail}</p>

      {detail ? (
        <details className="mt-4 rounded-lg border border-stone-200 bg-stone-50">
          <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-semibold text-seed-800 outline-none focus:ring-2 focus:ring-seed-500">
            Metric details
          </summary>
          <dl className="space-y-3 border-t border-stone-200 px-3 py-3 text-sm leading-6">
            <DetailItem label="Measures" value={detail.measures} />
            <DetailItem label="Calculation" value={detail.calculation} />
            <DetailItem label="Limit" value={detail.limitation} />
          </dl>
        </details>
      ) : null}
    </article>
  );
}

function TunedRail({ report }: { report: ReportReviewSample }) {
  return (
    <aside className="min-w-0 space-y-4">
      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-950">Review state</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <MetaItem label="Data mode" value={report.dataMode} />
          <MetaItem label="Completeness" value={report.dataCompleteness.status} />
          <MetaItem label="Persistence" value="In-session only" />
        </dl>
        <p className="mt-4 text-sm leading-6 text-stone-700">
          {report.dataCompleteness.explanation}
        </p>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-950">Missing context</h2>
        {report.dataCompleteness.missingContext.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
            {report.dataCompleteness.missingContext.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-stone-700">
            No explicit missing user fields were recorded for this sample.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-950">Uncertainty</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
          {report.dataCompleteness.uncertainty.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "seed" | "stone" | "warm";
}) {
  const toneClass = {
    seed: "border-seed-200 bg-seed-50 text-seed-800",
    stone: "border-stone-200 bg-stone-100 text-stone-700",
    warm: "border-amber-200 bg-amber-50 text-amber-950",
  }[tone];

  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-lg border px-3 text-xs font-semibold ${toneClass}`}
    >
      {label}
    </span>
  );
}

function ProvenanceTag({ provenance }: { provenance: Provenance }) {
  const isMissing = provenance === "missing";

  return (
    <span
      className={`rounded-lg border px-2 py-1 text-xs font-medium ${
        isMissing
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-stone-200 bg-white text-stone-700"
      }`}
    >
      {provenanceLabels[provenance]}
    </span>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 break-words font-medium text-stone-950">{value}</dd>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 text-stone-700">{value}</dd>
    </div>
  );
}
