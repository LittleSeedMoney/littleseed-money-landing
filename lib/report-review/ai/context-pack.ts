import { reportReviewSample } from "@/data/report-review-sample";

import { approvedKnowledgeArtifacts } from "./knowledge-artifacts";
import type {
  CoachContextPack,
  CoachContextPackAllowedQuestionType,
} from "./types";

export class CoachContextPackError extends Error {}

export const REPORT_REVIEW_CONTEXT_SOURCE_MAP_VERSION =
  "report_review_context_source_map.v0";

const allowedQuestionTypes: CoachContextPackAllowedQuestionType[] = [
  "explain_finding",
  "missing_context",
  "plain_language",
  "next_questions",
  "follow_up",
];

const artifactIdsByFindingId: Record<string, string[]> = {
  high_interest_debt_detected: ["knowledge.debt_cost_context.v0"],
};

export function buildFindingContextPack({
  targetId,
}: {
  targetId: string;
}): CoachContextPack {
  const finding = reportReviewSample.findings.find(
    (candidate) => candidate.id === targetId,
  );

  if (!finding) {
    throw new CoachContextPackError(
      "targetId is not supported for report-review AI explanation.",
    );
  }

  const artifactIds = artifactIdsByFindingId[finding.id] ?? [];

  return {
    id: `coach_context_pack.v0.${finding.id}`,
    version: "coach_context_pack.v0",
    surface: "report_review",
    authority: "server",
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
    evidenceSources: reportReviewSample.evidenceSources.filter((source) =>
      finding.evidenceSourceIds.includes(source.id),
    ),
    knowledgeArtifacts: approvedKnowledgeArtifacts({ artifactIds }),
    allowedQuestionTypes,
    excludedData: [
      "raw transaction rows",
      "full account history",
      "account credentials",
      "linked-account data",
      "saved AI conversation history",
      "long-term memory",
      "unapproved third-party retrieval content",
    ],
    versions: {
      corpus: "knowledge_corpus.fixture.v0",
      sourceMap: REPORT_REVIEW_CONTEXT_SOURCE_MAP_VERSION,
    },
  };
}
