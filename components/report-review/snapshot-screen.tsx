import type { ChangeEvent, FormEvent } from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import type {
  ManualAssetValue,
  ManualDebtValue,
  ManualProfilePresetId,
  ManualProfileScalarField,
  ManualProfileValues,
} from "@/lib/report-review/manual-profile";

import { AssetPortfolioSection } from "./asset-portfolio-section";
import { DataSourcesSection } from "./data-sources-section";
import { InputsSection } from "./inputs-section";
import {
  ManualInputSection,
  type ManualRequestState,
} from "./manual-input-section";
import { SavingGoalDraftSection } from "./saving-goal-draft-section";
import {
  reviewPanelClass,
  ReviewSectionHeading,
} from "./shared";
import { ValidationChecklistSection } from "./validation-checklist-section";

export function SnapshotScreen({
  errorMessage,
  hasReportContent,
  onAddAsset,
  onAddDebt,
  onAssetUpdate,
  onDebtUpdate,
  onPresetSelect,
  onRemoveAsset,
  onRemoveDebt,
  onSubmit,
  onUpdate,
  report,
  requestState,
  selectedPreset,
  sourceById,
  values,
}: {
  errorMessage: string;
  hasReportContent: boolean;
  onAddAsset: () => void;
  onAddDebt: () => void;
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
  onPresetSelect: (presetId: ManualProfilePresetId) => void;
  onRemoveAsset: (id: string) => void;
  onRemoveDebt: (id: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (
    field: ManualProfileScalarField,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  report: ReportReviewSample;
  requestState: ManualRequestState;
  selectedPreset: ManualProfilePresetId | "custom";
  sourceById: Map<string, ReportReviewSample["evidenceSources"][number]>;
  values: ManualProfileValues;
}) {
  return (
    <>
      <DataSourcesSection
        dataMode={report.dataMode}
        reconciliation={report.sourceReconciliation}
        sources={report.dataSources}
      />
      <ManualInputSection
        errorMessage={errorMessage}
        onAddAsset={onAddAsset}
        onAddDebt={onAddDebt}
        onAssetUpdate={onAssetUpdate}
        onDebtUpdate={onDebtUpdate}
        onRemoveAsset={onRemoveAsset}
        onRemoveDebt={onRemoveDebt}
        onPresetSelect={onPresetSelect}
        onSubmit={onSubmit}
        onUpdate={onUpdate}
        requestState={requestState}
        selectedPreset={selectedPreset}
        values={values}
      />
      {hasReportContent ? (
        <>
          <AssetPortfolioSection
            decisionReadiness={report.decisionReadiness}
            portfolio={report.assetPortfolio}
            sourceById={sourceById}
          />
          <SavingGoalDraftSection />
          <InputsSection dataCompleteness={report.dataCompleteness} />
        </>
      ) : (
        <EmptySnapshotState />
      )}
      <ValidationChecklistSection selectedPreset={selectedPreset} />
    </>
  );
}

function EmptySnapshotState() {
  return (
    <section className={reviewPanelClass("p-6")}>
      <ReviewSectionHeading
        eyebrow="Snapshot state"
        id="empty-snapshot-state-heading"
        title="No snapshot output returned"
        description="The manual input surface is still available, but the platform response did not include renderable snapshot or report output for this session."
      />
    </section>
  );
}
