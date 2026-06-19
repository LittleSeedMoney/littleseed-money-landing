import type {
  DecisionReadiness,
  EvidenceSource,
  PortfolioNote,
  ReportReviewSample,
  SummaryMetric,
} from "@/data/report-review-sample";

import {
  EducationTopicLink,
  ProvenanceTag,
  ReviewSectionHeading,
  StatusPill,
} from "./shared";
import { PortfolioSnapshotList } from "./portfolio-snapshot-list";

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

        <div className="mt-4 space-y-4">
          <PortfolioSnapshotList
            description="Current asset balances grouped by liquidity."
            descriptionId="assets-snapshot-description"
            items={portfolio.assets}
            title="Assets"
          />
          <PortfolioSnapshotList
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

function PortfolioNoteCard({ note }: { note: PortfolioNote }) {
  return (
    <details className="rounded-lg border border-stone-200 bg-stone-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-seed-950 outline-none focus:ring-2 focus:ring-seed-500">
        {note.title}
      </summary>
      <p className="mt-1 text-sm leading-6 text-earth-700">{note.body}</p>
    </details>
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
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-semibold text-seed-700 outline-none underline-offset-4 hover:underline focus:ring-2 focus:ring-seed-500">
                        Detail
                      </summary>
                      <p className="mt-2 text-sm leading-6 text-earth-700">
                        {metric.detail}
                      </p>
                    </details>
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

        <details className="rounded-md border border-stone-200 bg-stone-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-seed-950 outline-none focus:ring-2 focus:ring-seed-500">
            Missing optional context
          </summary>
          <ul className="mt-3 space-y-3">
            {decisionReadiness.missingInputs.map((input) => (
              <li
                key={input.id}
                className="rounded-lg border border-stone-200 bg-white p-3"
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
        </details>
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
        <details className="mt-5 border-t border-stone-200 pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-seed-950 outline-none focus:ring-2 focus:ring-seed-500">
            Assumptions
          </summary>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
            {decisionReadiness.assumptions.map((assumption, index) => (
              <li key={`${assumption}-${index}`}>{assumption}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <DecisionTrace
        decisionReadiness={decisionReadiness}
        sourceById={sourceById}
      />

      <details className="mt-5 border-t border-stone-200 pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-seed-950 outline-none focus:ring-2 focus:ring-seed-500">
          Limits
        </summary>
        <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
          {decisionReadiness.limitations.map((limitation, index) => (
            <li key={`${limitation}-${index}`}>{limitation}</li>
          ))}
        </ul>
      </details>
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
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-semibold text-seed-700 outline-none underline-offset-4 hover:underline focus:ring-2 focus:ring-seed-500">
              Alignment detail
            </summary>
            <p className="mt-2 text-sm leading-6 text-earth-700">
              {target.alignmentDetail}
            </p>
          </details>
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
    <details className="mt-5 border-t border-stone-200 pt-4">
      <summary className="cursor-pointer text-sm font-semibold text-seed-950 outline-none focus:ring-2 focus:ring-seed-500">
        Evidence and rule trace
      </summary>
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
    </details>
  );
}
