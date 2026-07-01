import type { Finding } from "@/data/report-review-sample";

import {
  EducationTopicLink,
  reviewAccordionCardClass,
  reviewAccordionSummaryClass,
  ReviewSectionHeading,
  StatusPill,
} from "./shared";
import { AiFindingExplanationPanel } from "./ai-explanation-panel";

export function FindingsSection({
  aiEnabled,
  findings,
}: {
  aiEnabled: boolean;
  findings: Finding[];
}) {
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

      <div className="space-y-3">
        {findings.map((finding) => (
          <details
            data-testid="report-finding-card"
            key={finding.id}
            className={reviewAccordionCardClass()}
          >
            <summary className={reviewAccordionSummaryClass("sm:p-5")}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-0 w-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-earth-700 transition-transform group-open:rotate-90"
                    />
                    <h3 className="text-base font-semibold text-seed-950">
                      {finding.title}
                    </h3>
                  </div>
                </div>
                <StatusPill label="Education only" tone="seed" />
              </div>
            </summary>

            <div className="grid gap-4 border-t border-stone-200 px-4 pb-4 pt-3 md:grid-cols-2 sm:px-5">
              <FindingInfoList title="Summary" items={[finding.summary]} />
              <FindingInfoList
                title="Why it matters"
                items={[finding.whyItMatters]}
              />
              <FindingInfoList title="Review options" items={finding.options} />
              <FindingInfoList title="Limitations" items={finding.limitations} />
              <EducationTopicList topicIds={finding.educationTopics} />
            </div>

            <div className="border-t border-stone-200 px-4 py-4 sm:px-5">
              <AiFindingExplanationPanel
                enabled={aiEnabled}
                finding={finding}
              />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function FindingInfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-seed-950">{title}</h4>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function EducationTopicList({ topicIds }: { topicIds: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-seed-950">Education topics</h4>
      <ul className="mt-2 flex flex-wrap gap-2 text-sm">
        {topicIds.map((id) => (
          <li key={id}>
            <EducationTopicLink id={id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
