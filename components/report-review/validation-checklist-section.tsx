import { MANUAL_PROFILE_PRESETS } from "@/lib/report-review/manual-profile";
import type { ManualProfilePresetId } from "@/lib/report-review/manual-profile";
import { REPORT_REVIEW_VALIDATION_CHECKLIST } from "@/lib/report-review/validation-checklist";

import {
  joinClasses,
  reviewPanelClass,
  ReviewSectionHeading,
  reviewSubtlePanelClass,
  StatusPill,
} from "./shared";

const presetLabelById = new Map(
  MANUAL_PROFILE_PRESETS.map((preset) => [preset.id, preset.label]),
);

export function ValidationChecklistSection({
  selectedPreset,
}: {
  selectedPreset: ManualProfilePresetId | "custom";
}) {
  return (
    <section
      id="validation-checklist"
      aria-labelledby="validation-checklist-heading"
    >
      <ReviewSectionHeading
        eyebrow="Validation"
        id="validation-checklist-heading"
        title="Review checklist"
        description="Use these cases to confirm the private report-review surface preserves input meaning, data boundaries, and guidance-rule behavior."
      />

      <div className="mt-3 grid gap-4 xl:grid-cols-2">
        {REPORT_REVIEW_VALIDATION_CHECKLIST.map((item) => {
          const isActive = selectedPreset === item.presetId;

          return (
            <article
              className={reviewPanelClass(
                joinClasses("p-5", isActive && "border-seed-300"),
              )}
              key={item.presetId}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.14em] text-seed-700">
                    {presetLabelById.get(item.presetId)}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-seed-950">
                    {item.focus}
                  </h3>
                </div>
                <StatusPill
                  label={isActive ? "Active preset" : "Manual check"}
                  tone={isActive ? "seed" : "stone"}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ChecklistBlock
                  heading="Input checks"
                  items={item.inputChecks}
                  ordered
                />
                <ChecklistBlock
                  heading="Expected result"
                  items={item.expectedResults}
                />
              </div>

              <div className={reviewSubtlePanelClass("mt-4 px-4 py-3")}>
                <h4 className="text-sm font-semibold text-seed-950">
                  Boundary
                </h4>
                <p className="mt-1 text-sm leading-6 text-earth-700">
                  {item.boundary}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ChecklistBlock({
  heading,
  items,
  ordered = false,
}: {
  heading: string;
  items: string[];
  ordered?: boolean;
}) {
  const List = ordered ? "ol" : "ul";

  return (
    <div>
      <h4 className="text-sm font-semibold text-seed-950">{heading}</h4>
      <List className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
        {items.map((item) => (
          <li
            className={ordered ? "ml-4 list-decimal" : "ml-4 list-disc"}
            key={item}
          >
            {item}
          </li>
        ))}
      </List>
    </div>
  );
}
