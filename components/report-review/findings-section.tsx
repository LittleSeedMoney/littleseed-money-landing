import type { Finding } from "@/data/report-review-sample";

import { InfoList, SectionHeading, StatusPill } from "./shared";

export function FindingsSection({ findings }: { findings: Finding[] }) {
  return (
    <section
      id="findings"
      aria-labelledby="findings-heading"
      className="space-y-3"
    >
      <SectionHeading
        eyebrow="Review queue"
        title="Findings"
        description="Findings identify areas to review. They do not rank actions or turn education into personalized advice."
        id="findings-heading"
      />

      {findings.map((finding) => (
        <article
          key={finding.id}
          className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-earth-950">
                {finding.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-earth-700">
                {finding.summary}
              </p>
            </div>
            <StatusPill label="Education only" tone="seed" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoList title="Why it matters" items={[finding.whyItMatters]} />
            <InfoList title="Review options" items={finding.options} />
            <InfoList title="Limitations" items={finding.limitations} />
            <InfoList title="Education topics" items={finding.educationTopics} />
          </div>
        </article>
      ))}
    </section>
  );
}
