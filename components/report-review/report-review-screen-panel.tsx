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
import { SnapshotScreen } from "./snapshot-screen";
import { ReviewDisclosure } from "./shared";
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

  // Money screen: net-worth hero up top, then the editable snapshot, then the
  // report/findings and Charge Inspector detail surfaces consolidated into
  // disclosures so the validation content stays reachable without owning a tab.
  // The provider lets the hero chart drive the snapshot's month + Monthly tab.
  return (
    <SnapshotViewProvider>
      <MoneyHero portfolio={report.assetPortfolio} />
      <SnapshotScreen
        errorMessage={errorMessage}
        hasReportContent={hasReportContent(report)}
        onAddAsset={onAddAsset}
        onAddDebt={onAddDebt}
        onAssetUpdate={onAssetUpdate}
        onDebtUpdate={onDebtUpdate}
        onRemoveAsset={onRemoveAsset}
        onRemoveDebt={onRemoveDebt}
        onSubmit={onSubmit}
        onUpdate={onUpdate}
        onValuesReset={onValuesReset}
        report={report}
        requestState={requestState}
        selectedPreset={selectedPreset}
        sourceById={sourceById}
        topGoalSummary={topGoalSummary}
        values={values}
      />
      {hasReportContent(report) ? (
        <>
          <ReviewDisclosure
            summary={
              <div>
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
              <FindingsSection aiEnabled={aiEnabled} findings={report.findings} />
            </div>
          </ReviewDisclosure>
          <ReviewDisclosure
            summary={
              <div>
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
        </>
      ) : null}
    </SnapshotViewProvider>
  );
}

function hasReportContent(report: ReportReviewSample) {
  return report.summaryMetrics.length > 0 || report.sections.length > 0;
}
