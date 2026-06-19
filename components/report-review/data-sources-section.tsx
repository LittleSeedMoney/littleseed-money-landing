import type {
  ReviewDataSource,
  ReviewDataSourceKind,
  SourceMatchConfidence,
  SourceReconciliationPolicy,
  SourceReconciliationRule,
} from "@/data/report-review-sample";

import {
  dataSourceStatusLabels,
  dataSourceStatusTone,
  MetaItem,
  reviewDisclosureClass,
  reviewDisclosureSummaryClass,
  reviewPanelClass,
  ReviewSectionHeading,
  reviewSubtlePanelClass,
  StatusPill,
} from "./shared";

export function DataSourcesSection({
  dataMode,
  reconciliation,
  sources,
}: {
  dataMode: string;
  reconciliation: SourceReconciliationPolicy;
  sources: ReviewDataSource[];
}) {
  const activeCount = sources.filter((source) => source.status === "active").length;

  return (
    <section
      id="data-sources"
      aria-labelledby="data-sources-heading"
      className="space-y-3"
    >
      <ReviewSectionHeading
        eyebrow="Data sources"
        id="data-sources-heading"
        title="Review data sources"
        description="Manual entries, temporary CSV transaction reviews, and future linked-account data stay visible as separate sources."
      />

      <div className={reviewPanelClass("p-5")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-seed-950">
              Source state
            </h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <MetaItem label="Data mode" value={dataMode} />
              <MetaItem
                label="Active sources"
                value={`${activeCount.toLocaleString("en-US")} of ${sources.length.toLocaleString("en-US")}`}
              />
            </dl>
          </div>
          <StatusPill label={sourceSummaryLabel(sources)} tone="stone" />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {sources.map((source) => (
            <DataSourceCard key={source.id} source={source} />
          ))}
        </div>

        <MixedSourcePolicy reconciliation={reconciliation} />
      </div>
    </section>
  );
}

function DataSourceCard({ source }: { source: ReviewDataSource }) {
  return (
    <article className={reviewSubtlePanelClass("flex min-h-full flex-col p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-earth-600">
            {kindLabel(source.kind)}
          </p>
          <h3 className="mt-1 text-base font-semibold text-seed-950">
            {source.label}
          </h3>
        </div>
        <StatusPill
          label={dataSourceStatusLabels[source.status]}
          tone={dataSourceStatusTone(source.status)}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-earth-700">{source.summary}</p>

      <dl className="mt-4 grid gap-3 text-sm">
        <MetaItem label="Freshness" value={source.freshnessLabel} />
        <div>
          <dt className="text-xs font-medium text-earth-500">Coverage</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {source.coverage.map((item) => (
              <span
                className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-earth-700"
                key={item}
              >
                {item}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <details className={reviewDisclosureClass("mt-4 bg-white p-3")}>
        <summary className={reviewDisclosureSummaryClass()}>
          Boundaries
        </summary>
        <p className="mt-3 text-sm leading-6 text-earth-700">{source.detail}</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-earth-700">
          {source.limitations.map((limitation) => (
            <li className="ml-4 list-disc" key={limitation}>
              {limitation}
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function MixedSourcePolicy({
  reconciliation,
}: {
  reconciliation: SourceReconciliationPolicy;
}) {
  return (
    <div className={reviewSubtlePanelClass("mt-5 p-4")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-seed-950">
            Mixed-source handling
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-earth-700">
            {reconciliation.summary}
          </p>
        </div>
        <StatusPill label="Account-level" tone="earth" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <PolicyRuleGroup
          rules={reconciliation.accountMatching}
          title="Account matching"
        />
        <PolicyRuleGroup
          rules={reconciliation.transactionMatching}
          title="Transaction matching"
        />
      </div>

      <dl className="mt-4 grid gap-3 md:grid-cols-3">
        {reconciliation.resolution.map((item) => (
          <PolicyItem key={item.id} label={item.label} value={item.value} />
        ))}
      </dl>
    </div>
  );
}

function PolicyRuleGroup({
  rules,
  title,
}: {
  rules: SourceReconciliationRule[];
  title: string;
}) {
  return (
    <section className={reviewPanelClass("p-3 shadow-none")}>
      <h4 className="text-sm font-semibold text-seed-950">{title}</h4>
      <div className="mt-3 space-y-3">
        {rules.map((rule) => (
          <details className={reviewDisclosureClass("p-3")} key={rule.id}>
            <summary className={reviewDisclosureSummaryClass()}>
              <span>{rule.label}</span>
              <span className="ml-2 inline-flex">
                <StatusPill
                  label={confidenceLabel(rule.confidence)}
                  tone={confidenceTone(rule.confidence)}
                />
              </span>
            </summary>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-earth-700">
              {rule.criteria.map((criterion) => (
                <li className="ml-4 list-disc" key={criterion}>
                  {criterion}
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm leading-6 text-earth-800">
              {rule.outcome}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function PolicyItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={reviewPanelClass("rounded-md p-3 shadow-none")}>
      <dt className="text-xs font-medium text-earth-500">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-earth-800">{value}</dd>
    </div>
  );
}

function confidenceLabel(confidence: SourceMatchConfidence) {
  return {
    high: "High confidence",
    low: "Low confidence",
    medium: "Needs review",
  }[confidence];
}

function confidenceTone(confidence: SourceMatchConfidence) {
  if (confidence === "high") {
    return "seed";
  }

  if (confidence === "medium") {
    return "earth";
  }

  return "stone";
}

function kindLabel(kind: ReviewDataSourceKind) {
  return {
    csv: "Transaction import",
    "linked-account": "Provider source",
    manual: "Direct entry",
    mixed: "Mixed sources",
    sample: "Sample fixture",
  }[kind];
}

function sourceSummaryLabel(sources: ReviewDataSource[]) {
  if (sources.some((source) => source.status === "future")) {
    return "Future-ready";
  }

  if (sources.some((source) => source.status === "fallback")) {
    return "Fallback state";
  }

  return "Source mapped";
}
