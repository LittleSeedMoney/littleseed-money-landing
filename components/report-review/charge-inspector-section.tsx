"use client";

import { useMemo, useState } from "react";

import {
  isChargeInspectorEmpty,
  summarizeChargeInspectorReview,
  visibleChargeInspectorFindings,
  type ChargeInspectorReview,
  type ChargeInspectorSummary,
} from "@/lib/report-review/charge-inspector";

import { ChargeInspectorFindingList } from "./charge-inspector-finding-list";
import {
  ReviewEmptyState,
  reviewDisclosureClass,
  reviewDisclosureSummaryClass,
  reviewPanelClass,
  ReviewSectionHeading,
  reviewSubtlePanelClass,
  StatusPill,
} from "./shared";

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
        description="Deterministic transaction review prompts for recurring charges, possible duplicates, fee-like rows, and price changes."
      />

      <ChargeInspectorDashboard
        hiddenCount={hiddenCount}
        review={review}
        summary={summary}
        visibleCount={visibleFindings.length}
      />

      {hiddenCount > 0 && !showEmptyState ? (
        <div
          className={reviewSubtlePanelClass(
            "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
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
        <ChargeInspectorFindingList
          findings={visibleFindings}
          onHide={hideFinding}
          summary={summary}
        />
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
    <div className={reviewPanelClass("p-4 sm:p-5")}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div>
          <h3 className="text-base font-semibold text-seed-950">
            {review.sourceLabel}
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-earth-700">
            Current-session review prompts only. Local hide actions are
            temporary, and no transaction history or account connection is
            stored.
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
              testId="charge-inspector-metric-rows"
              value={summary.reviewedTransactionCount.toLocaleString("en-US")}
            />
            <InspectorMetric
              label="Findings"
              testId="charge-inspector-metric-findings"
              value={summary.totalFindings.toLocaleString("en-US")}
            />
            <InspectorMetric
              label="Visible"
              testId="charge-inspector-metric-visible"
              value={visibleCount.toLocaleString("en-US")}
            />
            <InspectorMetric
              label="Hidden"
              testId="charge-inspector-metric-hidden"
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

      <details className={reviewDisclosureClass("mt-4 p-3")}>
        <summary className={reviewDisclosureSummaryClass()}>
          Detection boundaries
        </summary>
        <BoundaryList items={review.limitations} />
      </details>
    </div>
  );
}

function InspectorMetric({
  label,
  testId,
  value,
}: {
  label: string;
  testId: string;
  value: string;
}) {
  return (
    <div
      className={reviewDisclosureClass("px-3 py-2")}
      data-testid={testId}
    >
      <dt className="text-xs font-medium text-earth-600">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-seed-950">
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
    <ReviewEmptyState
      action={
        showRestore ? (
          <button
            className="min-h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-earth-800 shadow-sm hover:border-seed-300 hover:text-seed-900 focus:outline-none focus:ring-2 focus:ring-seed-500"
            data-testid="charge-inspector-restore-empty"
            onClick={onRestore}
            type="button"
          >
            Restore findings
          </button>
        ) : null
      }
      footer={
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-seed-950">Checks</h4>
          <BoundaryList items={review.emptyState.checks} />
        </div>
      }
      label={emptyStatePillLabel(review)}
      testId="charge-inspector-empty-state"
      title={review.emptyState.title}
    >
      <p>{review.emptyState.body}</p>
    </ReviewEmptyState>
  );
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
  if (review.dataMode === "linked-account") {
    return "Linked transactions";
  }
  if (review.dataMode === "mixed") {
    return "Mixed sources";
  }
  if (review.dataMode === "empty") {
    return "No transactions";
  }
  if (review.dataMode === "fallback") {
    return "API fallback";
  }
  return "Sample fixture";
}
