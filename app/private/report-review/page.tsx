import Link from "next/link";

import { SeedMark } from "@/components/seed-mark";
import {
  type EvidenceSource,
  type Provenance,
  type SnapshotItem,
  reportReviewSample,
} from "@/data/report-review-sample";

export const metadata = {
  title: "Report review | LittleSeed Money",
  description:
    "Private report review surface for validating financial health report structure, evidence, and uncertainty.",
};

const provenanceLabels: Record<Provenance, string> = {
  sample: "Sample",
  "user-entered": "User-entered",
  calculated: "Calculated",
  "source-backed": "Source-backed",
  missing: "Missing context",
};

const generatedAt = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
}).format(new Date(reportReviewSample.generatedAt));

export default function ReportReviewPage() {
  const sourceById = new Map(
    reportReviewSample.evidenceSources.map((source) => [source.id, source]),
  );

  return (
    <main className="min-h-screen bg-stone-50 text-earth-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link
            href="/"
            className="flex w-fit items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-seed-500 focus:ring-offset-2"
            aria-label="LittleSeed Money home"
          >
            <SeedMark className="h-9 w-9 text-seed-600" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-seed-700">
                LittleSeed Money
              </p>
              <h1 className="text-xl font-semibold text-earth-900">
                Report review
              </h1>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusPill label="Private review" tone="earth" />
            <StatusPill label="In-session only" tone="seed" />
            <StatusPill label="Sample data" tone="stone" />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:px-8">
        <aside className="hidden lg:block">
          <nav
            aria-label="Report review sections"
            className="sticky top-6 space-y-1 text-sm"
          >
            {[
              ["Overview", "#overview"],
              ["Sections", "#sections"],
              ["Findings", "#findings"],
              ["Evidence", "#evidence"],
              ["Inputs", "#inputs"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="block rounded-lg px-3 py-2 font-medium text-earth-700 hover:bg-white hover:text-earth-950 focus:outline-none focus:ring-2 focus:ring-seed-500"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          <section
            id="overview"
            aria-labelledby="overview-heading"
            className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-seed-700">
                  {reportReviewSample.profileName}
                </p>
                <h2
                  id="overview-heading"
                  className="mt-1 text-2xl font-semibold text-earth-950"
                >
                  Financial health report review
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-earth-700">
                  {reportReviewSample.disclaimer}
                </p>
              </div>

              <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
                <MetaItem label="Status" value={reportReviewSample.reportStatus} />
                <MetaItem label="Generated" value={`${generatedAt} UTC`} />
                <MetaItem label="Schema" value={reportReviewSample.schemaVersion} />
              </dl>
            </div>

            <div
              role="status"
              className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
            >
              Platform API connector is not configured in this slice. Showing
              sample report data for layout review. No user data was sent or
              saved.
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {reportReviewSample.summaryMetrics.map((metric) => (
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

          <section
            id="sections"
            aria-labelledby="sections-heading"
            className="space-y-3"
          >
            <SectionHeading
              eyebrow="Report body"
              title="Question-led sections"
              description="Each block starts with the user question, then separates the answer, source footing, and limitations."
              id="sections-heading"
            />

            {reportReviewSample.sections.map((section) => (
              <article
                key={section.id}
                className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-seed-700">
                      {section.evidenceLevel}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-earth-950">
                      {section.question}
                    </h3>
                  </div>
                  <span className="rounded-lg border border-stone-200 px-3 py-1 text-xs font-medium text-earth-700">
                    {section.id.replaceAll("_", " ")}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-earth-800">
                  {section.answer}
                </p>

                <div className="mt-4 grid gap-4 border-t border-stone-200 pt-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-earth-950">
                      Source footing
                    </h4>
                    {section.evidenceSourceIds.length > 0 ? (
                      <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
                        {section.evidenceSourceIds.map((sourceId) => {
                          const source = sourceById.get(sourceId);

                          return (
                            <li key={sourceId}>
                              {source ? source.title : sourceId}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-earth-700">
                        Calculation-only section. No official guidance claim is
                        attached.
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-earth-950">
                      Limitations
                    </h4>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
                      {section.limitations.map((limitation) => (
                        <li key={limitation}>{limitation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section
            id="findings"
            aria-labelledby="findings-heading"
            className="space-y-3"
          >
            <SectionHeading
              eyebrow="Review queue"
              title="Findings"
              description="Findings identify areas to review. They do not rank actions or turn education into personalized advice."
              id="findings-heading"
            />

            {reportReviewSample.findings.map((finding) => (
              <article
                key={finding.id}
                className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-earth-950">
                      {finding.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-earth-700">
                      {finding.summary}
                    </p>
                  </div>
                  <StatusPill label="Education only" tone="seed" />
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <InfoList title="Why it matters" items={[finding.whyItMatters]} />
                  <InfoList title="Review options" items={finding.options} />
                  <InfoList title="Limitations" items={finding.limitations} />
                  <InfoList
                    title="Education topics"
                    items={finding.educationTopics}
                  />
                </div>
              </article>
            ))}
          </section>

          <section
            id="evidence"
            aria-labelledby="evidence-heading"
            className="space-y-3"
          >
            <SectionHeading
              eyebrow="Traceability"
              title="Evidence sources"
              description="Source cards make the publisher, reviewed date, support, and limitation visible before report copy is considered complete."
              id="evidence-heading"
            />

            <div className="grid gap-3 xl:grid-cols-2">
              {reportReviewSample.evidenceSources.map((source) => (
                <EvidenceCard key={source.id} source={source} />
              ))}
            </div>
          </section>

          <section
            id="inputs"
            aria-labelledby="inputs-heading"
            className="space-y-3"
          >
            <SectionHeading
              eyebrow="Inputs"
              title="Snapshot and uncertainty"
              description="The surface keeps known values, missing context, and unmeasured categories separate."
              id="inputs-heading"
            />

            <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-3">
                {reportReviewSample.assetSnapshot.totals.map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-lg border border-stone-200 bg-stone-50 p-4"
                  >
                    <h3 className="text-sm font-medium text-earth-700">
                      {metric.label}
                    </h3>
                    <p className="mt-2 text-xl font-semibold text-earth-950">
                      {metric.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-earth-700">
                      {metric.detail}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <SnapshotTable
                  title="Assets"
                  items={reportReviewSample.assetSnapshot.assets}
                />
                <SnapshotTable
                  title="Liabilities"
                  items={reportReviewSample.assetSnapshot.liabilities}
                />
              </div>
            </div>
          </section>
        </div>

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
              <MetaItem label="Data mode" value={reportReviewSample.dataMode} />
              <MetaItem
                label="Completeness"
                value={reportReviewSample.dataCompleteness.status}
              />
              <MetaItem label="Persistence" value="In-session only" />
            </dl>
            <p className="mt-4 text-sm leading-6 text-earth-700">
              {reportReviewSample.dataCompleteness.explanation}
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
            {reportReviewSample.dataCompleteness.missingContext.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm leading-6 text-earth-700">
                {reportReviewSample.dataCompleteness.missingContext.map((item) => (
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
              {reportReviewSample.dataCompleteness.uncertainty.map((item) => (
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
              {reportReviewSample.dataCompleteness.potentiallyUnmeasuredCategories.map(
                (item) => (
                  <li key={item}>{item}</li>
                ),
              )}
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
              {reportReviewSample.evidenceSources.map((source) => (
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
      </div>
    </main>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "earth" | "seed" | "stone";
}) {
  const toneClass = {
    earth: "border-earth-200 bg-earth-50 text-earth-800",
    seed: "border-seed-200 bg-seed-50 text-seed-800",
    stone: "border-stone-200 bg-stone-100 text-earth-700",
  }[tone];

  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-lg border px-3 text-xs font-semibold ${toneClass}`}
    >
      {label}
    </span>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.14em] text-earth-500">
        {label}
      </dt>
      <dd className="mt-1 break-words font-medium text-earth-900">{value}</dd>
    </div>
  );
}

function ProvenanceTag({ provenance }: { provenance: Provenance }) {
  const isMissing = provenance === "missing";

  return (
    <span
      className={`rounded-lg border px-2 py-1 text-xs font-medium ${
        isMissing
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-stone-200 bg-white text-earth-700"
      }`}
    >
      {provenanceLabels[provenance]}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description: string;
  id: string;
}) {
  return (
    <div className="pt-2">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-seed-700">
        {eyebrow}
      </p>
      <h2 id={id} className="mt-1 text-xl font-semibold text-earth-950">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-earth-700">
        {description}
      </p>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-earth-950">{title}</h4>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceCard({ source }: { source: EvidenceSource }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-seed-700">{source.publisher}</p>
      <h3 className="mt-1 text-base font-semibold text-earth-950">
        <a
          href={source.url}
          className="underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-seed-500"
          rel="noreferrer"
          target="_blank"
        >
          {source.title}
        </a>
      </h3>
      <dl className="mt-4 text-sm">
        <MetaItem label="Reviewed" value={source.reviewedOn} />
      </dl>
      <p className="mt-4 text-sm leading-6 text-earth-800">{source.supports}</p>
      <div className="mt-4">
        <InfoList title="Limitations" items={source.limitations} />
      </div>
    </article>
  );
}

function SnapshotTable({
  title,
  items,
}: {
  title: string;
  items: SnapshotItem[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-earth-950">{title}</h3>
      <div className="mt-3 overflow-x-auto rounded-lg border border-stone-200">
        <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-[0.12em] text-earth-500">
            <tr>
              <th scope="col" className="px-3 py-3 font-semibold">
                Name
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Value
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Liquidity
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 bg-white">
            {items.map((item) => (
              <tr key={item.name}>
                <td className="px-3 py-3 align-top">
                  <div className="font-medium text-earth-950">{item.name}</div>
                  <div className="mt-1 text-xs text-earth-600">
                    {item.category}
                  </div>
                </td>
                <td className="px-3 py-3 align-top font-medium text-earth-950">
                  {item.value}
                </td>
                <td className="px-3 py-3 align-top text-earth-700">
                  {item.liquidity}
                </td>
                <td className="px-3 py-3 align-top text-earth-700">
                  {provenanceLabels[item.provenance]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
