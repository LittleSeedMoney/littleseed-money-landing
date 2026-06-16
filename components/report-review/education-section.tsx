import type {
  DecisionReadiness,
  Finding,
} from "@/data/report-review-sample";
import {
  educationTopicAnchor,
  resolveEducationTopic,
  uniqueTopicIds,
} from "@/lib/report-review/education-topics";

import { ReviewSectionHeading, StatusPill } from "./shared";

type EducationTopicContext = {
  id: string;
  labels: string[];
};

export function EducationSection({
  decisionReadiness,
  findings,
}: {
  decisionReadiness: DecisionReadiness;
  findings: Finding[];
}) {
  const contexts = educationTopicContexts(findings, decisionReadiness);

  if (contexts.length === 0) {
    return null;
  }

  return (
    <section
      id="education"
      aria-labelledby="education-heading"
      className="space-y-3"
    >
      <ReviewSectionHeading
        eyebrow="Learning links"
        title="Education topics"
        description="Stable topic identifiers connect findings and decision results to future lessons without turning them into ranked advice."
        id="education-heading"
      />

      <div className="grid gap-3 md:grid-cols-2">
        {contexts.map((context) => {
          const topic = resolveEducationTopic(context.id);

          return (
            <article
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
              id={educationTopicAnchor(topic.id)}
              key={topic.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-seed-950">
                    {topic.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-earth-700">
                    {topic.concept}
                  </p>
                </div>
                <StatusPill
                  label={topic.status === "ready" ? "Ready" : "Target pending"}
                  tone="stone"
                />
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-seed-950">
                    Stable identifier
                  </dt>
                  <dd className="mt-1 break-words font-mono text-xs text-earth-700">
                    {topic.id}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-seed-950">
                    Connected from
                  </dt>
                  <dd className="mt-2">
                    <ul className="space-y-1 text-earth-700">
                      {context.labels.map((label) => (
                        <li key={label}>{label}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>

              {topic.href ? (
                <a
                  className="mt-4 inline-flex rounded-lg text-sm font-medium text-seed-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-seed-500"
                  href={topic.href}
                >
                  Open lesson
                </a>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function educationTopicContexts(
  findings: Finding[],
  decisionReadiness: DecisionReadiness,
): EducationTopicContext[] {
  const topicIds = uniqueTopicIds([
    ...findings.map((finding) => finding.educationTopics),
    decisionReadiness.educationTopics,
  ]);

  return topicIds.map((id) => ({
    id,
    labels: [
      ...findings
        .filter((finding) => finding.educationTopics.includes(id))
        .map((finding) => `Finding: ${finding.title}`),
      ...(decisionReadiness.educationTopics.includes(id)
        ? [`Decision slice: ${decisionReadiness.title}`]
        : []),
    ],
  }));
}
