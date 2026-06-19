import type {
  EvidenceSource,
  ReportSection,
} from "@/data/report-review-sample";

import { ReviewSectionHeading } from "./shared";

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

      {sections.map((section) => (
        <article
          key={section.id}
          className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-seed-700">
                {section.evidenceLevel}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-seed-950">
                {section.question}
              </h3>
            </div>
            <span className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-earth-700">
              {section.id.replaceAll("_", " ")}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-earth-800">
            {section.answer}
          </p>

          <div className="mt-3 grid gap-3 border-t border-stone-200 pt-3 md:grid-cols-2">
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
        </article>
      ))}
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
