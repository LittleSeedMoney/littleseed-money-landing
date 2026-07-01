"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  isChargeInspectorEmpty,
  recurringPaymentReviewItems,
  summarizeChargeInspectorReview,
  visibleChargeInspectorFindings,
  type ChargeInspectorFinding,
  type ChargeInspectorReview,
  type ChargeInspectorSummary,
  type RecurringPaymentReviewItem,
} from "@/lib/report-review/charge-inspector";
import { CHARGE_INSPECTOR_CSV_TEXT_MAX_LENGTH } from "@/lib/report-review/charge-inspector-upload";

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

type CsvReviewRequestState = "idle" | "loading" | "ready" | "error";

const CSV_FILE_LENGTH_ERROR =
  "CSV file must be 250,000 characters or fewer.";
export function ChargeInspectorSection({
  review,
}: {
  review: ChargeInspectorReview;
}) {
  const [activeReview, setActiveReview] = useState(review);
  const [dismissedFindingIds, setDismissedFindingIds] = useState<string[]>([]);

  useEffect(() => {
    setActiveReview(review);
    setDismissedFindingIds([]);
  }, [review]);

  const summary = useMemo(
    () => summarizeChargeInspectorReview(activeReview),
    [activeReview],
  );
  const visibleFindings = useMemo(
    () => visibleChargeInspectorFindings(activeReview, dismissedFindingIds),
    [activeReview, dismissedFindingIds],
  );
  const hiddenCount = activeReview.findings.length - visibleFindings.length;
  const showEmptyState =
    isChargeInspectorEmpty(activeReview) || visibleFindings.length === 0;

  function hideFinding(findingId: string) {
    setDismissedFindingIds((current) =>
      current.includes(findingId) ? current : [...current, findingId],
    );
  }

  function restoreFindings() {
    setDismissedFindingIds([]);
  }

  function loadUploadedReview(nextReview: ChargeInspectorReview) {
    setActiveReview(nextReview);
    setDismissedFindingIds([]);
  }

  function resetReview() {
    setActiveReview(review);
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

      <ChargeInspectorCsvUpload
        activeReview={activeReview}
        onReset={resetReview}
        onReviewLoaded={loadUploadedReview}
        showReset={activeReview !== review}
      />

      <ChargeInspectorDashboard
        findings={visibleFindings}
        hiddenCount={hiddenCount}
        review={activeReview}
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
          review={activeReview}
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

function ChargeInspectorCsvUpload({
  activeReview,
  onReset,
  onReviewLoaded,
  showReset,
}: {
  activeReview: ChargeInspectorReview;
  onReset: () => void;
  onReviewLoaded: (review: ChargeInspectorReview) => void;
  showReset: boolean;
}) {
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [requestState, setRequestState] =
    useState<CsvReviewRequestState>("idle");

  const isLoading = requestState === "loading";

  function updateFile(event: ChangeEvent<HTMLInputElement>) {
    setErrorMessage("");
    setRequestState("idle");
    setFile(event.target.files?.[0] ?? null);
  }

  async function submitCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!file) {
      setRequestState("error");
      setErrorMessage("Choose a CSV file before running Charge Inspector.");
      return;
    }

    if (file.size > CHARGE_INSPECTOR_CSV_TEXT_MAX_LENGTH) {
      setRequestState("error");
      setErrorMessage(CSV_FILE_LENGTH_ERROR);
      return;
    }

    setRequestState("loading");

    try {
      const csvText = await file.text();
      if (csvText.trim().length === 0) {
        throw new Error("CSV file must not be blank.");
      }
      if (csvText.length > CHARGE_INSPECTOR_CSV_TEXT_MAX_LENGTH) {
        throw new Error(CSV_FILE_LENGTH_ERROR);
      }

      const response = await fetch(
        "/private/report-review/charge-inspector-review",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ csvText }),
        },
      );
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        throw new Error(readRouteError(payload));
      }

      onReviewLoaded(readRouteReview(payload));
      setRequestState("ready");
    } catch (error) {
      setRequestState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Charge Inspector CSV review failed.",
      );
    }
  }

  return (
    <form
      className={reviewPanelClass("p-4 sm:p-5")}
      data-testid="charge-inspector-csv-upload"
      onSubmit={submitCsv}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill label="CSV in-session" tone="earth" />
            <StatusPill label="No storage" tone="stone" />
          </div>
          <label
            className="mt-3 block text-sm font-semibold text-seed-950"
            htmlFor="charge-inspector-csv-file"
          >
            Review a CSV export
          </label>
          <input
            accept=".csv,text/csv"
            className="mt-3 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-earth-900 file:mr-3 file:rounded-md file:border-0 file:bg-seed-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-seed-900 hover:file:bg-seed-100 focus:outline-none focus:ring-2 focus:ring-seed-500"
            data-testid="charge-inspector-csv-file"
            disabled={isLoading}
            id="charge-inspector-csv-file"
            onChange={updateFile}
            type="file"
          />
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            className="min-h-10 rounded-md border border-seed-700 bg-seed-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-seed-800 focus:outline-none focus:ring-2 focus:ring-seed-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Reviewing" : "Review CSV"}
          </button>
          {showReset ? (
            <button
              className="min-h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-earth-800 shadow-sm hover:border-seed-300 hover:text-seed-900 focus:outline-none focus:ring-2 focus:ring-seed-500"
              disabled={isLoading}
              onClick={onReset}
              type="button"
            >
              Reset review
            </button>
          ) : null}
        </div>
      </div>

      {requestState === "ready" ? (
        <p
          className="mt-3 text-sm leading-6 text-seed-900"
          data-testid="charge-inspector-csv-success"
        >
          CSV reviewed for this browser session.{" "}
          {activeReview.reviewedTransactionCount.toLocaleString("en-US")} rows
          are visible below.
        </p>
      ) : null}

      {requestState === "error" ? (
        <p
          className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900"
          data-testid="charge-inspector-csv-error"
        >
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}

function ChargeInspectorDashboard({
  findings,
  hiddenCount,
  review,
  summary,
  visibleCount,
}: {
  findings: ChargeInspectorFinding[];
  hiddenCount: number;
  review: ChargeInspectorReview;
  summary: ChargeInspectorSummary;
  visibleCount: number;
}) {
  const otherSignalCount = summary.bankFeeCount + summary.priceIncreaseCount;
  const recurringReviewItems = recurringPaymentReviewItems(findings);
  const showDashboardMetrics = summary.reviewedTransactionCount > 0;

  return (
    <div className={reviewPanelClass("p-4 sm:p-5")}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div>
          <h3 className="text-base font-semibold text-seed-950">
            {review.sourceLabel}
          </h3>
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

          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill
              label={`${summary.recurringCount.toLocaleString("en-US")} recurring`}
              tone="earth"
            />
            <StatusPill
              label={`${summary.duplicateCount.toLocaleString("en-US")} duplicate`}
              tone="stone"
            />
            <StatusPill
              label={`${otherSignalCount.toLocaleString("en-US")} other`}
              tone="stone"
            />
          </div>

          {recurringReviewItems.length > 0 ? (
            <RecurringPaymentReviewBoard items={recurringReviewItems} />
          ) : (
            <div
              className={reviewSubtlePanelClass("mt-4 p-3")}
              data-testid="charge-inspector-recurring-empty"
            >
              <h4 className="text-sm font-semibold text-seed-950">
                Recurring payment review
              </h4>
              <p className="mt-1 text-sm leading-6 text-earth-700">
                No recurring patterns.
              </p>
            </div>
          )}
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

function RecurringPaymentReviewBoard({
  items,
}: {
  items: RecurringPaymentReviewItem[];
}) {
  return (
    <div
      className={reviewDisclosureClass("mt-4 p-3")}
      data-testid="charge-inspector-recurring-payment-board"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-seed-950">
          Recurring payment review
        </h4>
        <StatusPill label="Pattern only" tone="stone" />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <article
            className={reviewSubtlePanelClass("p-3")}
            data-testid="charge-inspector-recurring-payment-item"
            key={item.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h5 className="text-sm font-semibold text-seed-950">
                  {item.merchantName}
                </h5>
                <p className="mt-1 text-xs leading-5 text-earth-600">
                  {item.evidenceCountLabel}
                </p>
              </div>
              <StatusPill label={item.cadenceLabel} tone="earth" />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs font-medium text-earth-600">Amount</dt>
                <dd className="mt-1 font-semibold tabular-nums text-seed-950">
                  {item.amountLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-earth-600">
                  Last seen
                </dt>
                <dd className="mt-1 font-semibold text-seed-950">
                  {item.lastSeenLabel}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-medium text-earth-600">
                  Review window
                </dt>
                <dd className="mt-1 font-semibold text-seed-950">
                  {item.reviewWindowLabel}
                </dd>
              </div>
            </dl>

            {item.limitations.length > 0 ? (
              <details className={reviewDisclosureClass("mt-3 p-3")}>
                <summary className={reviewDisclosureSummaryClass()}>
                  Limits
                </summary>
                <BoundaryList items={item.limitations} />
              </details>
            ) : null}
          </article>
        ))}
      </div>
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

function readRouteReview(payload: unknown): ChargeInspectorReview {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Charge Inspector CSV review returned an invalid response.");
  }

  const review = (payload as Record<string, unknown>).review;
  if (typeof review !== "object" || review === null || Array.isArray(review)) {
    throw new Error("Charge Inspector CSV review returned no review.");
  }

  return review as ChargeInspectorReview;
}

function readRouteError(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return "Charge Inspector CSV review failed.";
  }

  const error = (payload as Record<string, unknown>).error;
  return typeof error === "string"
    ? error
    : "Charge Inspector CSV review failed.";
}
