import type {
  DecisionReadiness,
  EvidenceSource,
  PortfolioNote,
  ReportReviewSample,
  SnapshotItem,
  SummaryMetric,
} from "@/data/report-review-sample";

import {
  EducationTopicLink,
  provenanceLabels,
  ProvenanceTag,
  ReviewSectionHeading,
  StatusPill,
} from "./shared";

export function AssetPortfolioSection({
  decisionReadiness,
  portfolio,
  sourceById,
}: {
  decisionReadiness: DecisionReadiness;
  portfolio: ReportReviewSample["assetPortfolio"];
  sourceById: ReadonlyMap<string, EvidenceSource>;
}) {
  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-heading"
      className="scroll-mt-28 space-y-3"
    >
      <ReviewSectionHeading
        eyebrow="Workspace snapshot"
        title="Personal asset portfolio"
        description="Assets, liabilities, liquidity, and decision-slice readiness stay separate from report findings."
        id="portfolio-heading"
      />

      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {portfolio.totals.map((metric) => (
            <PortfolioMetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
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

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {portfolio.notes.map((note) => (
            <PortfolioNoteCard key={note.id} note={note} />
          ))}
        </div>
      </div>

      <DecisionReadinessCard
        decisionReadiness={decisionReadiness}
        sourceById={sourceById}
      />
    </section>
  );
}

function PortfolioMetricCard({ metric }: { metric: SummaryMetric }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-stone-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-earth-700">{metric.label}</h3>
        <ProvenanceTag provenance={metric.provenance} />
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums text-seed-950">
        {metric.value}
      </p>
      <p className="mt-1 text-sm leading-6 text-earth-700">{metric.detail}</p>
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
      <p id={descriptionId} className="mt-0.5 text-sm leading-6 text-earth-700">
        {description}
      </p>
      <div className="mt-2 overflow-x-auto rounded-lg border border-stone-200">
        <table
          aria-describedby={descriptionId}
          className="min-w-full divide-y divide-stone-200 text-left text-sm"
        >
          <thead className="bg-stone-50 text-xs font-semibold text-earth-500">
            <tr>
              <th scope="col" className="px-3 py-2">
                Name
              </th>
              <th scope="col" className="px-3 py-2">
                Value
              </th>
              <th scope="col" className="px-3 py-2">
                Liquidity
              </th>
              <th scope="col" className="px-3 py-2">
                Emergency reserve
              </th>
              <th scope="col" className="px-3 py-2">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 bg-white">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2.5 align-top">
                  <div className="font-medium text-seed-950">{item.name}</div>
                  <div className="mt-1 text-xs text-earth-600">
                    {item.category}
                  </div>
                </td>
                <td className="px-3 py-2.5 align-top font-medium tabular-nums text-seed-950">
                  {item.value}
                </td>
                <td className="px-3 py-2.5 align-top text-earth-700">
                  {item.liquidity}
                </td>
                <td className="px-3 py-2.5 align-top text-earth-700">
                  {item.emergencyEligible ? "Counts" : "Excluded"}
                </td>
                <td className="px-3 py-2.5 align-top text-earth-700">
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
    <article className="rounded-lg border border-stone-200 bg-stone-50 p-3">
      <h3 className="text-sm font-semibold text-seed-950">{note.title}</h3>
      <p className="mt-1 text-sm leading-6 text-earth-700">{note.body}</p>
    </article>
  );
}

function DecisionReadinessCard({
  decisionReadiness,
  sourceById,
}: {
  decisionReadiness: DecisionReadiness;
  sourceById: ReadonlyMap<string, EvidenceSource>;
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

      {decisionReadiness.resultMetrics.length > 0 ? (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <h4 className="text-sm font-semibold text-seed-950">
            Decision output
          </h4>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            {decisionReadiness.resultMetrics.map((metric) => (
              <div key={metric.id} className="min-w-0">
                <dt className="text-sm font-medium text-earth-700">
                  {metric.label}
                </dt>
                <dd className="mt-1">
                  <span className="block break-words font-semibold tabular-nums text-seed-950">
                    {metric.value}
                  </span>
                  <span className="mt-2 inline-flex">
                    <ProvenanceTag provenance={metric.provenance} />
                  </span>
                  {metric.detail ? (
                    <p className="mt-2 text-sm leading-6 text-earth-700">
                      {metric.detail}
                    </p>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {decisionReadiness.userSelectedTarget ? (
        <UserSelectedTargetSummary target={decisionReadiness.userSelectedTarget} />
      ) : null}

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
            {decisionReadiness.educationTopics.map((id) => (
              <li key={id}>
                <EducationTopicLink id={id} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {decisionReadiness.assumptions.length > 0 ? (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <h4 className="text-sm font-semibold text-seed-950">Assumptions</h4>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
            {decisionReadiness.assumptions.map((assumption, index) => (
              <li key={`${assumption}-${index}`}>{assumption}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <DecisionTrace
        decisionReadiness={decisionReadiness}
        sourceById={sourceById}
      />

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

function UserSelectedTargetSummary({
  target,
}: {
  target: NonNullable<DecisionReadiness["userSelectedTarget"]>;
}) {
  return (
    <div className="mt-5 border-t border-stone-200 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-seed-950">
            User-selected target comparison
          </h4>
          <p className="mt-2 text-sm leading-6 text-earth-700">
            {target.alignmentDetail}
          </p>
        </div>
        <StatusPill label={target.alignmentLabel} tone="stone" />
      </div>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-sm font-medium text-earth-700">
            Preference months
          </dt>
          <dd className="mt-1 font-semibold tabular-nums text-seed-950">
            {target.targetMonths}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-earth-700">Target amount</dt>
          <dd className="mt-1 font-semibold tabular-nums text-seed-950">
            {target.targetAmount}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-earth-700">Remaining gap</dt>
          <dd className="mt-1 font-semibold tabular-nums text-seed-950">
            {target.gapAmount}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function DecisionTrace({
  decisionReadiness,
  sourceById,
}: {
  decisionReadiness: DecisionReadiness;
  sourceById: ReadonlyMap<string, EvidenceSource>;
}) {
  return (
    <div className="mt-5 border-t border-stone-200 pt-4">
      <h4 className="text-sm font-semibold text-seed-950">
        Evidence and rule trace
      </h4>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-earth-700">Model version</dt>
          <dd className="mt-1 break-words font-semibold text-seed-950">
            {decisionReadiness.modelVersion}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-earth-700">Guidance registry</dt>
          <dd className="mt-1 break-words font-semibold text-seed-950">
            {decisionReadiness.guidanceRuleVersion}
          </dd>
        </div>
      </dl>

      {decisionReadiness.guidanceRules.length > 0 ? (
        <div className="mt-4">
          <h5 className="text-sm font-semibold text-seed-950">
            Matched guidance rules
          </h5>
          <ul className="mt-2 space-y-3">
            {decisionReadiness.guidanceRules.map((rule) => (
              <li
                key={rule.id}
                className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm"
              >
                <p className="font-medium leading-6 text-seed-950">
                  {rule.allowedPhrasing}
                </p>
                <dl className="mt-2 grid gap-2 text-earth-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-earth-800">Rule</dt>
                    <dd className="break-words">{rule.id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-earth-800">Trigger</dt>
                    <dd className="break-words">{rule.trigger}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-earth-800">Version</dt>
                    <dd className="break-words">{rule.ruleVersion}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-earth-800">Required context</dt>
                    <dd className="break-words">
                      {rule.requiredGuards.join(", ")}
                    </dd>
                  </div>
                </dl>
                <div className="mt-2 flex flex-wrap gap-2">
                  {rule.evidenceSourceIds.map((id) => {
                    const source = sourceById.get(id);

                    return (
                      <span
                        key={id}
                        className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-earth-700"
                      >
                        {source?.publisher ?? id}
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-earth-700">
          No guidance rule matched this decision result, so no approved
          next-step phrasing is active for this snapshot.
        </p>
      )}

      {decisionReadiness.evidenceSourceIds.length > 0 ? (
        <ul className="mt-3 space-y-3 text-sm leading-6">
          {decisionReadiness.evidenceSourceIds.map((id) => {
            const source = sourceById.get(id);

            return (
              <li key={id}>
                {source ? (
                  <>
                    <a
                      className="font-medium text-seed-800 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-seed-500"
                      href={source.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {source.title}
                    </a>
                    <p className="text-earth-700">
                      {source.publisher}. {source.supports}
                    </p>
                  </>
                ) : (
                  <p className="font-medium text-earth-700">{id}</p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-earth-700">
          No evidence source IDs were returned for this decision result.
        </p>
      )}
    </div>
  );
}
