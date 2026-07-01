"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  buildCategoryBudgetAutomationReviewQueue,
  categoryBudgetTargetsFromInputs,
  compareCategoryMonthlyBudgetTargets,
  deriveCategoryBudgetAutomationJudgments,
  deriveCategoryBudgetAutomationReadiness,
  isChargeInspectorEmpty,
  mergeCategoryMonthlyBudgetComparisons,
  parseCategoryBudgetTargetInput,
  recurringPaymentReviewItems,
  summarizeChargeInspectorReview,
  visibleChargeInspectorFindings,
  windowChargeInspectorRows,
  type ChargeInspectorCategoryBudgetAutomationJudgment,
  type ChargeInspectorCategoryBudgetAutomationReadiness,
  type ChargeInspectorCategoryBudgetAutomationReviewQueueItem,
  type ChargeInspectorCategoryBudgetAutomationReviewQueueLane,
  type ChargeInspectorCategoryBudgetTargetAmounts,
  type ChargeInspectorCategoryMonthlyBudgetComparison,
  type ChargeInspectorCategoryReviewStatus,
  type ChargeInspectorFinding,
  type ChargeInspectorCategorySummary,
  type ChargeInspectorReview,
  type ChargeInspectorSummary,
  type RecurringPaymentReviewItem,
  type WindowedRows,
} from "@/lib/report-review/charge-inspector";
import { CHARGE_INSPECTOR_CSV_TEXT_MAX_LENGTH } from "@/lib/report-review/charge-inspector-upload";

import {
  AiCategoryEvidenceExplanationPanel,
  AiMonthlySpendingExplanationPanel,
} from "./ai-explanation-panel";
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
type AutomationReviewDecision =
  | "unreviewed"
  | "candidate-reviewed"
  | "needs-more-context"
  | "excluded";
type AutomationTargetPreset = {
  amountLabel: string;
  sourceMonth: string;
  value: string;
};

const CSV_FILE_LENGTH_ERROR =
  "CSV file must be 250,000 characters or fewer.";
const CATEGORY_REVIEW_OPTIONS: {
  label: string;
  status: ChargeInspectorCategoryReviewStatus;
}[] = [
  { label: "Unreviewed", status: "unreviewed" },
  { label: "Confirm", status: "confirmed" },
  { label: "Needs review", status: "needs-review" },
];
const AUTOMATION_REVIEW_DECISION_OPTIONS: {
  decision: AutomationReviewDecision;
  label: string;
}[] = [
  { decision: "unreviewed", label: "Unreviewed" },
  { decision: "candidate-reviewed", label: "Reviewed" },
  { decision: "needs-more-context", label: "Needs context" },
  // Excluded is a local review label only; it must not filter rows or approve/deny automation.
  { decision: "excluded", label: "Exclude" },
];
export function ChargeInspectorSection({
  aiEnabled,
  review,
}: {
  aiEnabled: boolean;
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
  const showSampleAiPanels = activeReview === review;

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
        aiEnabled={aiEnabled}
        findings={visibleFindings}
        hiddenCount={hiddenCount}
        key={categoryReviewKey(activeReview)}
        review={activeReview}
        showSampleAiPanels={showSampleAiPanels}
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
          <p className="mt-1 max-w-3xl text-sm leading-6 text-earth-700">
            Chase-style checking CSV rows are sent to the internal review route
            for deterministic parsing, monthly totals, and finding prompts.
          </p>
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
  aiEnabled,
  findings,
  hiddenCount,
  review,
  showSampleAiPanels,
  summary,
  visibleCount,
}: {
  aiEnabled: boolean;
  findings: ChargeInspectorFinding[];
  hiddenCount: number;
  review: ChargeInspectorReview;
  showSampleAiPanels: boolean;
  summary: ChargeInspectorSummary;
  visibleCount: number;
}) {
  const otherSignalCount = summary.bankFeeCount + summary.priceIncreaseCount;
  const recurringReviewItems = recurringPaymentReviewItems(findings);
  const showDashboardMetrics = summary.reviewedTransactionCount > 0;
  const reviewKey = categoryReviewKey(review);
  const [budgetTargetInputs, setBudgetTargetInputs] = useState<
    Record<string, string>
  >({});
  const budgetTargets = useMemo(
    () => categoryBudgetTargetsFromInputs(budgetTargetInputs),
    [budgetTargetInputs],
  );

  function setBudgetTarget(category: string, value: string) {
    setBudgetTargetInputs((current) => {
      if (value.trim().length === 0) {
        const { [category]: _ignored, ...next } = current;
        return next;
      }

      return { ...current, [category]: value };
    });
  }

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

          {recurringReviewItems.length > 0 ? (
            <RecurringPaymentReviewBoard items={recurringReviewItems} />
          ) : null}

          {review.categorySummary.length > 0 ? (
            <CategorySummaryTable
              aiEnabled={aiEnabled}
              budgetTargets={budgetTargets}
              key={reviewKey}
              review={review}
              showAiPanel={showSampleAiPanels}
            />
          ) : null}

          {review.categoryMonthlySummary.length > 0 ? (
            <CategoryMonthlySummaryTable
              budgetTargetInputs={budgetTargetInputs}
              budgetTargets={budgetTargets}
              onBudgetTargetChange={setBudgetTarget}
              review={review}
            />
          ) : null}

          {review.monthlySpendingSummary.length > 0 ? (
            <MonthlySpendingSummary
              aiEnabled={aiEnabled}
              review={review}
              showAiPanel={showSampleAiPanels}
            />
          ) : null}
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

function CategorySummaryTable({
  aiEnabled,
  budgetTargets,
  review,
  showAiPanel,
}: {
  aiEnabled: boolean;
  budgetTargets: ChargeInspectorCategoryBudgetTargetAmounts;
  review: ChargeInspectorReview;
  showAiPanel: boolean;
}) {
  const [reviewStatuses, setReviewStatuses] = useState<
    Record<string, ChargeInspectorCategoryReviewStatus>
  >({});
  const reviewCounts = useMemo(
    () => summarizeCategoryReviewStatuses(review, reviewStatuses),
    [review, reviewStatuses],
  );
  function setCategoryStatus(
    category: string,
    status: ChargeInspectorCategoryReviewStatus,
  ) {
    setReviewStatuses((current) => {
      if (status === "unreviewed") {
        const { [category]: _ignored, ...next } = current;
        return next;
      }

      return { ...current, [category]: status };
    });
  }

  return (
    <div
      className={reviewDisclosureClass("mt-4 p-3")}
      data-testid="charge-inspector-category-summary"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-seed-950">
          Category summary
        </h4>
        <div className="flex flex-wrap gap-2">
          <StatusPill label={review.categorySummaryVersion} tone="stone" />
          <StatusPill
            label={`${reviewCounts.confirmed.toLocaleString("en-US")} confirmed`}
            tone="earth"
          />
          <StatusPill
            label={`${reviewCounts.needsReview.toLocaleString("en-US")} needs review`}
            tone="stone"
          />
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[50rem] text-left text-sm">
          <thead className="border-b border-stone-200 text-xs font-semibold uppercase text-earth-600">
            <tr>
              <th className="py-2 pr-3">Category</th>
              <th className="px-3 py-2">Spending</th>
              <th className="px-3 py-2">Credits</th>
              <th className="px-3 py-2 text-right">Rows</th>
              <th className="py-2 pl-3">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {review.categorySummary.map((category) => (
              <CategorySummaryRow
                category={category}
                key={category.category}
                onStatusChange={setCategoryStatus}
                status={
                  reviewStatuses[category.category] ?? "unreviewed"
                }
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-5 text-earth-600">
        Deterministic text-rule grouping only. This does not infer budgets,
        spending quality, merchant actions, or required changes. Review status
        stays in this browser session and does not edit category rules,
        recommend targets, or save preferences. Budget target editing lives in
        the row-level automation review workspace below.
      </p>

      {showAiPanel ? (
        <div className="mt-4">
          <AiCategoryEvidenceExplanationPanel
            categoryBudgetTargets={budgetTargets}
            categoryReviewStatuses={reviewStatuses}
            enabled={aiEnabled}
          />
        </div>
      ) : null}
    </div>
  );
}

function CategoryMonthlySummaryTable({
  budgetTargetInputs,
  budgetTargets,
  onBudgetTargetChange,
  review,
}: {
  budgetTargetInputs: Record<string, string>;
  budgetTargets: ChargeInspectorCategoryBudgetTargetAmounts;
  onBudgetTargetChange: (category: string, value: string) => void;
  review: ChargeInspectorReview;
}) {
  const localBudgetComparisons = useMemo(
    () =>
      compareCategoryMonthlyBudgetTargets(
        review.categoryMonthlySummary,
        budgetTargets,
      ),
    [budgetTargets, review.categoryMonthlySummary],
  );
  const budgetComparisons = useMemo(
    () =>
      mergeCategoryMonthlyBudgetComparisons(
        review.categoryMonthlyBudgetComparison,
        localBudgetComparisons,
      ),
    [localBudgetComparisons, review.categoryMonthlyBudgetComparison],
  );
  const budgetComparisonWindow = useMemo(
    () =>
      windowChargeInspectorRows(budgetComparisons, {
        isPriorityRow: (comparison) =>
          comparison.targetDebitTotalCents !== null,
      }),
    [budgetComparisons],
  );
  const visibleBudgetComparisons = budgetComparisonWindow.kept;
  const budgetCounts = useMemo(
    () => summarizeCategoryMonthlyBudgetComparisons(visibleBudgetComparisons),
    [visibleBudgetComparisons],
  );
  const targetPresets = useMemo(
    () => buildAutomationTargetPresets(visibleBudgetComparisons),
    [visibleBudgetComparisons],
  );
  const automationReadinessRows = useMemo(
    () => deriveCategoryBudgetAutomationReadiness(budgetComparisons),
    [budgetComparisons],
  );
  const automationReadinessWindow = useMemo(
    () =>
      windowChargeInspectorRows(automationReadinessRows, {
        isPriorityRow: (row) => row.readinessStatus !== "insufficient-context",
      }),
    [automationReadinessRows],
  );
  const visibleAutomationReadinessRows = automationReadinessWindow.kept;
  const visibleAutomationJudgmentRows = useMemo(
    () =>
      deriveCategoryBudgetAutomationJudgments(visibleAutomationReadinessRows),
    [visibleAutomationReadinessRows],
  );
  const hasMonthlyComparisonRows = budgetComparisons.length > 0;
  const showAutomationReadiness = automationReadinessRows.length > 0;
  const activeWindow = budgetComparisonWindow;
  const hasWindowOmissions = activeWindow.omittedCount > 0;
  const visibleMonthCount = new Set(
    activeWindow.kept.map((row) => row.month),
  ).size;

  return (
    <div
      className={reviewDisclosureClass("mt-4 p-3")}
      data-testid="charge-inspector-category-monthly-summary"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-seed-950">
          Monthly target review
        </h4>
        <div className="flex flex-wrap gap-2">
          <StatusPill
            label={review.categoryMonthlySummaryVersion}
            tone="stone"
          />
          <StatusPill
            label={`${visibleMonthCount.toLocaleString("en-US")} visible months`}
            tone="stone"
          />
          <StatusPill
            label={`recent ${activeWindow.window.recentMonths.toLocaleString("en-US")} months / ${activeWindow.window.rowCap.toLocaleString("en-US")} row cap`}
            tone="stone"
          />
          {hasWindowOmissions ? (
            <StatusPill
              label={`${activeWindow.omittedCount.toLocaleString("en-US")} older or overflow rows hidden`}
              tone="earth"
            />
          ) : null}
          {hasMonthlyComparisonRows ? (
            <>
              <StatusPill
                label={`${budgetCounts.targetRows.toLocaleString("en-US")} visible monthly target rows`}
                tone="stone"
              />
              <StatusPill
                label={`${budgetCounts.overTarget.toLocaleString("en-US")} visible monthly over`}
                tone={budgetCounts.overTarget > 0 ? "earth" : "stone"}
              />
            </>
          ) : null}
        </div>
      </div>

      {showAutomationReadiness ? (
        <BudgetAutomationReadinessPreview
          budgetTargetInputs={budgetTargetInputs}
          judgmentRows={visibleAutomationJudgmentRows}
          onBudgetTargetChange={onBudgetTargetChange}
          rows={visibleAutomationReadinessRows}
          targetPresets={targetPresets}
          windowedRows={automationReadinessWindow}
        />
      ) : null}

      <p className="mt-3 text-xs leading-5 text-earth-600">
        Posted-date month plus deterministic category totals only. This is not
        a monthly budget, spending-quality judgment, action priority, or saved
        category memory. Monthly row comparison uses posted-date-month category
        debit totals and shows "No target" until a user-entered target is
        available. Row target inputs update the category-wide monthly target for
        this browser session; they do not create saved budgets or month-specific
        target memory. Target preset candidates are calculated from visible
        actual rows only and are not recommendations. Target result badges are
        factual states against user-entered targets, not category rankings or
        spending instructions. The row window keeps recent posted-date months
        first and uses target rows only as a cap survival rule inside that recent
        window.
        {hasWindowOmissions
          ? ` Showing ${activeWindow.includedCount.toLocaleString("en-US")} of ${activeWindow.totalCount.toLocaleString("en-US")} rows; ${activeWindow.omittedCount.toLocaleString("en-US")} older or overflow rows are hidden by the display cap.`
          : ""}
      </p>
    </div>
  );
}

function BudgetAutomationReadinessPreview({
  budgetTargetInputs,
  judgmentRows,
  onBudgetTargetChange,
  rows,
  targetPresets,
  windowedRows,
}: {
  budgetTargetInputs: Record<string, string>;
  judgmentRows: ChargeInspectorCategoryBudgetAutomationJudgment[];
  onBudgetTargetChange: (category: string, value: string) => void;
  rows: ChargeInspectorCategoryBudgetAutomationReadiness[];
  targetPresets: Map<string, AutomationTargetPreset>;
  windowedRows: WindowedRows<ChargeInspectorCategoryBudgetAutomationReadiness>;
}) {
  const counts = summarizeCategoryBudgetAutomationReadiness(rows);
  const [reviewDecisions, setReviewDecisions] = useState<
    Record<string, AutomationReviewDecision>
  >({});
  const reviewQueueItems = useMemo(
    () => buildCategoryBudgetAutomationReviewQueue(judgmentRows),
    [judgmentRows],
  );

  useEffect(() => {
    const liveKeys = new Set(
      reviewQueueItems.map((item) => automationReviewDecisionKey(item)),
    );

    setReviewDecisions((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([key]) => liveKeys.has(key)),
      );

      return Object.keys(next).length === Object.keys(current).length
        ? current
        : next;
    });
  }, [reviewQueueItems]);

  function setReviewDecision(
    item: ChargeInspectorCategoryBudgetAutomationReviewQueueItem,
    decision: AutomationReviewDecision,
  ) {
    const key = automationReviewDecisionKey(item);
    setReviewDecisions((current) => {
      if (decision === "unreviewed") {
        const { [key]: _ignored, ...next } = current;
        return next;
      }

      return { ...current, [key]: decision };
    });
  }

  return (
    <div
      className="mt-4 border-t border-stone-200 pt-3"
      data-testid="charge-inspector-budget-automation-readiness"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h5 className="text-sm font-semibold text-seed-950">
          Set targets and review rows
        </h5>
        <div className="flex flex-wrap gap-2">
          <StatusPill label="Current session only" tone="stone" />
          <StatusPill
            label={`${counts.ready.toLocaleString("en-US")} ready`}
            tone={counts.ready > 0 ? "seed" : "stone"}
          />
          <StatusPill
            label={`${counts.needsReview.toLocaleString("en-US")} need human review`}
            tone={counts.needsReview > 0 ? "earth" : "stone"}
          />
          <StatusPill
            label={`${counts.insufficientContext.toLocaleString("en-US")} missing target`}
            tone="stone"
          />
        </div>
      </div>

      <BudgetAutomationReviewQueue
        budgetTargetInputs={budgetTargetInputs}
        decisions={reviewDecisions}
        items={reviewQueueItems}
        onDecisionChange={setReviewDecision}
        onBudgetTargetChange={onBudgetTargetChange}
        targetPresets={targetPresets}
      />

      <p className="mt-3 text-xs leading-5 text-earth-600">
        This table keeps target editing, monthly actuals, factual target
        results, and review marks in one current-session place. Workflow labels
        only say whether the row has enough target context for a later guarded
        workflow review; review marks stay in this browser session and they do
        not approve execution, save decisions, rank actions, or recommend
        spending changes.
        {windowedRows.omittedCount > 0
          ? ` Showing ${windowedRows.includedCount.toLocaleString("en-US")} of ${windowedRows.totalCount.toLocaleString("en-US")} readiness rows; ${windowedRows.omittedCount.toLocaleString("en-US")} older or overflow rows are hidden by the display cap.`
          : ""}
      </p>
    </div>
  );
}

function BudgetAutomationReviewQueue({
  budgetTargetInputs,
  decisions,
  items,
  onBudgetTargetChange,
  onDecisionChange,
  targetPresets,
}: {
  budgetTargetInputs: Record<string, string>;
  decisions: Record<string, AutomationReviewDecision>;
  items: ChargeInspectorCategoryBudgetAutomationReviewQueueItem[];
  onBudgetTargetChange: (category: string, value: string) => void;
  onDecisionChange: (
    item: ChargeInspectorCategoryBudgetAutomationReviewQueueItem,
    decision: AutomationReviewDecision,
  ) => void;
  targetPresets: Map<string, AutomationTargetPreset>;
}) {
  const counts = summarizeBudgetAutomationReviewQueueItems(items);
  const decisionCounts = summarizeBudgetAutomationReviewDecisions(
    items,
    decisions,
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className="mt-3 border-y border-stone-200 py-3"
      data-testid="charge-inspector-budget-automation-review-queue"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h6 className="text-sm font-semibold text-seed-950">
            Rows to review
          </h6>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-earth-600">
            Use this table row by row: fill or adjust a category target, check
            the factual monthly result, then mark whether you reviewed it or
            need more context. These marks do not approve automation, save a
            decision, rank actions, or recommend spending changes.
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
            <StatusPill
              label={`${counts.humanReview.toLocaleString("en-US")} human review`}
              tone={counts.humanReview > 0 ? "earth" : "stone"}
            />
            <StatusPill
              label={`${counts.missingContext.toLocaleString("en-US")} missing context`}
              tone="stone"
            />
            <StatusPill
              label={`${counts.candidate.toLocaleString("en-US")} candidates`}
              tone={counts.candidate > 0 ? "seed" : "stone"}
            />
            <StatusPill
              label={`${counts.boundaryBlocked.toLocaleString("en-US")} boundary blocked`}
              tone={counts.boundaryBlocked > 0 ? "earth" : "stone"}
            />
          </div>
          <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
            <StatusPill
              label={`${decisionCounts.unreviewed.toLocaleString("en-US")} unreviewed`}
              tone="stone"
            />
            <StatusPill
              label={`${decisionCounts.candidateReviewed.toLocaleString("en-US")} reviewed`}
              tone={
                decisionCounts.candidateReviewed > 0 ? "seed" : "stone"
              }
            />
            <StatusPill
              label={`${decisionCounts.needsMoreContext.toLocaleString("en-US")} needs context`}
              tone={
                decisionCounts.needsMoreContext > 0 ? "earth" : "stone"
              }
            />
            <StatusPill
              label={`${decisionCounts.excluded.toLocaleString("en-US")} excluded`}
              tone={decisionCounts.excluded > 0 ? "earth" : "stone"}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[96rem] text-left text-sm">
          <thead className="border-b border-stone-200 text-xs font-semibold uppercase text-earth-600">
            <tr>
              <th className="px-3 py-2">Row</th>
              <th className="px-3 py-2">Actual</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-3 py-2">Workflow check</th>
              <th className="px-3 py-2">My review</th>
              <th className="py-2 pl-3">Why this row is here</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) => {
              const decisionKey = automationReviewDecisionKey(item);

              return (
                <BudgetAutomationReviewQueueRow
                  decision={decisions[decisionKey] ?? "unreviewed"}
                  item={item}
                  key={decisionKey}
                  onBudgetTargetChange={onBudgetTargetChange}
                  onDecisionChange={onDecisionChange}
                  targetInput={
                    budgetTargetInputs[item.judgment.category] ?? ""
                  }
                  targetPreset={
                    targetPresets.get(item.judgment.category) ?? null
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BudgetAutomationReviewQueueRow({
  decision,
  item,
  onBudgetTargetChange,
  onDecisionChange,
  targetInput,
  targetPreset,
}: {
  decision: AutomationReviewDecision;
  item: ChargeInspectorCategoryBudgetAutomationReviewQueueItem;
  onBudgetTargetChange: (category: string, value: string) => void;
  onDecisionChange: (
    item: ChargeInspectorCategoryBudgetAutomationReviewQueueItem,
    decision: AutomationReviewDecision,
  ) => void;
  targetInput: string;
  targetPreset: AutomationTargetPreset | null;
}) {
  const targetInputResult = parseCategoryBudgetTargetInput(targetInput);

  return (
    <tr data-testid="charge-inspector-budget-automation-review-queue-row">
      <td className="px-3 py-2 text-xs leading-5 text-earth-700">
        <div className="font-semibold text-seed-950">
          {item.judgment.month} {item.judgment.label}
        </div>
        <div className="mt-1">
          <StatusPill
            label={item.laneLabel}
            tone={budgetAutomationReviewQueueTone(item.lane)}
          />
        </div>
      </td>
      <td className="px-3 py-2 text-xs leading-5 text-earth-700">
        <div className="font-semibold tabular-nums text-seed-950">
          {item.judgment.actualDebitTotalLabel}
        </div>
        <div className="text-earth-600">
          {item.judgment.debitTransactionCount.toLocaleString("en-US")} debit
          rows
        </div>
      </td>
      <td className="px-3 py-2">
        <input
          aria-label={`Review target for ${item.judgment.month} ${item.judgment.label}`}
          aria-invalid={targetInputResult.errorMessage ? "true" : "false"}
          className="h-9 w-32 rounded-md border border-stone-300 bg-white px-2 text-sm tabular-nums text-earth-900 outline-none placeholder:text-earth-400 focus:border-seed-500 focus:ring-2 focus:ring-seed-500"
          data-testid="charge-inspector-category-budget-target"
          inputMode="decimal"
          maxLength={14}
          onChange={(event) =>
            onBudgetTargetChange(item.judgment.category, event.target.value)
          }
          placeholder="$0.00"
          type="text"
          value={targetInput}
        />
        <p className="mt-1 max-w-44 text-xs leading-5 text-earth-600">
          Applies to all {item.judgment.label} months.
        </p>
        {targetPreset ? (
          <div className="mt-2 max-w-48 text-xs leading-5 text-earth-600">
            <div className="tabular-nums">
              Candidate {targetPreset.amountLabel} from{" "}
              {targetPreset.sourceMonth}
            </div>
            <button
              className="mt-1 min-h-8 rounded-md border border-stone-300 bg-white px-2.5 text-xs font-semibold text-earth-800 shadow-sm hover:border-seed-300 hover:text-seed-900 focus:outline-none focus:ring-2 focus:ring-seed-500"
              data-testid="charge-inspector-category-budget-target-preset"
              onClick={() =>
                onBudgetTargetChange(item.judgment.category, targetPreset.value)
              }
              type="button"
            >
              Fill target
            </button>
          </div>
        ) : null}
        {targetInputResult.errorMessage ? (
          <p
            className="mt-1 max-w-44 text-xs leading-5 text-amber-800"
            data-testid="charge-inspector-category-budget-error"
          >
            {targetInputResult.errorMessage}
          </p>
        ) : null}
      </td>
      <td className="px-3 py-2 text-xs leading-5 text-earth-700">
        <StatusPill
          label={categoryMonthlyBudgetComparisonStatusLabel(
            item.judgment.sourceComparisonStatus,
          )}
          tone={
            item.judgment.sourceComparisonStatus === "over-target"
              ? "earth"
              : item.judgment.sourceComparisonStatus === "within-target"
                ? "seed"
                : "stone"
          }
        />
        <div className="mt-1 font-semibold tabular-nums text-seed-950">
          {item.judgment.varianceAmountLabel}
        </div>
        <div className="tabular-nums text-earth-600">
          Target {item.judgment.targetDebitTotalLabel}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-1">
          <StatusPill
            label={budgetAutomationSourceReadinessStatusLabel(
              item.judgment.sourceReadinessStatus,
            )}
            tone={budgetAutomationReadinessTone(
              item.judgment.sourceReadinessStatus,
            )}
          />
          <StatusPill
            label={item.judgment.judgmentStatusLabel}
            tone={budgetAutomationJudgmentTone(item.judgment.judgmentStatus)}
          />
        </div>
      </td>
      <td className="px-3 py-2">
        <div
          aria-label={`Review decision for ${item.judgment.month} ${item.judgment.label}`}
          className="inline-flex min-h-9 overflow-hidden rounded-md border border-stone-300 bg-white text-xs font-semibold shadow-sm"
          data-testid="charge-inspector-budget-automation-review-decision"
          role="radiogroup"
        >
          {AUTOMATION_REVIEW_DECISION_OPTIONS.map((option) => {
            const isActive = option.decision === decision;

            return (
              <button
                aria-checked={isActive}
                className={[
                  "px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-seed-500",
                  isActive
                    ? "bg-seed-700 text-white"
                    : "bg-white text-earth-700 hover:bg-stone-50",
                ].join(" ")}
                data-testid={`charge-inspector-budget-automation-review-${option.decision}`}
                key={option.decision}
                onClick={() => onDecisionChange(item, option.decision)}
                role="radio"
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </td>
      <td className="py-2 pl-3 text-xs leading-5 text-earth-700">
        <div className="font-semibold text-seed-950">
          {item.judgment.reasonLabel}
        </div>
        <div className="mt-1 text-earth-700">{item.reviewPrompt}</div>
        <div className="mt-1 text-earth-600">{item.judgment.explanation}</div>
      </td>
    </tr>
  );
}

function budgetAutomationReadinessTone(
  status: ChargeInspectorCategoryBudgetAutomationReadiness["readinessStatus"],
) {
  if (status === "ready") {
    return "seed";
  }

  if (status === "needs-review") {
    return "earth";
  }

  return "stone";
}

function budgetAutomationSourceReadinessStatusLabel(
  status: ChargeInspectorCategoryBudgetAutomationReadiness["readinessStatus"],
) {
  if (status === "ready") {
    return "Ready for explanation";
  }

  if (status === "needs-review") {
    return "Needs review";
  }

  return "Missing target";
}

function categoryMonthlyBudgetComparisonStatusLabel(
  status: ChargeInspectorCategoryMonthlyBudgetComparison["status"],
) {
  if (status === "over-target") {
    return "Over target";
  }

  if (status === "within-target") {
    return "Within target";
  }

  return "No target";
}

function budgetAutomationJudgmentTone(
  status: ChargeInspectorCategoryBudgetAutomationJudgment["judgmentStatus"],
) {
  if (status === "automation-candidate") {
    return "seed";
  }

  if (status === "needs-human-review") {
    return "earth";
  }

  return "stone";
}

function budgetAutomationReviewQueueTone(
  lane: ChargeInspectorCategoryBudgetAutomationReviewQueueLane,
) {
  if (lane === "candidate") {
    return "seed";
  }

  if (lane === "human-review" || lane === "boundary-blocked") {
    return "earth";
  }

  return "stone";
}

function summarizeCategoryBudgetAutomationReadiness(
  rows: ChargeInspectorCategoryBudgetAutomationReadiness[],
) {
  return rows.reduce(
    (counts, row) => {
      if (row.readinessStatus === "ready") {
        counts.ready += 1;
      } else if (row.readinessStatus === "needs-review") {
        counts.needsReview += 1;
      } else {
        counts.insufficientContext += 1;
      }

      return counts;
    },
    { insufficientContext: 0, needsReview: 0, ready: 0 },
  );
}

function summarizeBudgetAutomationReviewQueueItems(
  items: ChargeInspectorCategoryBudgetAutomationReviewQueueItem[],
) {
  return items.reduce(
    (counts, item) => {
      if (item.lane === "candidate") {
        counts.candidate += 1;
      } else if (item.lane === "human-review") {
        counts.humanReview += 1;
      } else if (item.lane === "boundary-blocked") {
        counts.boundaryBlocked += 1;
      } else {
        counts.missingContext += 1;
      }

      return counts;
    },
    { boundaryBlocked: 0, candidate: 0, humanReview: 0, missingContext: 0 },
  );
}

function summarizeBudgetAutomationReviewDecisions(
  items: ChargeInspectorCategoryBudgetAutomationReviewQueueItem[],
  decisions: Record<string, AutomationReviewDecision>,
) {
  return items.reduce(
    (counts, item) => {
      const decision =
        decisions[automationReviewDecisionKey(item)] ?? "unreviewed";

      if (decision === "candidate-reviewed") {
        counts.candidateReviewed += 1;
      } else if (decision === "needs-more-context") {
        counts.needsMoreContext += 1;
      } else if (decision === "excluded") {
        counts.excluded += 1;
      } else {
        counts.unreviewed += 1;
      }

      return counts;
    },
    {
      candidateReviewed: 0,
      excluded: 0,
      needsMoreContext: 0,
      unreviewed: 0,
    },
  );
}

function automationReviewDecisionKey(
  item: ChargeInspectorCategoryBudgetAutomationReviewQueueItem,
) {
  return [
    item.id,
    item.lane,
    item.judgment.judgmentStatus,
    item.judgment.reasonCode,
    item.sourceFactsLabel,
  ].join("|");
}

function buildAutomationTargetPresets(
  comparisons: ChargeInspectorCategoryMonthlyBudgetComparison[],
) {
  const presets = new Map<string, AutomationTargetPreset>();

  for (const comparison of comparisons) {
    if (comparison.actualDebitTotalCents <= 0) {
      continue;
    }

    const current = presets.get(comparison.category);
    if (current && current.sourceMonth >= comparison.month) {
      continue;
    }

    presets.set(comparison.category, {
      amountLabel: comparison.actualDebitTotalLabel,
      sourceMonth: comparison.month,
      value: comparison.actualDebitTotalLabel,
    });
  }

  return presets;
}

function CategorySummaryRow({
  category,
  onStatusChange,
  status,
}: {
  category: ChargeInspectorCategorySummary;
  onStatusChange: (
    category: string,
    status: ChargeInspectorCategoryReviewStatus,
  ) => void;
  status: ChargeInspectorCategoryReviewStatus;
}) {
  return (
    <tr data-testid="charge-inspector-category-row">
      <td className="py-2 pr-3 font-medium text-seed-950">
        <div>{category.label}</div>
        {category.evidenceRows.length > 0 ? (
          <details
            className="mt-2 max-w-sm rounded-md border border-stone-200 bg-stone-50 p-2 font-normal"
            data-testid="charge-inspector-category-evidence"
          >
            <summary className="cursor-pointer text-xs font-semibold text-earth-700 outline-none focus:ring-2 focus:ring-seed-500">
              Matched rows
            </summary>
            <p className="mt-2 text-xs leading-5 text-earth-600">
              Showing {category.evidenceRows.length.toLocaleString("en-US")} of{" "}
              {category.transactionCount.toLocaleString("en-US")} matched rows.
              Bounded evidence excludes raw descriptions, balances, and account
              identifiers.
            </p>
            <ul className="mt-2 space-y-2">
              {category.evidenceRows.map((row) => (
                <li
                  className="rounded-md bg-white p-2 text-xs leading-5 text-earth-700"
                  data-testid="charge-inspector-category-evidence-row"
                  key={row.id}
                >
                  <div className="font-semibold text-seed-950">
                    {row.merchantName}
                  </div>
                  <div>
                    {row.postedDate} / {row.amountLabel} /{" "}
                    {row.directionLabel}
                  </div>
                  <div className="break-words text-earth-500">
                    Rule: {row.ruleId}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </td>
      <td className="px-3 py-2 tabular-nums text-earth-800">
        {category.debitTotalLabel}
      </td>
      <td className="px-3 py-2 tabular-nums text-earth-800">
        {category.creditTotalLabel}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-earth-800">
        {category.transactionCount.toLocaleString("en-US")}
      </td>
      <td className="py-2 pl-3">
        <div
          aria-label={`Review status for ${category.label}`}
          className="inline-flex min-h-9 overflow-hidden rounded-md border border-stone-300 bg-white text-xs font-semibold shadow-sm"
          data-testid="charge-inspector-category-review-status"
          role="radiogroup"
        >
          {CATEGORY_REVIEW_OPTIONS.map((option) => {
            const isActive = option.status === status;

            return (
              <button
                aria-checked={isActive}
                className={[
                  "px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-seed-500",
                  isActive
                    ? "bg-seed-700 text-white"
                    : "bg-white text-earth-700 hover:bg-stone-50",
                ].join(" ")}
                data-testid={`charge-inspector-category-review-${option.status}`}
                key={option.status}
                onClick={() =>
                  onStatusChange(category.category, option.status)
                }
                role="radio"
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </td>
    </tr>
  );
}

function categoryReviewKey(review: ChargeInspectorReview) {
  return [
    review.dataMode,
    review.sourceLabel,
    review.reviewedTransactionCount,
    review.categorySummaryVersion,
    ...review.categorySummary.map(
      (category) =>
        `${category.category}:${category.debitTotalLabel}:${category.creditTotalLabel}:${category.transactionCount}:${category.evidenceRows.map((row) => row.id).join(",")}`,
    ),
  ].join("|");
}

function summarizeCategoryReviewStatuses(
  review: ChargeInspectorReview,
  statuses: Record<string, ChargeInspectorCategoryReviewStatus>,
) {
  return review.categorySummary.reduce(
    (counts, category) => {
      const status = statuses[category.category] ?? "unreviewed";

      if (status === "confirmed") {
        counts.confirmed += 1;
      } else if (status === "needs-review") {
        counts.needsReview += 1;
      }

      return counts;
    },
    { confirmed: 0, needsReview: 0 },
  );
}

function summarizeCategoryMonthlyBudgetComparisons(
  comparisons: ChargeInspectorCategoryMonthlyBudgetComparison[],
) {
  return comparisons.reduce(
    (counts, comparison) => {
      if (comparison.targetDebitTotalCents !== null) {
        counts.targetRows += 1;
      }
      if (comparison.status === "over-target") {
        counts.overTarget += 1;
      }
      return counts;
    },
    { overTarget: 0, targetRows: 0 },
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

            <p className="mt-3 text-xs leading-5 text-earth-600">
              Estimate from matched posting dates only. Not a payment
              instruction, cancellation instruction, or merchant action.
            </p>

            {item.limitations.length > 0 ? (
              <div className="mt-3 border-t border-stone-200 pt-3">
                <p className="text-xs font-semibold text-earth-700">
                  Limitations
                </p>
                <BoundaryList items={item.limitations} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function MonthlySpendingSummary({
  aiEnabled,
  review,
  showAiPanel,
}: {
  aiEnabled: boolean;
  review: ChargeInspectorReview;
  showAiPanel: boolean;
}) {
  return (
    <div
      className={reviewDisclosureClass("mt-4 p-3")}
      data-testid="charge-inspector-monthly-spending-summary"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-seed-950">
          Monthly spending summary
        </h4>
        <StatusPill label={review.spendingSummaryVersion} tone="stone" />
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="border-b border-stone-200 text-xs font-semibold uppercase text-earth-600">
            <tr>
              <th className="py-2 pr-3">Month</th>
              <th className="px-3 py-2">Spending</th>
              <th className="px-3 py-2">Credits</th>
              <th className="px-3 py-2">Net</th>
              <th className="py-2 pl-3 text-right">Rows</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {review.monthlySpendingSummary.map((month) => (
              <tr data-testid="charge-inspector-monthly-row" key={month.month}>
                <td className="py-2 pr-3 font-medium text-seed-950">
                  {month.month}
                </td>
                <td className="px-3 py-2 tabular-nums text-earth-800">
                  {month.debitTotalLabel}
                </td>
                <td className="px-3 py-2 tabular-nums text-earth-800">
                  {month.creditTotalLabel}
                </td>
                <td className="px-3 py-2 tabular-nums text-earth-800">
                  {month.netCashFlowLabel}
                </td>
                <td className="py-2 pl-3 text-right tabular-nums text-earth-800">
                  {month.transactionCount.toLocaleString("en-US")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-5 text-earth-600">
        Posted-date monthly totals only. This does not infer budgets,
        categories, or required actions.
      </p>

      {showAiPanel ? (
        <div className="mt-4">
          <AiMonthlySpendingExplanationPanel enabled={aiEnabled} />
        </div>
      ) : null}
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
