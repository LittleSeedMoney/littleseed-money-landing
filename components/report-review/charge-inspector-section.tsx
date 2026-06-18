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
  const otherSignalCount = summary.bankFeeCount + summary.priceIncreaseCount;
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
      className="space-y-3"
      data-testid="charge-inspector-section"
    >
      <ReviewSectionHeading
        eyebrow="CSV-only inspection"
        id="charge-inspector-heading"
        title="Charge Inspector findings"
        description="Review deterministic sample findings from fixture rows. The view stays inside the current report-review session."
      />

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-seed-950">
              {review.sourceLabel}
            </h3>
            <p className="mt-1 text-sm leading-6 text-earth-700">
              Findings explain why a transaction pattern is visible and preserve
              the limits of deterministic detection.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill label="Sample fixture" tone="stone" />
            <StatusPill label="Review only" tone="seed" />
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <InspectorMetric
            detail="Rows checked in the current fixture."
            label="Rows reviewed"
            value={summary.reviewedTransactionCount.toLocaleString("en-US")}
          />
          <InspectorMetric
            detail="Visible before local hiding."
            label="Findings"
            value={summary.totalFindings.toLocaleString("en-US")}
          />
          <InspectorMetric
            detail="Merchant and amount patterns."
            label="Recurring"
            value={summary.recurringCount.toLocaleString("en-US")}
          />
          <InspectorMetric
            detail="Same-day merchant matches."
            label="Duplicates"
            value={summary.duplicateCount.toLocaleString("en-US")}
          />
          <InspectorMetric
            detail="Fees and amount changes."
            label="Other signals"
            value={otherSignalCount.toLocaleString("en-US")}
          />
        </dl>

        <div className="mt-5 border-t border-stone-200 pt-5">
          <BoundaryList title="Boundaries" items={review.limitations} />
        </div>
      </div>

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

function InspectorMetric({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <dt className="text-sm font-medium text-earth-700">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold tabular-nums text-seed-950">
        {value}
      </dd>
      <dd className="mt-2 text-sm leading-6 text-earth-700">{detail}</dd>
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
      className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
      data-finding-id={finding.id}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
          <p className="mt-2 text-sm leading-6 text-earth-700">
            {finding.summary}
          </p>
        </div>
        <button
          className="min-h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-earth-800 shadow-sm hover:border-seed-300 hover:text-seed-900 focus:outline-none focus:ring-2 focus:ring-seed-500"
          data-testid={`charge-inspector-hide-${finding.id}`}
          onClick={() => onHide(finding.id)}
          type="button"
        >
          Hide
        </button>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FindingFact label="Amount" value={finding.amountLabel} />
        <FindingFact
          label="Evidence rows"
          value={finding.evidenceRows.length.toLocaleString("en-US")}
        />
        <FindingFact
          label="Fixture rows"
          value={summary.reviewedTransactionCount.toLocaleString("en-US")}
        />
        <FindingFact label="Status" value="Needs review" />
      </dl>

      <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h4 className="text-sm font-semibold text-seed-950">Why it appears</h4>
        <p className="mt-2 text-sm leading-6 text-earth-700">
          {finding.explanation}
        </p>
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-semibold text-seed-950">Evidence rows</h4>
        <div className="mt-3 space-y-2">
          {finding.evidenceRows.map((row) => (
            <div
              className="grid gap-2 rounded-lg border border-stone-200 bg-white p-3 text-sm sm:grid-cols-[120px_minmax(0,1fr)_110px] sm:items-start"
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

      <div className="mt-5 grid gap-4 border-t border-stone-200 pt-5 md:grid-cols-2">
        <BoundaryList title="Review steps" items={finding.suggestedReviewSteps} />
        <BoundaryList title="Limitations" items={finding.limitations} />
      </div>
    </article>
  );
}

function FindingFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-earth-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-seed-950">
        {value}
      </dd>
    </div>
  );
}

function BoundaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-seed-950">{title}</h4>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
        {items.map((item) => (
          <li className="ml-4 list-disc" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
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
          <StatusPill label="Safe empty state" tone="stone" />
          <h3 className="mt-3 text-lg font-semibold text-seed-950">
            {review.emptyState.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-earth-700">
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
      <BoundaryList title="Checks" items={review.emptyState.checks} />
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
