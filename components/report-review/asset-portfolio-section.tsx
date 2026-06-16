import type {
  DecisionReadiness,
  PortfolioNote,
  ReportReviewSample,
  SnapshotItem,
  SummaryMetric,
} from "@/data/report-review-sample";
import {
  educationTopicAnchor,
  resolveEducationTopic,
} from "@/lib/report-review/education-topics";

import {
  provenanceLabels,
  ProvenanceTag,
  ReviewSectionHeading,
  StatusPill,
} from "./shared";

export function AssetPortfolioSection({
  decisionReadiness,
  portfolio,
}: {
  decisionReadiness: DecisionReadiness;
  portfolio: ReportReviewSample["assetPortfolio"];
}) {
  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-heading"
      className="space-y-3"
    >
      <ReviewSectionHeading
        eyebrow="Workspace snapshot"
        title="Personal asset portfolio"
        description="Assets, liabilities, liquidity, and decision-slice readiness stay separate from report findings."
        id="portfolio-heading"
      />

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {portfolio.totals.map((metric) => (
            <PortfolioMetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <SnapshotTable
            description="Current asset balances grouped by liquidity."
            descriptionId="assets-snapshot-description"
            items={portfolio.assets}
            title="Assets"
          />
          <SnapshotTable
            description="Current debt balances grouped by obligation type."
            descriptionId="liabilities-snapshot-description"
            items={portfolio.liabilities}
            title="Liabilities"
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {portfolio.notes.map((note) => (
            <PortfolioNoteCard key={note.id} note={note} />
          ))}
        </div>
      </div>

      <DecisionReadinessCard decisionReadiness={decisionReadiness} />
    </section>
  );
}

function PortfolioMetricCard({ metric }: { metric: SummaryMetric }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-earth-700">{metric.label}</h3>
        <ProvenanceTag provenance={metric.provenance} />
      </div>
      <p className="mt-3 text-xl font-semibold tabular-nums text-seed-950">
        {metric.value}
      </p>
      <p className="mt-2 text-sm leading-6 text-earth-700">{metric.detail}</p>
    </article>
  );
}

function SnapshotTable({
  description,
  descriptionId,
  items,
  title,
}: {
  description: string;
  descriptionId: string;
  items: SnapshotItem[];
  title: string;
}) {
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-semibold text-seed-950">{title}</h3>
      <p id={descriptionId} className="mt-1 text-sm leading-6 text-earth-700">
        {description}
      </p>
      <div className="mt-3 overflow-x-auto rounded-lg border border-stone-200">
        <table
          aria-describedby={descriptionId}
          className="min-w-full divide-y divide-stone-200 text-left text-sm"
        >
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
                Emergency reserve
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 bg-white">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3 align-top">
                  <div className="font-medium text-seed-950">{item.name}</div>
                  <div className="mt-1 text-xs text-earth-600">
                    {item.category}
                  </div>
                </td>
                <td className="px-3 py-3 align-top font-medium tabular-nums text-seed-950">
                  {item.value}
                </td>
                <td className="px-3 py-3 align-top text-earth-700">
                  {item.liquidity}
                </td>
                <td className="px-3 py-3 align-top text-earth-700">
                  {item.emergencyEligible ? "Counts" : "Excluded"}
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

function PortfolioNoteCard({ note }: { note: PortfolioNote }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <h3 className="text-sm font-semibold text-seed-950">{note.title}</h3>
      <p className="mt-2 text-sm leading-6 text-earth-700">{note.body}</p>
    </article>
  );
}

function DecisionReadinessCard({
  decisionReadiness,
}: {
  decisionReadiness: DecisionReadiness;
}) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-seed-700">
            First decision slice
          </p>
          <h3 className="mt-1 text-lg font-semibold text-seed-950">
            {decisionReadiness.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-earth-700">
            {decisionReadiness.explanation}
          </p>
        </div>
        <StatusPill label={decisionReadiness.status} tone="stone" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-seed-950">
            Available inputs
          </h4>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {decisionReadiness.availableInputs.map((input) => (
              <div
                key={input.id}
                className="rounded-lg border border-stone-200 bg-stone-50 p-3"
              >
                <dt className="text-sm font-medium text-earth-700">
                  {input.label}
                </dt>
                <dd className="mt-2 flex flex-col gap-2">
                  <span className="font-semibold tabular-nums text-seed-950">
                    {input.value}
                  </span>
                  <ProvenanceTag provenance={input.provenance} />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-seed-950">
            Missing optional context
          </h4>
          <ul className="mt-3 space-y-3">
            {decisionReadiness.missingInputs.map((input) => (
              <li
                key={input.id}
                className="rounded-lg border border-stone-200 bg-stone-50 p-3"
              >
                <p className="text-sm font-medium text-seed-950">
                  {input.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-earth-700">
                  {input.whyItMatters}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {decisionReadiness.educationTopics.length > 0 ? (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <h4 className="text-sm font-semibold text-seed-950">
            Related education
          </h4>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {decisionReadiness.educationTopics.map((id) => {
              const topic = resolveEducationTopic(id);

              return (
                <li key={id}>
                  <a
                    className="inline-flex min-h-8 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 font-medium text-earth-800 hover:border-seed-200 hover:bg-seed-50 hover:text-seed-900 focus:outline-none focus:ring-2 focus:ring-seed-500"
                    href={`#${educationTopicAnchor(id)}`}
                  >
                    {topic.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 border-t border-stone-200 pt-4">
        <h4 className="text-sm font-semibold text-seed-950">Limits</h4>
        <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
          {decisionReadiness.limitations.map((limitation, index) => (
            <li key={`${limitation}-${index}`}>{limitation}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
