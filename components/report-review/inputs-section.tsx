import type { ReportReviewSample } from "@/data/report-review-sample";

import {
  ReviewDisclosure,
  reviewPanelClass,
  ReviewSectionHeading,
  StatusPill,
} from "./shared";

export function InputsSection({
  dataCompleteness,
}: {
  dataCompleteness: ReportReviewSample["dataCompleteness"];
}) {
  return (
    <section
      id="snapshot-completeness"
      aria-labelledby="snapshot-completeness-heading"
      className="space-y-3"
    >
      <ReviewSectionHeading
        eyebrow="Snapshot context"
        title="Missing context and uncertainty"
        description="The surface keeps missing optional values separate from zero values, estimates, and calculated facts."
        id="snapshot-completeness-heading"
      />

      <div className={reviewPanelClass("p-5")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-seed-950">
              Data completeness
            </h3>
          </div>
          <StatusPill label={dataCompleteness.status} tone="stone" />
        </div>

        <ReviewDisclosure className="mt-4 rounded-lg p-3" summary="Details">
          <p className="mt-3 text-sm leading-6 text-earth-700">
            {dataCompleteness.explanation}
          </p>
        </ReviewDisclosure>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <InputStateList
            emptyText="No explicit missing user fields were recorded for this sample."
            items={dataCompleteness.missingContext}
            title="Missing context"
          />
          <InputStateList
            emptyText="No uncertainty notes were recorded."
            items={dataCompleteness.uncertainty}
            title="Uncertainty"
          />
          <InputStateList
            emptyText="No potentially unmeasured categories were recorded."
            items={dataCompleteness.potentiallyUnmeasuredCategories}
            title="Possibly unmeasured"
          />
        </div>
      </div>
    </section>
  );
}

function InputStateList({
  emptyText,
  items,
  title,
}: {
  emptyText: string;
  items: string[];
  title: string;
}) {
  return (
    <ReviewDisclosure className="rounded-lg p-3" summary={title}>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-earth-700">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-earth-700">{emptyText}</p>
      )}
    </ReviewDisclosure>
  );
}
