import {
  buildReportReviewContextPack,
  CoachContextPackError,
} from "./context-pack";
import {
  fallbackAnswer,
  validateAiDraft,
  validateQuestionBoundary,
} from "./guardrails";
import {
  KNOWLEDGE_CORPUS_VERSION,
} from "./knowledge-artifacts";
import {
  selectReportReviewAiProvider,
  type ReportReviewAiProvider,
} from "./provider";
import type {
  ReportReviewAiQuestionType,
  ReportReviewAiRequest,
  ReportReviewAiResponse,
  ReportReviewAiTargetType,
  ReportReviewAiVersions,
} from "./types";

export class ReportReviewAiRequestError extends Error {}

export type ReportReviewAiExplainOptions = {
  provider?: ReportReviewAiProvider;
};

const QUESTION_TYPES: ReportReviewAiQuestionType[] = [
  "explain_finding",
  "missing_context",
  "plain_language",
  "next_questions",
  "follow_up",
];

export async function explainReportReviewFinding(
  request: ReportReviewAiRequest,
  options: ReportReviewAiExplainOptions = {},
): Promise<ReportReviewAiResponse> {
  let contextPack;

  try {
    contextPack = buildReportReviewContextPack({
      categoryBudgetTargets: request.categoryBudgetTargets,
      categoryReviewStatuses: request.categoryReviewStatuses,
      targetId: request.targetId,
      targetType: request.targetType,
    });
  } catch (error) {
    if (error instanceof CoachContextPackError) {
      throw new ReportReviewAiRequestError(error.message);
    }

    throw error;
  }

  const provider = options.provider ?? selectReportReviewAiProvider();
  const versions: ReportReviewAiVersions = {
    answerValidator: "ai_answer_validator.v0",
    contextPack: "coach_context_pack.v0",
    corpus: KNOWLEDGE_CORPUS_VERSION,
    categoryBudgetComparisonContext:
      contextPack.categoryEvidence?.budgetComparisonVersion,
    categoryMonthlyBudgetComparisonContext:
      contextPack.categoryEvidence?.categoryMonthlyBudgetComparisonVersion,
    categoryMonthlyTargetStatusContext:
      contextPack.categoryEvidence?.categoryMonthlyTargetStatusVersion,
    categoryMonthlySummaryContext:
      contextPack.categoryEvidence?.categoryMonthlySummaryVersion,
    categoryEvidenceContext: contextPack.categoryEvidence?.version,
    monthlySpendingContext: contextPack.monthlySpendingSummary?.version,
    model: provider.model,
    prompt: "report_review_explain.v0",
    sourceMap: contextPack.versions.sourceMap,
  };
  const boundary = validateQuestionBoundary({
    questionType: request.questionType,
    userMessage: request.userMessage,
  });

  if (!contextPack.allowedQuestionTypes.includes(request.questionType)) {
    boundary.allowed = false;
    boundary.reasons.push(
      "This question type is not enabled for the selected report-review AI target.",
    );
  }

  if (!boundary.allowed) {
    return {
      ...fallbackAnswer({
        contextPack,
        kind: "boundary_refusal",
        reasons: boundary.reasons,
        versions,
      }),
      questionType: request.questionType,
      target: contextPack.target,
    };
  }

  try {
    const draft = await provider.generateAnswer({
      contextPack,
      questionType: request.questionType,
      userMessage: request.userMessage,
    });
    const validation = validateAiDraft({ contextPack, draft });

    if (!validation.passed) {
      return {
        ...fallbackAnswer({
          contextPack,
          kind: "validation_fallback",
          reasons: validation.reasons,
          versions,
        }),
        questionType: request.questionType,
        target: contextPack.target,
      };
    }

    return {
      ...draft,
      answerKind: "validated_answer",
      provider: provider.info,
      questionType: request.questionType,
      target: contextPack.target,
      validation: {
        fallbackUsed: false,
        reasons: [],
        status: "passed",
      },
      versions,
    };
  } catch {
    return {
      ...fallbackAnswer({
        contextPack,
        kind: "provider_error_fallback",
        reasons: ["The AI provider could not return a validated answer."],
        versions,
      }),
      questionType: request.questionType,
      target: contextPack.target,
    };
  }
}

export function parseReportReviewAiRequest(
  value: unknown,
): ReportReviewAiRequest {
  const record = expectRecord(value, "AI explanation request");
  const surface = readString(record, "surface", "AI explanation request");
  const targetType = readTargetType(record.targetType);
  const targetId = readString(record, "targetId", "AI explanation request");
  const questionType = readQuestionType(record.questionType);
  const userMessage = readNullableString(
    record.userMessage,
    "AI explanation request.userMessage",
  );
  const categoryBudgetTargets = readCategoryBudgetTargets(
    record.categoryBudgetTargets,
    "AI explanation request.categoryBudgetTargets",
  );
  const categoryReviewStatuses = readCategoryReviewStatuses(
    record.categoryReviewStatuses,
    "AI explanation request.categoryReviewStatuses",
  );

  if (surface !== "report_review") {
    throw new ReportReviewAiRequestError("surface must be report_review.");
  }

  rejectClientSuppliedContext(record);

  if (categoryReviewStatuses && targetType !== "category_evidence") {
    throw new ReportReviewAiRequestError(
      "categoryReviewStatuses is only supported for category evidence.",
    );
  }

  if (categoryBudgetTargets && targetType !== "category_evidence") {
    throw new ReportReviewAiRequestError(
      "categoryBudgetTargets is only supported for category evidence.",
    );
  }

  return {
    categoryBudgetTargets,
    categoryReviewStatuses,
    questionType,
    surface,
    targetId,
    targetType,
    userMessage,
  };
}

function readQuestionType(value: unknown): ReportReviewAiQuestionType {
  if (typeof value !== "string") {
    throw new ReportReviewAiRequestError("questionType must be text.");
  }

  if (!QUESTION_TYPES.includes(value as ReportReviewAiQuestionType)) {
    throw new ReportReviewAiRequestError("questionType is not supported.");
  }

  return value as ReportReviewAiQuestionType;
}

function readTargetType(value: unknown): ReportReviewAiTargetType {
  if (typeof value !== "string") {
    throw new ReportReviewAiRequestError("targetType must be text.");
  }

  if (
    value === "finding" ||
    value === "monthly_spending_summary" ||
    value === "category_evidence"
  ) {
    return value;
  }

  throw new ReportReviewAiRequestError("targetType is not supported.");
}

function readNullableString(value: unknown, label: string) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ReportReviewAiRequestError(`${label} must be text or null.`);
  }

  return value;
}

function readCategoryBudgetTargets(value: unknown, label: string) {
  if (value === undefined) {
    return undefined;
  }

  const record = expectRecord(value, label);
  const targets: NonNullable<ReportReviewAiRequest["categoryBudgetTargets"]> =
    {};

  for (const [category, amountCents] of Object.entries(record)) {
    if (category.trim().length === 0) {
      throw new ReportReviewAiRequestError(
        `${label} cannot include a blank category.`,
      );
    }

    if (
      typeof amountCents !== "number" ||
      !Number.isSafeInteger(amountCents) ||
      amountCents <= 0
    ) {
      throw new ReportReviewAiRequestError(
        `${label}.${category} must be a positive cents integer.`,
      );
    }

    targets[category] = amountCents;
  }

  return targets;
}

function readCategoryReviewStatuses(value: unknown, label: string) {
  if (value === undefined) {
    return undefined;
  }

  const record = expectRecord(value, label);
  const statuses: NonNullable<ReportReviewAiRequest["categoryReviewStatuses"]> =
    {};

  for (const [category, status] of Object.entries(record)) {
    if (category.trim().length === 0) {
      throw new ReportReviewAiRequestError(
        `${label} cannot include a blank category.`,
      );
    }

    if (
      status !== "unreviewed" &&
      status !== "confirmed" &&
      status !== "needs-review"
    ) {
      throw new ReportReviewAiRequestError(
        `${label}.${category} must be unreviewed, confirmed, or needs-review.`,
      );
    }

    statuses[category] = status;
  }

  return statuses;
}

function readString(
  record: Record<string, unknown>,
  field: string,
  label: string,
) {
  const value = record[field];

  if (typeof value !== "string") {
    throw new ReportReviewAiRequestError(`${label}.${field} must be text.`);
  }

  return value;
}

function rejectClientSuppliedContext(record: Record<string, unknown>) {
  const blockedFields = [
    "accountHistory",
    "contextPack",
    "categoryEvidence",
    "categoryEvidenceRows",
    "categoryBudgetComparison",
    "categoryBudgetComparisons",
    "categoryMonthlyBudgetComparison",
    "categoryMonthlyBudgetComparisons",
    "categoryMonthlyBudgetComparisonRows",
    "categoryMonthlyTargetStatus",
    "categoryMonthlyTargetStatuses",
    "categoryMonthlyTargetStatusRows",
    "categoryMonthlyBudgetJudgement",
    "categoryMonthlyBudgetJudgements",
    "categoryMonthlyBudgetJudgementRows",
    "categoryMonthlySummary",
    "categoryMonthlySummaryRows",
    "categorySummary",
    "evidenceSources",
    "financialProfile",
    "finding",
    "knowledgeArtifacts",
    "monthly_spending_summary",
    "monthlySpendingSummary",
    "merchantRows",
    "rawTransactions",
    "spendingSummary",
    "transactionCategories",
    "transactionSummary",
    "transactionHistory",
  ];

  for (const field of blockedFields) {
    if (field in record) {
      throw new ReportReviewAiRequestError(
        `${field} must not be supplied by the client.`,
      );
    }
  }
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ReportReviewAiRequestError(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}
