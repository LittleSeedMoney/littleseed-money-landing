import type {
  EvidenceSource,
  Finding,
} from "@/data/report-review-sample";

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

export type CoachContextPack = {
  id: string;
  version: "coach_context_pack.v0";
  surface: "report_review";
  authority: "server";
  target: {
    type: "finding";
    id: string;
    title: string;
  };
  finding: Pick<
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
  targetType: "finding";
  targetId: string;
  questionType: ReportReviewAiQuestionType;
  userMessage: string | null;
};

export type ReportReviewAiResponse = ReportReviewAiAnswer & {
  target: CoachContextPack["target"];
  questionType: ReportReviewAiQuestionType;
};

export type ReportReviewAiDraft = Pick<
  ReportReviewAiAnswer,
  "answer" | "evidence" | "limitations" | "sources"
>;
