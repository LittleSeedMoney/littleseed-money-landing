import type { ReportReviewSample } from "@/data/report-review-sample";

import { ReviewSectionHeading, StatusPill } from "./shared";

export function InputsSection({
  dataCompleteness,
}: {
  dataCompleteness: ReportReviewSample["dataCompleteness"];
}) {
  return (
    <section
      id="inputs"
      aria-labelledby="inputs-heading"
      className="space-y-3"
    >
      <ReviewSectionHeading
        eyebrow="Inputs"
        title="Missing context and uncertainty"
        description="The surface keeps missing optional values separate from zero values, estimates, and calculated facts."
        id="inputs-heading"
      />

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-seed-950">
              Data completeness
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-earth-700">
              {dataCompleteness.explanation}
            </p>
          </div>
          <StatusPill label={dataCompleteness.status} tone="stone" />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
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
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <h3 className="text-sm font-semibold text-seed-950">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-earth-700">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-earth-700">{emptyText}</p>
      )}
    </div>
  );
}
