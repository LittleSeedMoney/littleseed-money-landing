import type { Finding } from "@/data/report-review-sample";
import {
  educationTopicAnchor,
  resolveEducationTopic,
} from "@/lib/report-review/education-topics";

import { InfoList, ReviewSectionHeading, StatusPill } from "./shared";

export function FindingsSection({ findings }: { findings: Finding[] }) {
  return (
    <section
      id="findings"
      aria-labelledby="findings-heading"
      className="space-y-3"
    >
      <ReviewSectionHeading
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
              <h3 className="text-lg font-semibold text-seed-950">
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
            <EducationTopicList topicIds={finding.educationTopics} />
          </div>
        </article>
      ))}
    </section>
  );
}

function EducationTopicList({ topicIds }: { topicIds: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-seed-950">Education topics</h4>
      <ul className="mt-2 flex flex-wrap gap-2 text-sm">
        {topicIds.map((id) => {
          const topic = resolveEducationTopic(id);

          return (
            <li key={id}>
              <a
                className="inline-flex min-h-8 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 font-medium text-earth-800 hover:border-seed-200 hover:bg-seed-50 hover:text-seed-900 focus:outline-none focus:ring-2 focus:ring-seed-500"
                href={`#${educationTopicAnchor(id)}`}
              >
                {topic.title}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
