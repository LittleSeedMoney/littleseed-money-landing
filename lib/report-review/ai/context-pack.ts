import { reportReviewSample } from "@/data/report-review-sample";
import {
  compareCategoryBudgetTargets,
  type ChargeInspectorCategoryBudgetTargetAmounts,
} from "@/lib/report-review/charge-inspector";

import { approvedKnowledgeArtifacts } from "./knowledge-artifacts";
import {
  REPORT_REVIEW_AI_CATEGORY_EVIDENCE_TARGET_ID,
  REPORT_REVIEW_AI_MONTHLY_SPENDING_TARGET_ID,
} from "./types";
import type {
  CoachContextPack,
  CoachContextPackAllowedQuestionType,
  CategoryEvidenceContext,
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
  if (targetId !== REPORT_REVIEW_AI_MONTHLY_SPENDING_TARGET_ID) {
    throw new CoachContextPackError(
      "targetId is not supported for report-review AI explanation.",
    );
  }

  const chargeInspector = reportReviewSample.chargeInspector;

  return {
    id: `coach_context_pack.v0.${REPORT_REVIEW_AI_MONTHLY_SPENDING_TARGET_ID}`,
    version: "coach_context_pack.v0",
    surface: "report_review",
    authority: "server",
    target: {
      type: "monthly_spending_summary",
      id: REPORT_REVIEW_AI_MONTHLY_SPENDING_TARGET_ID,
      title: "Charge Inspector monthly spending summary",
    },
    monthlySpendingSummary: {
      id: REPORT_REVIEW_AI_MONTHLY_SPENDING_TARGET_ID,
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

export function buildCategoryEvidenceContextPack({
  categoryBudgetTargets = {},
  categoryReviewStatuses = {},
  targetId,
}: {
  categoryBudgetTargets?: ChargeInspectorCategoryBudgetTargetAmounts;
  categoryReviewStatuses?: Record<
    string,
    CategoryEvidenceContext["categories"][number]["reviewStatus"]
  >;
  targetId: string;
}): CoachContextPack {
  if (targetId !== REPORT_REVIEW_AI_CATEGORY_EVIDENCE_TARGET_ID) {
    throw new CoachContextPackError(
      "targetId is not supported for report-review AI explanation.",
    );
  }

  const chargeInspector = reportReviewSample.chargeInspector;
  const categoryIds = new Set(
    chargeInspector.categorySummary.map((category) => category.category),
  );

  for (const category of Object.keys(categoryReviewStatuses)) {
    if (!categoryIds.has(category)) {
      throw new CoachContextPackError(
        `categoryReviewStatuses includes unsupported category ${category}.`,
      );
    }
  }

  for (const [category, amountCents] of Object.entries(categoryBudgetTargets)) {
    if (!categoryIds.has(category)) {
      throw new CoachContextPackError(
        `categoryBudgetTargets includes unsupported category ${category}.`,
      );
    }

    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new CoachContextPackError(
        `categoryBudgetTargets.${category} must be a positive cents integer.`,
      );
    }
  }

  const budgetComparisons = compareCategoryBudgetTargets(
    chargeInspector.categorySummary,
    categoryBudgetTargets,
  );
  const budgetComparisonByCategory = new Map(
    budgetComparisons.map((comparison) => [
      comparison.category,
      comparison,
    ]),
  );

  return {
    id: `coach_context_pack.v0.${REPORT_REVIEW_AI_CATEGORY_EVIDENCE_TARGET_ID}`,
    version: "coach_context_pack.v0",
    surface: "report_review",
    authority: "server",
    target: {
      type: "category_evidence",
      id: REPORT_REVIEW_AI_CATEGORY_EVIDENCE_TARGET_ID,
      title: "Charge Inspector category evidence",
    },
    categoryEvidence: {
      id: REPORT_REVIEW_AI_CATEGORY_EVIDENCE_TARGET_ID,
      version: "category_evidence_ai_context.v0",
      ...(budgetComparisons.length > 0
        ? {
            budgetComparisonVersion:
              "category_budget_comparison_ai_context.v0" as const,
          }
        : {}),
      ...(chargeInspector.categoryMonthlySummary.length > 0
        ? {
            categoryMonthlySummaryVersion:
              "category_monthly_summary_ai_context.v0" as const,
          }
        : {}),
      sourceLabel: chargeInspector.sourceLabel,
      reviewedTransactionCount: chargeInspector.reviewedTransactionCount,
      categorySummaryVersion: chargeInspector.categorySummaryVersion,
      categoryMonthlySummaryContractVersion:
        chargeInspector.categoryMonthlySummaryVersion,
      categories: chargeInspector.categorySummary.map((category) => {
        const budgetComparison = budgetComparisonByCategory.get(
          category.category,
        );

        return {
          category: category.category,
          label: category.label,
          debitTotalLabel: category.debitTotalLabel,
          creditTotalLabel: category.creditTotalLabel,
          transactionCount: category.transactionCount,
          debitTransactionCount: category.debitTransactionCount,
          creditTransactionCount: category.creditTransactionCount,
          reviewStatus:
            categoryReviewStatuses[category.category] ?? "unreviewed",
          ...(budgetComparison ? { budgetComparison } : {}),
          ruleIds: category.ruleIds,
          evidenceRows: category.evidenceRows,
          limitations: category.limitations,
        };
      }),
      categoryMonthlySummaryRows: chargeInspector.categoryMonthlySummary,
      limitations: [
        "Category evidence is deterministic rule output, not an AI categorization decision.",
        "Category monthly summary rows are aggregate posted-date-month totals only, not monthly budgets.",
        "Merchant names are bounded display labels from the current review, not full transaction descriptions.",
        "Budget comparison facts use only user-entered in-session targets and deterministic current-review category totals.",
        "This context does not include raw CSV rows, balances, check numbers, account identifiers, or full transaction history.",
        "The AI explanation cannot create budget targets, recategorize rows, judge spending quality, rank actions, or tell the user what to change.",
        ...chargeInspector.limitations,
      ],
      excludedFields: [
        "raw transaction rows",
        "full transaction descriptions",
        "account identifiers",
        "balances",
        "check numbers",
        "full account history",
        "automatic recategorization",
        "inferred budget targets",
        "budget variance judgments",
        "saved budget targets",
        "merchant actions",
        "action ranking",
      ],
    },
    evidenceSources: [],
    knowledgeArtifacts: [],
    allowedQuestionTypes: allowedQuestionTypes.filter(
      (questionType) => questionType !== "follow_up",
    ),
    excludedData: [
      "raw transaction rows",
      "full transaction descriptions",
      "account identifiers",
      "balances",
      "check numbers",
      "full account history",
      "account credentials",
      "linked-account data",
      "saved AI conversation history",
      "long-term memory",
      "automatic recategorization",
      "inferred budget targets",
      "budget variance judgments",
      "saved budget targets",
      "merchant actions",
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
  categoryBudgetTargets,
  categoryReviewStatuses,
  targetId,
  targetType,
}: {
  categoryBudgetTargets?: ChargeInspectorCategoryBudgetTargetAmounts;
  categoryReviewStatuses?: Record<
    string,
    CategoryEvidenceContext["categories"][number]["reviewStatus"]
  >;
  targetId: string;
  targetType: ReportReviewAiTargetType;
}): CoachContextPack {
  if (targetType === "finding") {
    return buildFindingContextPack({ targetId });
  }

  if (targetType === "monthly_spending_summary") {
    return buildMonthlySpendingSummaryContextPack({ targetId });
  }

  if (targetType === "category_evidence") {
    return buildCategoryEvidenceContextPack({
      categoryBudgetTargets,
      categoryReviewStatuses,
      targetId,
    });
  }

  throw new CoachContextPackError(
    "targetType is not supported for report-review AI explanation.",
  );
}
