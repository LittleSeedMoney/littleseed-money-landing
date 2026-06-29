import type {
  EvidenceSource,
  Finding,
} from "@/data/report-review-sample";
import type {
  ChargeInspectorCategoryEvidenceRow,
  ChargeInspectorCategoryBudgetComparison,
  ChargeInspectorCategoryBudgetAutomationJudgment,
  ChargeInspectorCategoryBudgetAutomationReadiness,
  ChargeInspectorCategoryBudgetTargetAmounts,
  ChargeInspectorCategoryMonthlyBudgetComparison,
  ChargeInspectorCategoryMonthlySummary,
  ChargeInspectorCategoryReviewStatus,
  ChargeInspectorMonthlySummary,
  ChargeInspectorWindowPolicy,
} from "@/lib/report-review/charge-inspector";

export type ReportReviewAiQuestionType =
  | "explain_finding"
  | "missing_context"
  | "plain_language"
  | "next_questions"
  | "follow_up";

export type ReportReviewAiValidationStatus = "passed" | "fallback";

export type ReportReviewAiAnswerKind =
  | "validated_answer"
  | "boundary_refusal"
  | "validation_fallback"
  | "provider_error_fallback";

export type KnowledgeArtifactReviewStatus =
  | "approved"
  | "needs-review"
  | "rejected"
  | "stale";

export type KnowledgeArtifact = {
  id: string;
  contentHash: string;
  title: string;
  sourceType: "littleseed-authored" | "third-party-approved-summary";
  reviewStatus: KnowledgeArtifactReviewStatus;
  version: string;
  reviewedOn: string;
  summary: string;
  body: string;
  allowedUses: string[];
  prohibitedUses: string[];
  limitations: string[];
  sourcePath: string;
  tags: string[];
};

export type CoachContextPackAllowedQuestionType = ReportReviewAiQuestionType;

export const REPORT_REVIEW_AI_MONTHLY_SPENDING_TARGET_ID =
  "charge_inspector_monthly_spending_summary";

export const REPORT_REVIEW_AI_CATEGORY_EVIDENCE_TARGET_ID =
  "charge_inspector_category_evidence";

export type ReportReviewAiTargetType =
  | "finding"
  | "monthly_spending_summary"
  | "category_evidence";

export type MonthlySpendingContext = {
  id: "charge_inspector_monthly_spending_summary";
  version: "monthly_spending_ai_context.v0";
  sourceLabel: string;
  reviewedTransactionCount: number;
  spendingSummaryVersion: string;
  rows: ChargeInspectorMonthlySummary[];
  limitations: string[];
  excludedFields: string[];
};

export type CategoryEvidenceContextCategory = {
  category: string;
  label: string;
  debitTotalLabel: string;
  creditTotalLabel: string;
  transactionCount: number;
  debitTransactionCount: number;
  creditTransactionCount: number;
  reviewStatus: ChargeInspectorCategoryReviewStatus;
  budgetComparison?: ChargeInspectorCategoryBudgetComparison;
  ruleIds: string[];
  evidenceRows: ChargeInspectorCategoryEvidenceRow[];
  limitations: string[];
};

export type CategoryEvidenceWindowMetadata = {
  totalCount: number;
  includedCount: number;
  omittedCount: number;
  window: ChargeInspectorWindowPolicy;
};

type CategoryEvidenceFactBundleBase = {
  label: string;
  rowLabel: string;
  contractVersion: string;
  window: CategoryEvidenceWindowMetadata;
};

export type CategoryEvidenceFactBundle =
  | (CategoryEvidenceFactBundleBase & {
      id: "category_monthly_summary";
      aiContextVersion: "category_monthly_summary_ai_context.v0";
    })
  | (CategoryEvidenceFactBundleBase & {
      id: "category_monthly_budget_comparison";
      aiContextVersion: "category_monthly_budget_comparison_ai_context.v0";
    })
  | (CategoryEvidenceFactBundleBase & {
      id: "category_budget_automation_readiness";
      aiContextVersion: "category_budget_automation_readiness_ai_context.v0";
    })
  | (CategoryEvidenceFactBundleBase & {
      id: "category_budget_automation_judgment";
      aiContextVersion: "category_budget_automation_judgment_ai_context.v0";
    });

export type CategoryEvidenceContext = {
  id: "charge_inspector_category_evidence";
  version: "category_evidence_ai_context.v0";
  budgetComparisonVersion?: "category_budget_comparison_ai_context.v0";
  categoryMonthlySummaryVersion?: "category_monthly_summary_ai_context.v0";
  categoryMonthlyBudgetComparisonVersion?: "category_monthly_budget_comparison_ai_context.v0";
  categoryBudgetAutomationReadinessVersion?: "category_budget_automation_readiness_ai_context.v0";
  categoryBudgetAutomationJudgmentVersion?: "category_budget_automation_judgment_ai_context.v0";
  sourceLabel: string;
  reviewedTransactionCount: number;
  categorySummaryContractVersion: string;
  categoryMonthlySummaryContractVersion: string;
  categoryMonthlyBudgetComparisonContractVersion: string;
  categoryBudgetAutomationReadinessContractVersion: string;
  categoryBudgetAutomationJudgmentContractVersion: string;
  categories: CategoryEvidenceContextCategory[];
  categoryMonthlySummaryWindow: CategoryEvidenceWindowMetadata;
  categoryMonthlySummaryRows: ChargeInspectorCategoryMonthlySummary[];
  categoryMonthlyBudgetComparisonWindow: CategoryEvidenceWindowMetadata;
  categoryMonthlyBudgetComparisons: ChargeInspectorCategoryMonthlyBudgetComparison[];
  categoryBudgetAutomationReadinessWindow: CategoryEvidenceWindowMetadata;
  categoryBudgetAutomationReadinessRows: ChargeInspectorCategoryBudgetAutomationReadiness[];
  categoryBudgetAutomationJudgmentWindow: CategoryEvidenceWindowMetadata;
  categoryBudgetAutomationJudgmentRows: ChargeInspectorCategoryBudgetAutomationJudgment[];
  factBundles: CategoryEvidenceFactBundle[];
  limitations: string[];
  excludedFields: string[];
};

export type CoachContextPack = {
  id: string;
  version: "coach_context_pack.v0";
  surface: "report_review";
  authority: "server";
  target: {
    type: ReportReviewAiTargetType;
    id: string;
    title: string;
  };
  finding?: Pick<
    Finding,
    | "id"
    | "title"
    | "summary"
    | "whyItMatters"
    | "options"
    | "limitations"
    | "educationTopics"
    | "evidenceSourceIds"
  >;
  monthlySpendingSummary?: MonthlySpendingContext;
  categoryEvidence?: CategoryEvidenceContext;
  evidenceSources: EvidenceSource[];
  knowledgeArtifacts: KnowledgeArtifact[];
  allowedQuestionTypes: CoachContextPackAllowedQuestionType[];
  excludedData: string[];
  versions: {
    corpus: "knowledge_corpus.fixture.v0";
    sourceMap: "report_review_context_source_map.v0";
  };
};

export type ReportReviewAiEvidence = {
  id: string;
  text: string;
};

export type ReportReviewAiSource = {
  id: string;
  title: string;
  type: "context_pack" | "knowledge_artifact" | "report_finding";
};

export type ReportReviewAiVersions = {
  answerValidator: "ai_answer_validator.v0";
  contextPack: "coach_context_pack.v0";
  corpus: "knowledge_corpus.fixture.v0";
  categoryBudgetAutomationJudgmentContext?: "category_budget_automation_judgment_ai_context.v0";
  categoryBudgetComparisonContext?: "category_budget_comparison_ai_context.v0";
  categoryBudgetAutomationReadinessContext?: "category_budget_automation_readiness_ai_context.v0";
  categoryMonthlyBudgetComparisonContext?: "category_monthly_budget_comparison_ai_context.v0";
  categoryMonthlySummaryContext?: "category_monthly_summary_ai_context.v0";
  categoryEvidenceContext?: "category_evidence_ai_context.v0";
  monthlySpendingContext?: "monthly_spending_ai_context.v0";
  model: string;
  prompt: "report_review_explain.v0";
  sourceMap: "report_review_context_source_map.v0";
};

export type ReportReviewAiProviderInfo = {
  id: "fixture" | "openai";
  label: string;
  mode: "deterministic-fixture" | "llm";
};

export type ReportReviewAiAnswer = {
  answer: string;
  answerKind: ReportReviewAiAnswerKind;
  evidence: ReportReviewAiEvidence[];
  limitations: string[];
  sources: ReportReviewAiSource[];
  validation: {
    fallbackUsed: boolean;
    reasons: string[];
    status: ReportReviewAiValidationStatus;
  };
  versions: ReportReviewAiVersions;
  provider: ReportReviewAiProviderInfo;
};

export type ReportReviewAiRequest = {
  surface: "report_review";
  targetType: ReportReviewAiTargetType;
  targetId: string;
  questionType: ReportReviewAiQuestionType;
  userMessage: string | null;
  categoryBudgetTargets?: ChargeInspectorCategoryBudgetTargetAmounts;
  categoryReviewStatuses?: Record<string, ChargeInspectorCategoryReviewStatus>;
};

export type ReportReviewAiResponse = ReportReviewAiAnswer & {
  target: CoachContextPack["target"];
  questionType: ReportReviewAiQuestionType;
};

export type ReportReviewAiDraft = Pick<
  ReportReviewAiAnswer,
  "answer" | "evidence" | "limitations" | "sources"
>;
