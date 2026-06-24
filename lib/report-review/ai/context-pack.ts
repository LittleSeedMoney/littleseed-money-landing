import { reportReviewSample } from "@/data/report-review-sample";

import { approvedKnowledgeArtifacts } from "./knowledge-artifacts";
import type {
  CoachContextPack,
  CoachContextPackAllowedQuestionType,
  ReportReviewAiTargetType,
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

const MONTHLY_SPENDING_SUMMARY_TARGET_ID =
  "charge_inspector_monthly_spending_summary";

export function approvedKnowledgeArtifactIdsForFinding(findingId: string) {
  const artifactIds = artifactIdsByFindingId[findingId];

  if (!artifactIds || artifactIds.length === 0) {
    throw new CoachContextPackError(
      `No approved knowledge artifacts are mapped for targetId ${findingId}.`,
    );
  }

  return artifactIds;
}

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

  const artifactIds = approvedKnowledgeArtifactIdsForFinding(finding.id);

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
      "raw Charge Inspector evidence rows",
    ],
    versions: {
      corpus: "knowledge_corpus.fixture.v0",
      sourceMap: REPORT_REVIEW_CONTEXT_SOURCE_MAP_VERSION,
    },
  };
}

export function buildMonthlySpendingSummaryContextPack({
  targetId,
}: {
  targetId: string;
}): CoachContextPack {
  if (targetId !== MONTHLY_SPENDING_SUMMARY_TARGET_ID) {
    throw new CoachContextPackError(
      "targetId is not supported for report-review AI explanation.",
    );
  }

  const chargeInspector = reportReviewSample.chargeInspector;

  return {
    id: `coach_context_pack.v0.${MONTHLY_SPENDING_SUMMARY_TARGET_ID}`,
    version: "coach_context_pack.v0",
    surface: "report_review",
    authority: "server",
    target: {
      type: "monthly_spending_summary",
      id: MONTHLY_SPENDING_SUMMARY_TARGET_ID,
      title: "Charge Inspector monthly spending summary",
    },
    monthlySpendingSummary: {
      id: MONTHLY_SPENDING_SUMMARY_TARGET_ID,
      version: "monthly_spending_ai_context.v0",
      sourceLabel: chargeInspector.sourceLabel,
      reviewedTransactionCount: chargeInspector.reviewedTransactionCount,
      spendingSummaryVersion: chargeInspector.spendingSummaryVersion,
      rows: chargeInspector.monthlySpendingSummary,
      limitations: [
        "Monthly totals are aggregate posted-date summaries only.",
        "This context does not include merchant names, descriptions, account identifiers, or raw transaction rows.",
        "The summary does not infer categories, budget targets, merchant actions, or required next steps.",
        ...chargeInspector.limitations,
      ],
      excludedFields: [
        "raw transaction rows",
        "merchant names",
        "transaction descriptions",
        "account identifiers",
        "full account history",
        "category judgments",
        "budget variance judgments",
        "action ranking",
      ],
    },
    evidenceSources: [],
    knowledgeArtifacts: [],
    allowedQuestionTypes,
    excludedData: [
      "raw transaction rows",
      "merchant names",
      "transaction descriptions",
      "account identifiers",
      "full account history",
      "account credentials",
      "linked-account data",
      "saved AI conversation history",
      "long-term memory",
      "category judgments",
      "budget variance judgments",
      "action ranking",
      "unapproved third-party retrieval content",
    ],
    versions: {
      corpus: "knowledge_corpus.fixture.v0",
      sourceMap: REPORT_REVIEW_CONTEXT_SOURCE_MAP_VERSION,
    },
  };
}

export function buildReportReviewContextPack({
  targetId,
  targetType,
}: {
  targetId: string;
  targetType: ReportReviewAiTargetType;
}): CoachContextPack {
  if (targetType === "finding") {
    return buildFindingContextPack({ targetId });
  }

  if (targetType === "monthly_spending_summary") {
    return buildMonthlySpendingSummaryContextPack({ targetId });
  }

  throw new CoachContextPackError(
    "targetType is not supported for report-review AI explanation.",
  );
}
