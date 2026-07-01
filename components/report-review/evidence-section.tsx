import type { EvidenceSource } from "@/data/report-review-sample";

import {
  InfoList,
  MetaItem,
  reviewDisclosureClass,
  reviewDisclosureSummaryClass,
  reviewPanelClass,
  ReviewSectionHeading,
} from "./shared";

export function EvidenceSection({ sources }: { sources: EvidenceSource[] }) {
  return (
    <section
      id="evidence"
      aria-labelledby="evidence-heading"
      className="space-y-3"
    >
      <ReviewSectionHeading
        eyebrow="Traceability"
        title="Evidence sources"
        description="Source cards make the publisher, reviewed date, support, and limitation visible before report copy is considered complete."
        id="evidence-heading"
      />

      <div className="grid gap-3 xl:grid-cols-2">
        {sources.map((source) => (
          <EvidenceCard key={source.id} source={source} />
        ))}
      </div>
    </section>
  );
}

function EvidenceCard({ source }: { source: EvidenceSource }) {
  return (
    <article className={reviewPanelClass("p-5")}>
      <p className="text-sm font-medium text-seed-700">{source.publisher}</p>
      <h3 className="mt-1 text-base font-semibold text-seed-950">
        <a
          href={source.url}
          className="underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-seed-500"
          rel="noreferrer"
          target="_blank"
        >
          {source.title}
        </a>
      </h3>
      <dl className="mt-4 text-sm">
        <MetaItem label="Reviewed" value={source.reviewedOn} />
      </dl>
      <details className={reviewDisclosureClass("mt-4 p-3")}>
        <summary className={reviewDisclosureSummaryClass()}>
          Details
        </summary>
        <p className="mt-3 text-sm leading-6 text-earth-800">
          {source.supports}
        </p>
        <InfoList title="Limitations" items={source.limitations} />
      </details>
    </article>
  );
}
