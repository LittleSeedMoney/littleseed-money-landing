"use client";

import { useMemo, useState } from "react";

import {
  chargeInspectorFindingTypeLabels,
  isChargeInspectorEmpty,
  summarizeChargeInspectorReview,
  visibleChargeInspectorFindings,
  type ChargeInspectorFinding,
  type ChargeInspectorReview,
  type ChargeInspectorSummary,
} from "@/lib/report-review/charge-inspector";

import { ReviewSectionHeading, StatusPill } from "./shared";

export function ChargeInspectorSection({
  review,
}: {
  review: ChargeInspectorReview;
}) {
  const [dismissedFindingIds, setDismissedFindingIds] = useState<string[]>([]);
  const summary = useMemo(
    () => summarizeChargeInspectorReview(review),
    [review],
  );
  const visibleFindings = useMemo(
    () => visibleChargeInspectorFindings(review, dismissedFindingIds),
    [dismissedFindingIds, review],
  );
  const hiddenCount = review.findings.length - visibleFindings.length;
  const showEmptyState =
    isChargeInspectorEmpty(review) || visibleFindings.length === 0;

  function hideFinding(findingId: string) {
    setDismissedFindingIds((current) =>
      current.includes(findingId) ? current : [...current, findingId],
    );
  }

  function restoreFindings() {
    setDismissedFindingIds([]);
  }

  return (
    <section
      id="charge-inspector"
      aria-labelledby="charge-inspector-heading"
      className="scroll-mt-28 space-y-3"
      data-testid="charge-inspector-section"
    >
      <ReviewSectionHeading
        eyebrow="Charge review"
        id="charge-inspector-heading"
        title="Charge Inspector"
        description="Deterministic CSV review prompts for recurring charges, possible duplicates, fee-like rows, and price changes."
      />

      <ChargeInspectorDashboard
        hiddenCount={hiddenCount}
        review={review}
        summary={summary}
        visibleCount={visibleFindings.length}
      />

      {hiddenCount > 0 && !showEmptyState ? (
        <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-earth-700">
            {hiddenCount.toLocaleString("en-US")} finding
            {hiddenCount === 1 ? "" : "s"} hidden in this browser session.
          </p>
          <button
            className="min-h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-earth-800 shadow-sm hover:border-seed-300 hover:text-seed-900 focus:outline-none focus:ring-2 focus:ring-seed-500"
            data-testid="charge-inspector-restore-banner"
            onClick={restoreFindings}
            type="button"
          >
            Restore findings
          </button>
        </div>
      ) : null}

      {showEmptyState ? (
        <ChargeInspectorEmptyState
          review={review}
          showRestore={hiddenCount > 0}
          onRestore={restoreFindings}
        />
      ) : (
        <div className="space-y-3">
          {visibleFindings.map((finding) => (
            <ChargeInspectorFindingCard
              finding={finding}
              key={finding.id}
              onHide={hideFinding}
              summary={summary}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ChargeInspectorDashboard({
  hiddenCount,
  review,
  summary,
  visibleCount,
}: {
  hiddenCount: number;
  review: ChargeInspectorReview;
  summary: ChargeInspectorSummary;
  visibleCount: number;
}) {
  const otherSignalCount = summary.bankFeeCount + summary.priceIncreaseCount;
  const showDashboardMetrics = summary.reviewedTransactionCount > 0;

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div>
          <h3 className="text-base font-semibold text-seed-950">
            {review.sourceLabel}
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-earth-700">
            Current-session review prompts only. Local hide actions are
            temporary, and no transaction history is stored.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          <StatusPill label={sourcePillLabel(review)} tone="stone" />
          <StatusPill label="In-session" tone="earth" />
          <StatusPill label="No storage" tone="stone" />
        </div>
      </div>

      {showDashboardMetrics ? (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <InspectorMetric
              label="Rows"
              value={summary.reviewedTransactionCount.toLocaleString("en-US")}
            />
            <InspectorMetric
              label="Findings"
              value={summary.totalFindings.toLocaleString("en-US")}
            />
            <InspectorMetric
              label="Visible"
              value={visibleCount.toLocaleString("en-US")}
            />
            <InspectorMetric
              label="Hidden"
              value={hiddenCount.toLocaleString("en-US")}
            />
          </dl>

          <p className="mt-3 text-sm leading-6 text-earth-700">
            Signal mix:{" "}
            <span className="font-semibold text-seed-950">
              {summary.recurringCount.toLocaleString("en-US")} recurring
            </span>
            ,{" "}
            <span className="font-semibold text-seed-950">
              {summary.duplicateCount.toLocaleString("en-US")} duplicate
            </span>
            ,{" "}
            <span className="font-semibold text-seed-950">
              {otherSignalCount.toLocaleString("en-US")} other
            </span>
            .
          </p>
        </>
      ) : null}

      <details className="mt-4 rounded-md border border-stone-200 bg-stone-50 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-seed-950 focus:outline-none focus:ring-2 focus:ring-seed-500">
          Detection boundaries
        </summary>
        <BoundaryList items={review.limitations} />
      </details>
    </div>
  );
}

function InspectorMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
      <dt className="text-xs font-medium text-earth-600">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-seed-950">
        {value}
      </dd>
    </div>
  );
}

function ChargeInspectorFindingCard({
  finding,
  onHide,
  summary,
}: {
  finding: ChargeInspectorFinding;
  onHide: (findingId: string) => void;
  summary: ChargeInspectorSummary;
}) {
  return (
    <article
      className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      data-finding-id={finding.id}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill
              label={chargeInspectorFindingTypeLabels[finding.type]}
              tone={findingTone(finding.type)}
            />
            {finding.cadenceLabel ? (
              <StatusPill label={finding.cadenceLabel} tone="stone" />
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-seed-950">
            {finding.title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-earth-700">
            {finding.summary}
          </p>
        </div>
        <button
          className="min-h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-earth-800 shadow-sm hover:border-seed-300 hover:text-seed-900 focus:outline-none focus:ring-2 focus:ring-seed-500 sm:self-start"
          data-testid={`charge-inspector-hide-${finding.id}`}
          onClick={() => onHide(finding.id)}
          type="button"
        >
          Hide
        </button>
      </div>

      <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <FindingFact label="Amount" value={finding.amountLabel} />
        <FindingFact
          label="Evidence rows"
          value={finding.evidenceRows.length.toLocaleString("en-US")}
        />
        <FindingFact
          label="Reviewed rows"
          value={summary.reviewedTransactionCount.toLocaleString("en-US")}
        />
        <FindingFact label="Prompt" value="Needs review" />
      </dl>

      <details className="mt-4 rounded-md border border-stone-200 bg-stone-50 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-seed-950 focus:outline-none focus:ring-2 focus:ring-seed-500">
          Why it appears
        </summary>
        <p className="mt-3 text-sm leading-6 text-earth-700">
          {finding.explanation}
        </p>
      </details>

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-seed-950">Evidence rows</h4>
        <div className="mt-3 space-y-2">
          {finding.evidenceRows.map((row) => (
            <div
              className="grid gap-2 rounded-md border border-stone-200 bg-white p-3 text-sm sm:grid-cols-[112px_minmax(0,1fr)_96px] sm:items-start"
              key={row.id}
            >
              <span className="font-medium tabular-nums text-earth-800">
                {row.postedDate}
              </span>
              <span className="min-w-0 break-words text-earth-800">
                {row.merchantName}
                <span className="block text-earth-600">{row.detail}</span>
              </span>
              <span className="font-semibold tabular-nums text-seed-950 sm:text-right">
                {row.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-stone-200 pt-4 md:grid-cols-2">
        <DetailsList title="Review steps" items={finding.suggestedReviewSteps} />
        <DetailsList title="Limitations" items={finding.limitations} />
      </div>
    </article>
  );
}

function FindingFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
      <dt className="text-xs font-medium text-earth-600">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-seed-950">
        {value}
      </dd>
    </div>
  );
}

function BoundaryList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2 text-sm leading-6 text-earth-700">
      {items.map((item) => (
        <li className="ml-4 list-disc" key={item}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function DetailsList({ title, items }: { title: string; items: string[] }) {
  return (
    <details className="rounded-md border border-stone-200 bg-stone-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-seed-950 focus:outline-none focus:ring-2 focus:ring-seed-500">
        {title}
      </summary>
      <BoundaryList items={items} />
    </details>
  );
}

function ChargeInspectorEmptyState({
  onRestore,
  review,
  showRestore,
}: {
  onRestore: () => void;
  review: ChargeInspectorReview;
  showRestore: boolean;
}) {
  return (
    <div
      className="rounded-lg border border-dashed border-stone-300 bg-white p-5"
      data-testid="charge-inspector-empty-state"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill label={emptyStatePillLabel(review)} tone="stone" />
          <h3 className="mt-3 text-lg font-semibold text-seed-950">
            {review.emptyState.title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-earth-700">
            {review.emptyState.body}
          </p>
        </div>
        {showRestore ? (
          <button
            className="min-h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-earth-800 shadow-sm hover:border-seed-300 hover:text-seed-900 focus:outline-none focus:ring-2 focus:ring-seed-500"
            data-testid="charge-inspector-restore-empty"
            onClick={onRestore}
            type="button"
          >
            Restore findings
          </button>
        ) : null}
      </div>
      <div className="mt-5">
        <h4 className="text-sm font-semibold text-seed-950">Checks</h4>
        <BoundaryList items={review.emptyState.checks} />
      </div>
    </div>
  );
}

function findingTone(type: ChargeInspectorFinding["type"]) {
  if (type === "duplicate_charge" || type === "price_increase") {
    return "earth";
  }

  if (type === "bank_fee") {
    return "stone";
  }

  return "seed";
}

function emptyStatePillLabel(review: ChargeInspectorReview) {
  if (review.dataMode === "fallback") {
    return "Safe fallback";
  }
  return "Safe empty state";
}

function sourcePillLabel(review: ChargeInspectorReview) {
  if (review.dataMode === "platform-sample") {
    return "Platform sample";
  }
  if (review.dataMode === "user-csv") {
    return "CSV review";
  }
  if (review.dataMode === "empty") {
    return "No CSV loaded";
  }
  if (review.dataMode === "fallback") {
    return "API fallback";
  }
  return "Sample fixture";
}
