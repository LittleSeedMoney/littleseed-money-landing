import type { EvidenceSource, Finding } from "@/data/report-review-sample";

import { approvedKnowledgeArtifacts } from "./knowledge-artifacts";
import type { CoachContextPack } from "./types";

export function buildFindingContextPack({
  evidenceSources,
  finding,
}: {
  evidenceSources: EvidenceSource[];
  finding: Finding;
}): CoachContextPack {
  return {
    id: `coach_context_pack.v0.${finding.id}`,
    version: "coach_context_pack.v0",
    surface: "report_review",
    target: {
      type: "finding",
      id: finding.id,
      title: finding.title,
    },
    finding: {
      id: finding.id,
      title: finding.title,
      summary: finding.summary,
      whyItMatters: finding.whyItMatters,
      options: finding.options,
      limitations: finding.limitations,
      educationTopics: finding.educationTopics,
      evidenceSourceIds: finding.evidenceSourceIds,
    },
    evidenceSources: evidenceSources.filter((source) =>
      finding.evidenceSourceIds.includes(source.id),
    ),
    knowledgeArtifacts: approvedKnowledgeArtifacts(),
    excludedData: [
      "raw transaction rows",
      "full account history",
      "account credentials",
      "linked-account data",
      "saved AI conversation history",
      "long-term memory",
      "unapproved third-party retrieval content",
    ],
  };
}
