import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import type {
  ManualAssetValue,
  ManualDebtValue,
  ManualProfilePresetId,
  ManualProfileScalarField,
  ManualProfileValues,
} from "@/lib/report-review/manual-profile";
import type { GoalPlanningSummary } from "@/lib/report-review/goal-planning";

import { AssetPortfolioSection } from "./asset-portfolio-section";
import { DataSourcesSection } from "./data-sources-section";
import { InputsSection } from "./inputs-section";
import {
  PortfolioSnapshotGroupEditForm,
  type PortfolioEditGroup,
  type PortfolioEditTarget,
  type ManualRequestState,
} from "./manual-input-section";
import {
  reviewPanelClass,
  ReviewDisclosure,
  ReviewSectionHeading,
  StatusPill,
} from "./shared";
import { ValidationChecklistSection } from "./validation-checklist-section";

export function SnapshotScreen({
  errorMessage,
  hasReportContent,
  onAddAsset,
  onAddDebt,
  onAssetUpdate,
  onDebtUpdate,
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
  errorMessage: string;
  hasReportContent: boolean;
  onAddAsset: () => string;
  onAddDebt: () => string;
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
  const [activePortfolioEdit, setActivePortfolioEdit] =
    useState<PortfolioEditTarget | null>(null);
  const [activeProfileField, setActiveProfileField] =
    useState<ManualProfileScalarField | null>(null);
  const [editBaseline, setEditBaseline] =
    useState<SnapshotEditBaseline | null>(null);
  const wasSubmittingRef = useRef(false);

  useEffect(() => {
    if (
      wasSubmittingRef.current &&
      requestState === "idle" &&
      !errorMessage
    ) {
      setEditBaseline(null);
      setActivePortfolioEdit(null);
      setActiveProfileField(null);
    }

    wasSubmittingRef.current = requestState === "submitting";
  }, [errorMessage, requestState]);

  const editForms: Record<PortfolioEditGroup, ReactNode> = {
    assets: editFormFor("assets", "assets-edit-heading"),
    liabilities: editFormFor("liabilities", "liabilities-edit-heading"),
  };

  return (
    <>
      {hasReportContent ? (
        <>
          <AssetPortfolioSection
            activePortfolioEdit={activePortfolioEdit}
            activeProfileField={activeProfileField}
            chargeInspector={report.chargeInspector}
            decisionReadiness={report.decisionReadiness}
            errorMessage={errorMessage}
            onAddAsset={addAssetAndEdit}
            onAddDebt={addDebtAndEdit}
            onAssetEdit={startAssetEditing}
            onAssetUpdate={onAssetUpdate}
            onCancelEdit={cancelEditing}
            onDebtEdit={startDebtEditing}
            onDebtUpdate={onDebtUpdate}
            onProfileFieldEdit={startProfileFieldEditing}
            onProfileSubmit={onSubmit}
            onProfileUpdate={onUpdate}
            onPortfolioSubmit={onSubmit}
            portfolio={report.assetPortfolio}
            requestState={requestState}
            sourceById={sourceById}
            statusLabel={
              selectedPreset === "custom" ? "Custom snapshot" : "Preset snapshot"
            }
            topGoalSummary={topGoalSummary}
            values={values}
          />
        </>
      ) : (
        <>
          <section className={reviewPanelClass("space-y-5 p-4")}>
            <h3
              className="text-sm font-semibold text-seed-950"
              id="assets-edit-heading"
            >
              Assets
            </h3>
            {editForms.assets}
            <h3
              className="text-sm font-semibold text-seed-950"
              id="liabilities-edit-heading"
            >
              Liabilities
            </h3>
            {editForms.liabilities}
          </section>
          <EmptySnapshotState />
        </>
      )}
      <SnapshotSupportDetails
        dataCompleteness={report.dataCompleteness}
        dataMode={report.dataMode}
        reconciliation={report.sourceReconciliation}
        selectedPreset={selectedPreset}
        showDataCompleteness={hasReportContent}
        sources={report.dataSources}
      />
    </>
  );

  function editFormFor(group: PortfolioEditGroup, headingId: string) {
    return (
      <PortfolioSnapshotGroupEditForm
        errorMessage={errorMessage}
        group={group}
        headingId={headingId}
        onAddAsset={onAddAsset}
        onAddDebt={onAddDebt}
        onAssetUpdate={onAssetUpdate}
        onDebtUpdate={onDebtUpdate}
        onRemoveAsset={onRemoveAsset}
        onRemoveDebt={onRemoveDebt}
        onSubmit={onSubmit}
        requestState={requestState}
        values={values}
      />
    );
  }

  function startAssetEditing(id: string) {
    setEditBaseline((current) => current ?? { selectedPreset, values });
    setActivePortfolioEdit({ group: "assets", id });
    setActiveProfileField(null);
  }

  function startDebtEditing(id: string) {
    setEditBaseline((current) => current ?? { selectedPreset, values });
    setActivePortfolioEdit({ group: "liabilities", id });
    setActiveProfileField(null);
  }

  function addAssetAndEdit() {
    setEditBaseline((current) => current ?? { selectedPreset, values });
    const id = onAddAsset();
    setActivePortfolioEdit({ group: "assets", id });
    setActiveProfileField(null);
  }

  function addDebtAndEdit() {
    setEditBaseline((current) => current ?? { selectedPreset, values });
    const id = onAddDebt();
    setActivePortfolioEdit({ group: "liabilities", id });
    setActiveProfileField(null);
  }

  function startProfileFieldEditing(field: ManualProfileScalarField) {
    setEditBaseline((current) => current ?? { selectedPreset, values });
    setActivePortfolioEdit(null);
    setActiveProfileField(field);
  }

  function cancelEditing() {
    if (editBaseline) {
      onValuesReset(editBaseline.values, editBaseline.selectedPreset);
    }

    setEditBaseline(null);
    setActivePortfolioEdit(null);
    setActiveProfileField(null);
  }
}

function SnapshotSupportDetails({
  dataCompleteness,
  dataMode,
  reconciliation,
  selectedPreset,
  showDataCompleteness,
  sources,
}: {
  dataCompleteness: ReportReviewSample["dataCompleteness"];
  dataMode: string;
  reconciliation: ReportReviewSample["sourceReconciliation"];
  selectedPreset: ManualProfilePresetId | "custom";
  showDataCompleteness: boolean;
  sources: ReportReviewSample["dataSources"];
}) {
  return (
    <ReviewDisclosure
      className="overflow-hidden p-0"
      summary={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-seed-950">
              Review support
            </h3>
            <p className="sr-only">
              Data completeness, validation cases, and source details.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill label={dataCompleteness.status} tone="stone" />
            <StatusPill
              label={`${sources.length.toLocaleString("en-US")} sources`}
              tone="stone"
            />
            <span className="self-center text-sm font-semibold text-seed-700">
              Details
            </span>
          </div>
        </div>
      }
      variant="panel"
    >
      <div className="space-y-4 border-t border-stone-200 p-4">
        {showDataCompleteness ? (
          <InputsSection dataCompleteness={dataCompleteness} />
        ) : null}
        <ValidationChecklistSection selectedPreset={selectedPreset} />
        <DataSourcesSection
          dataMode={dataMode}
          reconciliation={reconciliation}
          sources={sources}
        />
      </div>
    </ReviewDisclosure>
  );
}

type SnapshotEditBaseline = {
  selectedPreset: ManualProfilePresetId | "custom";
  values: ManualProfileValues;
};

function EmptySnapshotState() {
  return (
    <section className={reviewPanelClass("p-6")}>
      <ReviewSectionHeading
        eyebrow="Snapshot state"
        id="empty-snapshot-state-heading"
        title="No snapshot output returned"
        description="The editable snapshot values are still available, but the platform response did not include renderable snapshot or report output for this session."
      />
    </section>
  );
}
