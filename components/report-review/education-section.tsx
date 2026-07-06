import type {
  DecisionReadiness,
  Finding,
} from "@/data/report-review-sample";
import {
  educationTopicAnchor,
  resolveEducationTopic,
  uniqueTopicIds,
} from "@/lib/report-review/education-topics";

import {
  reviewPanelClass,
  ReviewSectionHeading,
  StatusPill,
} from "./shared";

type EducationTopicContext = {
  id: string;
  labels: string[];
  /** Evidence sources cited by the findings/decision slice behind this topic. */
  sourceIds: string[];
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
        eyebrow="Learn"
        title="Education topics"
        description="Short, sourced explainers tied to what your numbers showed. Education, not advice."
        id="education-heading"
      />

      <div className="space-y-2.5">
        {contexts.map((context) => {
          const topic = resolveEducationTopic(context.id);

          return (
            <article
              className={reviewPanelClass("flex gap-3.5 p-4")}
              id={educationTopicAnchor(topic.id)}
              key={topic.id}
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-seed-50 text-lg"
              >
                {topicIcon(topic.id)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-seed-950">
                    {topic.title}
                  </h3>
                  <StatusPill
                    label={topic.status === "ready" ? "Ready" : "Lesson pending"}
                    tone="stone"
                  />
                </div>
                <p className="mt-0.5 text-sm leading-5 text-earth-700">
                  {topic.concept}
                </p>
                <p className="mt-1.5 text-[11px] text-earth-400">
                  From {context.labels.join(" · ")}
                </p>
                <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {topic.href ? (
                    <a
                      className="inline-flex rounded-lg text-sm font-medium text-seed-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-seed-500"
                      href={topic.href}
                    >
                      Open lesson
                    </a>
                  ) : null}
                  {context.sourceIds.length > 0 ? (
                    <a
                      className="inline-flex rounded-lg text-sm font-medium text-seed-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-seed-500"
                      href={`#evidence-source-${context.sourceIds[0]}`}
                    >
                      View source{context.sourceIds.length > 1 ? "s" : ""} ↓
                    </a>
                  ) : null}
                </span>
                <p className="sr-only">Stable identifier {topic.id}.</p>
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-[11px] text-earth-400">
        Every explainer names its source below — nothing here is personalized
        advice.
      </p>
    </section>
  );
}

// Deterministic, decorative icon per stable topic id; falls back to a book.
function topicIcon(topicId: string) {
  if (topicId.includes("emergency")) {
    return "💧";
  }
  if (
    topicId.includes("debt") ||
    topicId.includes("interest") ||
    topicId.includes("repayment")
  ) {
    return "⚖️";
  }
  if (topicId.includes("net_worth") || topicId.includes("asset")) {
    return "📈";
  }
  if (topicId.includes("deficit") || topicId.includes("spend")) {
    return "🧾";
  }
  return "📘";
}

function educationTopicContexts(
  findings: Finding[],
  decisionReadiness: DecisionReadiness,
): EducationTopicContext[] {
  const topicIds = uniqueTopicIds([
    ...findings.map((finding) => finding.educationTopics),
    decisionReadiness.educationTopics,
  ]);

  return topicIds.map((id) => {
    const relatedFindings = findings.filter((finding) =>
      finding.educationTopics.includes(id),
    );
    const fromDecision = decisionReadiness.educationTopics.includes(id);

    return {
      id,
      labels: [
        ...relatedFindings.map((finding) => `Finding: ${finding.title}`),
        ...(fromDecision ? [`Decision slice: ${decisionReadiness.title}`] : []),
      ],
      sourceIds: [
        ...new Set([
          ...relatedFindings.flatMap((finding) => finding.evidenceSourceIds),
          ...(fromDecision ? decisionReadiness.evidenceSourceIds : []),
        ]),
      ],
    };
  });
}
