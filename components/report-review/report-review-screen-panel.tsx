import type { ChangeEvent, FormEvent } from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import type {
  ManualAssetValue,
  ManualDebtValue,
  ManualProfilePresetId,
  ManualProfileScalarField,
  ManualProfileValues,
} from "@/lib/report-review/manual-profile";
import type {
  GoalPlanningRow,
  GoalPlanningSummary,
} from "@/lib/report-review/goal-planning";
import type { ReportReviewScreenId } from "@/lib/report-review/report-review-screens";

import {
  MoneyBalanceDetails,
  MoneySpendingDetail,
} from "./asset-portfolio-section";
import { AssetLiabilityBreakdown } from "./asset-liability-breakdown";
import { AtAGlanceSection } from "./at-a-glance-section";
import { ChargeInspectorSection } from "./charge-inspector-section";
import { EducationSection } from "./education-section";
import { EvidenceSection } from "./evidence-section";
import { FindingsSection } from "./findings-section";
import {
  GoalPlanningScreen,
  type GoalMoveDirection,
} from "./goal-planning-screen";
import type { ManualRequestState } from "./manual-input-section";
import { MoneyHero } from "./money-hero";
import { OverviewSection } from "./overview-section";
import { ReportSections } from "./report-sections";
import { ReviewDisclosure } from "./shared";
import { SnapshotSupportDetails } from "./snapshot-screen";
import { SnapshotViewProvider } from "./snapshot-view-context";

export function ReportReviewScreenPanel({
  activeScreen,
  aiEnabled,
  errorMessage,
  generatedAt,
  goalPlanningAsOfMonth,
  goalRows,
  onAddAsset,
  onAddDebt,
  onAddGoal,
  onAssetUpdate,
  onDebtUpdate,
  onGoalMove,
  onGoalRemove,
  onGoalUpdate,
  onRemoveAsset,
  onRemoveDebt,
  onSubmit,
  onUpdate,
  onValuesReset,
  report,
  requestState,
  selectedPreset,
  sourceById,
  topGoalSummary,
  values,
}: {
  activeScreen: ReportReviewScreenId;
  aiEnabled: boolean;
  errorMessage: string;
  generatedAt: string;
  goalPlanningAsOfMonth: string;
  goalRows: GoalPlanningRow[];
  onAddAsset: () => string;
  onAddDebt: () => string;
  onAddGoal: () => void;
  onAssetUpdate: <T extends keyof ManualAssetValue>(
    id: string,
    field: T,
    value: ManualAssetValue[T],
  ) => void;
  onDebtUpdate: <T extends keyof ManualDebtValue>(
    id: string,
    field: T,
    value: ManualDebtValue[T],
  ) => void;
  onGoalMove: (id: string, direction: GoalMoveDirection) => void;
  onGoalRemove: (id: string) => void;
  onGoalUpdate: <T extends keyof GoalPlanningRow>(
    id: string,
    field: T,
    value: GoalPlanningRow[T],
  ) => void;
  onRemoveAsset: (id: string) => void;
  onRemoveDebt: (id: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (
    field: ManualProfileScalarField,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onValuesReset: (
    nextValues: ManualProfileValues,
    nextPreset: ManualProfilePresetId | "custom",
  ) => void;
  report: ReportReviewSample;
  requestState: ManualRequestState;
  selectedPreset: ManualProfilePresetId | "custom";
  sourceById: Map<string, ReportReviewSample["evidenceSources"][number]>;
  topGoalSummary: GoalPlanningSummary | null;
  values: ManualProfileValues;
}) {
  if (activeScreen === "goals") {
    return (
      <GoalPlanningScreen
        asOfMonth={goalPlanningAsOfMonth}
        goalRows={goalRows}
        onAddGoal={onAddGoal}
        onGoalMove={onGoalMove}
        onGoalRemove={onGoalRemove}
        onGoalUpdate={onGoalUpdate}
      />
    );
  }

  if (activeScreen === "learn") {
    return (
      <>
        <EducationSection
          decisionReadiness={report.decisionReadiness}
          findings={report.findings}
        />
        <EvidenceSection sources={report.evidenceSources} />
      </>
    );
  }

  // Money screen: question-first narrative. Net-worth hero leads, then the
  // detail disclosures follow in the order the consumer needs them. The
  // SnapshotViewProvider lets the hero chart drive month selection in the
  // spending detail disclosure.
  //
  // Narrative order (Phase 5.5.1 skeleton):
  //   1. Net-worth hero (chart + composition + tiles)
  //   1a. Asset & liability grouped breakdown (own / owe by category)
  //   1b. At-a-glance answers (Q1–Q4) — mobile only here, keeping the
  //       question-first order; on lg+ they render in the sticky right rail
  //       (see the shell) and this copy is hidden.
  //   [5.5.4 slot: things to look at]
  //   2. This month's spending disclosure  ← monthly table content
  //   3. Charge Inspector disclosure
  //   4. Report & findings disclosure
  //   5. Balance details disclosure  ← asset/liability lists + profile inputs
  //   6. Review support disclosure
  const hasReport = hasReportContent(report);

  // Rendered inside the Balance details disclosure when there is report content,
  // or on its own (with its editable-values empty state) when there is not.
  // Defined once so the two branches cannot drift on the shared prop set.
  const balanceDetails = (
    <MoneyBalanceDetails
      decisionReadiness={report.decisionReadiness}
      errorMessage={errorMessage}
      hasReportContent={hasReport}
      onAddAsset={onAddAsset}
      onAddDebt={onAddDebt}
      onAssetUpdate={onAssetUpdate}
      onDebtUpdate={onDebtUpdate}
      onRemoveAsset={onRemoveAsset}
      onRemoveDebt={onRemoveDebt}
      onPortfolioSubmit={onSubmit}
      onProfileSubmit={onSubmit}
      onProfileUpdate={onUpdate}
      onValuesReset={onValuesReset}
      portfolio={report.assetPortfolio}
      requestState={requestState}
      selectedPreset={selectedPreset}
      sourceById={sourceById}
      topGoalSummary={topGoalSummary}
      values={values}
    />
  );

  return (
    <SnapshotViewProvider>
      <MoneyHero report={report} topGoalSummary={topGoalSummary} />
      <AssetLiabilityBreakdown portfolio={report.assetPortfolio} />
      <AtAGlanceSection
        className="lg:hidden"
        summaryMetrics={report.summaryMetrics}
      />
      {hasReport ? (
        <>
          <ReviewDisclosure
            summary={
              <div id="spending-detail" className="scroll-mt-28">
                <h3 className="text-sm font-semibold text-seed-950">
                  This month's spending
                </h3>
                <p className="mt-0.5 text-xs text-earth-600">
                  Monthly income, expenses, and category targets for this
                  session.
                </p>
              </div>
            }
            variant="panel"
          >
            <div className="border-t border-stone-200 p-4">
              <MoneySpendingDetail
                chargeInspector={report.chargeInspector}
                values={values}
              />
            </div>
          </ReviewDisclosure>
          <ReviewDisclosure
            summary={
              // The fragment target lives on the always-visible summary, not on
              // the disclosure body, so native fragment navigation to
              // #charge-inspector does not open a closed <details> before React
              // hydrates (which would cause an `open` hydration mismatch).
              <div id="charge-inspector" className="scroll-mt-28">
                <h3 className="text-sm font-semibold text-seed-950">
                  Charge Inspector
                </h3>
                <p className="mt-0.5 text-xs text-earth-600">
                  Recurring-charge review for the current transaction source.
                </p>
              </div>
            }
            variant="panel"
          >
            <div className="border-t border-stone-200 p-4">
              <ChargeInspectorSection review={report.chargeInspector} />
            </div>
          </ReviewDisclosure>
          <ReviewDisclosure
            summary={
              <div id="report-findings-details" className="scroll-mt-28">
                <h3 className="text-sm font-semibold text-seed-950">
                  Report &amp; findings
                </h3>
                <p className="mt-0.5 text-xs text-earth-600">
                  Structured answers, evidence levels, and findings for this
                  session.
                </p>
              </div>
            }
            variant="panel"
          >
            <div className="space-y-4 border-t border-stone-200 p-4">
              <OverviewSection generatedAt={generatedAt} report={report} />
              <ReportSections
                sections={report.sections}
                sourceById={sourceById}
              />
              <FindingsSection
                aiEnabled={aiEnabled}
                findings={report.findings}
              />
            </div>
          </ReviewDisclosure>
          <ReviewDisclosure
            summary={
              <div id="portfolio" className="scroll-mt-28">
                <h3 className="text-sm font-semibold text-seed-950">
                  Balance details
                </h3>
                <p className="mt-0.5 text-xs text-earth-600">
                  Editable asset and liability balances, profile inputs, and
                  decision details.
                </p>
              </div>
            }
            variant="panel"
          >
            <div className="border-t border-stone-200 p-4">
              {balanceDetails}
            </div>
          </ReviewDisclosure>
        </>
      ) : (
        balanceDetails
      )}
      <SnapshotSupportDetails
        dataCompleteness={report.dataCompleteness}
        dataMode={report.dataMode}
        reconciliation={report.sourceReconciliation}
        selectedPreset={selectedPreset}
        showDataCompleteness={hasReport}
        sources={report.dataSources}
      />
    </SnapshotViewProvider>
  );
}

function hasReportContent(report: ReportReviewSample) {
  return report.summaryMetrics.length > 0 || report.sections.length > 0;
}
