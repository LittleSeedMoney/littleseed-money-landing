import type {
  EvidenceSource,
  ReportSection,
} from "@/data/report-review-sample";

import {
  reviewAccordionCardClass,
  reviewAccordionSummaryClass,
  ReviewSectionHeading,
} from "./shared";

export function ReportSections({
  sections,
  sourceById,
}: {
  sections: ReportSection[];
  sourceById: ReadonlyMap<string, EvidenceSource>;
}) {
  return (
    <section
      id="sections"
      aria-labelledby="sections-heading"
      className="space-y-3"
    >
      <ReviewSectionHeading
        eyebrow="Report body"
        title="Question-led sections"
        description="Each block starts with the user question, then separates the answer, source footing, and limitations."
        id="sections-heading"
      />

      <div className="space-y-3">
        {sections.map((section) => (
          <details
            key={section.id}
            className={reviewAccordionCardClass()}
          >
            <summary className={reviewAccordionSummaryClass()}>
              <div className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-0 w-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-earth-700 transition-transform group-open:rotate-90"
                />
                <div className="min-w-0">
                  <h3 className="mt-1 text-base font-semibold text-seed-950">
                    {section.question}
                  </h3>
                </div>
              </div>
            </summary>

            <div className="grid gap-4 border-t border-stone-200 px-4 pb-4 pt-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-seed-950">Answer</h4>
                <p className="mt-2 text-sm leading-6 text-earth-700">
                  {section.answer}
                </p>
              </div>
              <SourceFooting section={section} sourceById={sourceById} />
              <div>
                <h4 className="text-sm font-semibold text-seed-950">
                  Limitations
                </h4>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-earth-700">
                  {section.limitations.map((limitation, index) => (
                    <li key={`${limitation}-${index}`}>{limitation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function SourceFooting({
  section,
  sourceById,
}: {
  section: ReportSection;
  sourceById: ReadonlyMap<string, EvidenceSource>;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-seed-950">Source footing</h4>
      {section.evidenceSourceIds.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm leading-6 text-earth-700">
          {section.evidenceSourceIds.map((sourceId) => {
            const source = sourceById.get(sourceId);

            return <li key={sourceId}>{source ? source.title : sourceId}</li>;
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-earth-700">
          Calculation-only section. No official guidance claim is attached.
        </p>
      )}
    </div>
  );
}
