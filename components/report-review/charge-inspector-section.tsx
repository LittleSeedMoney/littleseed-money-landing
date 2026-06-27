"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  categoryBudgetTargetsFromInputs,
  chargeInspectorCategoryOrder,
  compareCategoryBudgetTargets,
  compareCategoryMonthlyBudgetTargets,
  isChargeInspectorEmpty,
  judgeCategoryMonthlyBudgetComparisons,
  mergeCategoryMonthlyBudgetComparisons,
  mergeCategoryMonthlyBudgetJudgements,
  parseCategoryBudgetTargetInput,
  recurringPaymentReviewItems,
  summarizeChargeInspectorReview,
  visibleChargeInspectorFindings,
  type ChargeInspectorCategoryBudgetComparison,
  type ChargeInspectorCategoryBudgetTargetAmounts,
  type ChargeInspectorCategoryMonthlyBudgetComparison,
  type ChargeInspectorCategoryMonthlyBudgetJudgement,
  type ChargeInspectorCategoryReviewStatus,
  type ChargeInspectorFinding,
  type ChargeInspectorCategoryMonthlySummary,
  type ChargeInspectorCategorySummary,
  type ChargeInspectorReview,
  type ChargeInspectorSummary,
  type RecurringPaymentReviewItem,
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
const CATEGORY_DISPLAY_INDEX = new Map(
  chargeInspectorCategoryOrder.map((category, index) => [category, index]),
);

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
              budgetTargetInputs={budgetTargetInputs}
              budgetTargets={budgetTargets}
              key={reviewKey}
              onBudgetTargetChange={setBudgetTarget}
              review={review}
              showAiPanel={showSampleAiPanels}
            />
          ) : null}

          {review.categoryMonthlySummary.length > 0 ? (
            <CategoryMonthlySummaryTable
              budgetTargets={budgetTargets}
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
  budgetTargetInputs,
  budgetTargets,
  onBudgetTargetChange,
  review,
  showAiPanel,
}: {
  aiEnabled: boolean;
  budgetTargetInputs: Record<string, string>;
  budgetTargets: ChargeInspectorCategoryBudgetTargetAmounts;
  onBudgetTargetChange: (category: string, value: string) => void;
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
  const budgetComparisons = useMemo(
    () => compareCategoryBudgetTargets(review.categorySummary, budgetTargets),
    [review.categorySummary, budgetTargets],
  );
  const budgetComparisonByCategory = useMemo(
    () =>
      new Map(
        budgetComparisons.map((comparison) => [
          comparison.category,
          comparison,
        ]),
      ),
    [budgetComparisons],
  );
  const budgetCounts = useMemo(
    () => summarizeCategoryBudgetComparisons(budgetComparisons),
    [budgetComparisons],
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
          <StatusPill
            label={`${budgetCounts.targets.toLocaleString("en-US")} targets`}
            tone="stone"
          />
          <StatusPill
            label={`${budgetCounts.overTarget.toLocaleString("en-US")} over`}
            tone={budgetCounts.overTarget > 0 ? "earth" : "stone"}
          />
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[68rem] text-left text-sm">
          <thead className="border-b border-stone-200 text-xs font-semibold uppercase text-earth-600">
            <tr>
              <th className="py-2 pr-3">Category</th>
              <th className="px-3 py-2">Spending</th>
              <th className="px-3 py-2">Credits</th>
              <th className="px-3 py-2">Review target</th>
              <th className="px-3 py-2">Difference</th>
              <th className="px-3 py-2 text-right">Rows</th>
              <th className="py-2 pl-3">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {review.categorySummary.map((category) => (
              <CategorySummaryRow
                budgetComparison={budgetComparisonByCategory.get(
                  category.category,
                ) ?? null}
                budgetTargetInput={
                  budgetTargetInputs[category.category] ?? ""
                }
                category={category}
                key={category.category}
                onBudgetTargetChange={onBudgetTargetChange}
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
        and target comparison stay in this browser session and do not edit
        category rules, recommend targets, or save preferences.
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
  budgetTargets,
  review,
}: {
  budgetTargets: ChargeInspectorCategoryBudgetTargetAmounts;
  review: ChargeInspectorReview;
}) {
  const monthCount = new Set(
    review.categoryMonthlySummary.map((row) => row.month),
  ).size;
  const sortedRows = [...review.categoryMonthlySummary].sort(
    compareCategoryMonthlySummaryRows,
  );
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
  const localBudgetJudgements = useMemo(
    () =>
      judgeCategoryMonthlyBudgetComparisons(
        budgetComparisons,
        review.categoryMonthlySummary,
      ),
    [budgetComparisons, review.categoryMonthlySummary],
  );
  const budgetJudgements = useMemo(
    () =>
      mergeCategoryMonthlyBudgetJudgements(
        review.categoryMonthlyBudgetJudgement,
        localBudgetJudgements,
      ),
    [localBudgetJudgements, review.categoryMonthlyBudgetJudgement],
  );
  const budgetJudgementByMonthCategory = useMemo(
    () =>
      new Map(
        budgetJudgements.map((judgement) => [
          `${judgement.month}:${judgement.category}`,
          judgement,
        ]),
      ),
    [budgetJudgements],
  );
  const budgetCounts = useMemo(
    () => summarizeCategoryMonthlyBudgetComparisons(budgetComparisons),
    [budgetComparisons],
  );
  const showBudgetComparison = budgetComparisons.length > 0;

  return (
    <div
      className={reviewDisclosureClass("mt-4 p-3")}
      data-testid="charge-inspector-category-monthly-summary"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-seed-950">
          Category by month
        </h4>
        <div className="flex flex-wrap gap-2">
          <StatusPill
            label={review.categoryMonthlySummaryVersion}
            tone="stone"
          />
          <StatusPill
            label={`${monthCount.toLocaleString("en-US")} months`}
            tone="stone"
          />
          {showBudgetComparison ? (
            <>
              <StatusPill
                label={`${budgetCounts.targetRows.toLocaleString("en-US")} monthly target rows`}
                tone="stone"
              />
              <StatusPill
                label={`${budgetCounts.overTarget.toLocaleString("en-US")} monthly over`}
                tone={budgetCounts.overTarget > 0 ? "earth" : "stone"}
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table
          className={[
            "w-full text-left text-sm",
            showBudgetComparison ? "min-w-[64rem]" : "min-w-[44rem]",
          ].join(" ")}
        >
          <thead className="border-b border-stone-200 text-xs font-semibold uppercase text-earth-600">
            {showBudgetComparison ? (
              <tr>
                <th className="py-2 pr-3">Month</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Spending</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Difference</th>
                <th className="px-3 py-2">Status</th>
                <th className="py-2 pl-3">Judgement</th>
              </tr>
            ) : (
              <tr>
                <th className="py-2 pr-3">Month</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Spending</th>
                <th className="px-3 py-2">Credits</th>
                <th className="px-3 py-2 text-right">Rows</th>
                <th className="py-2 pl-3">Rules</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-stone-100">
            {showBudgetComparison
              ? budgetComparisons.map((comparison) => (
                  <CategoryMonthlyBudgetComparisonRow
                    comparison={comparison}
                    judgement={
                      budgetJudgementByMonthCategory.get(
                        `${comparison.month}:${comparison.category}`,
                      ) ?? null
                    }
                    key={`${comparison.month}:${comparison.category}`}
                  />
                ))
              : sortedRows.map((row) => (
                  <CategoryMonthlySummaryRow
                    key={`${row.month}:${row.category}`}
                    row={row}
                  />
                ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-5 text-earth-600">
        Posted-date month plus deterministic category totals only. This is not
        a monthly budget, spending-quality judgment, action priority, or saved
        category memory. Monthly target comparison appears only when a
        user-entered target is available and uses posted-date-month category
        debit totals. Judgement badges are factual states against user-entered
        targets, not category rankings or spending instructions.
      </p>
    </div>
  );
}

function compareCategoryMonthlySummaryRows(
  left: ChargeInspectorCategoryMonthlySummary,
  right: ChargeInspectorCategoryMonthlySummary,
) {
  const monthComparison = left.month.localeCompare(right.month);
  if (monthComparison !== 0) {
    return monthComparison;
  }

  const categoryComparison =
    categoryDisplayIndex(left.category) - categoryDisplayIndex(right.category);
  if (categoryComparison !== 0) {
    return categoryComparison;
  }

  return left.label.localeCompare(right.label);
}

function categoryDisplayIndex(category: string) {
  return CATEGORY_DISPLAY_INDEX.get(category) ?? Number.MAX_SAFE_INTEGER;
}

function CategoryMonthlySummaryRow({
  row,
}: {
  row: ChargeInspectorCategoryMonthlySummary;
}) {
  return (
    <tr data-testid="charge-inspector-category-monthly-row">
      <td className="py-2 pr-3 font-medium text-seed-950">{row.month}</td>
      <td className="px-3 py-2 text-earth-800">{row.label}</td>
      <td className="px-3 py-2 tabular-nums text-earth-800">
        {row.debitTotalLabel}
      </td>
      <td className="px-3 py-2 tabular-nums text-earth-800">
        {row.creditTotalLabel}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-earth-800">
        {row.transactionCount.toLocaleString("en-US")}
      </td>
      <td className="py-2 pl-3 text-xs text-earth-600">
        {row.ruleIds.join(", ") || "none"}
      </td>
    </tr>
  );
}

function CategoryMonthlyBudgetComparisonRow({
  comparison,
  judgement,
}: {
  comparison: ChargeInspectorCategoryMonthlyBudgetComparison;
  judgement: ChargeInspectorCategoryMonthlyBudgetJudgement | null;
}) {
  return (
    <tr data-testid="charge-inspector-category-monthly-budget-row">
      <td className="py-2 pr-3 font-medium text-seed-950">
        {comparison.month}
      </td>
      <td className="px-3 py-2 text-earth-800">{comparison.label}</td>
      <td className="px-3 py-2 tabular-nums text-earth-800">
        {comparison.actualDebitTotalLabel}
      </td>
      <td className="px-3 py-2 tabular-nums text-earth-800">
        {comparison.targetDebitTotalLabel}
      </td>
      <td className="px-3 py-2 text-xs leading-5 text-earth-700">
        {comparison.varianceAmountLabel}
        {comparison.status !== "no-target" ? (
          <span className="ml-1 text-earth-500">
            ({comparison.variancePercentLabel})
          </span>
        ) : null}
      </td>
      <td className="py-2 pl-3">
        <StatusPill
          label={comparison.statusLabel}
          tone={comparison.status === "over-target" ? "earth" : "stone"}
        />
      </td>
      <td className="py-2 pl-3">
        {judgement ? (
          <StatusPill
            label={judgement.judgementLabel}
            tone={
              judgement.judgement === "over-user-target" ? "earth" : "stone"
            }
          />
        ) : (
          <span className="text-xs text-earth-500">Not available</span>
        )}
      </td>
    </tr>
  );
}

function CategorySummaryRow({
  budgetComparison,
  budgetTargetInput,
  category,
  onBudgetTargetChange,
  onStatusChange,
  status,
}: {
  budgetComparison: ChargeInspectorCategoryBudgetComparison | null;
  budgetTargetInput: string;
  category: ChargeInspectorCategorySummary;
  onBudgetTargetChange: (category: string, value: string) => void;
  onStatusChange: (
    category: string,
    status: ChargeInspectorCategoryReviewStatus,
  ) => void;
  status: ChargeInspectorCategoryReviewStatus;
}) {
  const targetInputResult = parseCategoryBudgetTargetInput(budgetTargetInput);
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
      <td className="px-3 py-2">
        <input
          aria-label={`Review target for ${category.label}`}
          aria-invalid={targetInputResult.errorMessage ? "true" : "false"}
          className="h-9 w-32 rounded-md border border-stone-300 bg-white px-2 text-sm tabular-nums text-earth-900 outline-none placeholder:text-earth-400 focus:border-seed-500 focus:ring-2 focus:ring-seed-500"
          data-testid="charge-inspector-category-budget-target"
          inputMode="decimal"
          maxLength={14}
          onChange={(event) =>
            onBudgetTargetChange(category.category, event.target.value)
          }
          placeholder="$0.00"
          type="text"
          value={budgetTargetInput}
        />
        {targetInputResult.errorMessage ? (
          <p
            className="mt-1 max-w-36 text-xs leading-5 text-amber-800"
            data-testid="charge-inspector-category-budget-error"
          >
            {targetInputResult.errorMessage}
          </p>
        ) : null}
      </td>
      <td
        className="px-3 py-2 text-xs leading-5 text-earth-700"
        data-testid="charge-inspector-category-budget-comparison"
      >
        {budgetComparison ? (
          <div className="space-y-1">
            <StatusPill
              label={budgetComparison.statusLabel}
              tone={
                budgetComparison.status === "over-target"
                  ? "earth"
                  : "seed"
              }
            />
            <div className="font-semibold tabular-nums text-seed-950">
              {budgetComparison.varianceAmountLabel}
            </div>
            <div className="tabular-nums text-earth-600">
              Target {budgetComparison.targetDebitTotalLabel}
            </div>
          </div>
        ) : (
          <span className="text-earth-500">No target</span>
        )}
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

function summarizeCategoryBudgetComparisons(
  comparisons: ChargeInspectorCategoryBudgetComparison[],
) {
  return comparisons.reduce(
    (counts, comparison) => {
      counts.targets += 1;
      if (comparison.status === "over-target") {
        counts.overTarget += 1;
      }
      return counts;
    },
    { overTarget: 0, targets: 0 },
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
