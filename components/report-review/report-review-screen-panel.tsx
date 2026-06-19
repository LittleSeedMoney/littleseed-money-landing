import type { ChangeEvent, FormEvent } from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import type {
  ManualAssetValue,
  ManualDebtValue,
  ManualProfilePresetId,
  ManualProfileScalarField,
  ManualProfileValues,
} from "@/lib/report-review/manual-profile";
import type { ReportReviewScreenId } from "@/lib/report-review/report-review-screens";

import { ChargeInspectorSection } from "./charge-inspector-section";
import { EducationSection } from "./education-section";
import { EvidenceSection } from "./evidence-section";
import { FindingsSection } from "./findings-section";
import type { ManualRequestState } from "./manual-input-section";
import { OverviewSection } from "./overview-section";
import { ReportSections } from "./report-sections";
import { SnapshotScreen } from "./snapshot-screen";
import { reviewPanelClass, ReviewSectionHeading } from "./shared";

export function ReportReviewScreenPanel({
  activeScreen,
  errorMessage,
  generatedAt,
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
  activeScreen: ReportReviewScreenId;
  errorMessage: string;
  generatedAt: string;
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
  if (activeScreen === "snapshot") {
    return (
      <SnapshotScreen
        errorMessage={errorMessage}
        hasReportContent={hasReportContent(report)}
        onAddAsset={onAddAsset}
        onAddDebt={onAddDebt}
        onAssetUpdate={onAssetUpdate}
        onDebtUpdate={onDebtUpdate}
        onRemoveAsset={onRemoveAsset}
        onRemoveDebt={onRemoveDebt}
        onPresetSelect={onPresetSelect}
        onSubmit={onSubmit}
        onUpdate={onUpdate}
        report={report}
        requestState={requestState}
        selectedPreset={selectedPreset}
        sourceById={sourceById}
        values={values}
      />
    );
  }

  if (!hasReportContent(report)) {
    return <EmptyReportState />;
  }

  if (activeScreen === "charge-inspector") {
    return <ChargeInspectorSection review={report.chargeInspector} />;
  }

  if (activeScreen === "education") {
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

  return (
    <>
      <OverviewSection generatedAt={generatedAt} report={report} />
      <ReportSections sections={report.sections} sourceById={sourceById} />
      <FindingsSection findings={report.findings} />
    </>
  );
}

function hasReportContent(report: ReportReviewSample) {
  return report.summaryMetrics.length > 0 || report.sections.length > 0;
}

function EmptyReportState() {
  return (
    <section className={reviewPanelClass("p-6")}>
      <ReviewSectionHeading
        eyebrow="Review state"
        id="empty-report-state-heading"
        title="No report data returned"
        description="The platform response did not include renderable report sections or summary metrics for this session."
      />
    </section>
  );
}
