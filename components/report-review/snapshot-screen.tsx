import type { ReportReviewSample } from "@/data/report-review-sample";
import type { ManualProfilePresetId } from "@/lib/report-review/manual-profile";

import {
  InputsSection,
} from "./inputs-section";
import {
  ReviewDisclosure,
  StatusPill,
} from "./shared";
import { ValidationChecklistSection } from "./validation-checklist-section";
import { DataSourcesSection } from "./data-sources-section";

export function SnapshotSupportDetails({
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
