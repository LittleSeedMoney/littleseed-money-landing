import { buildFindingContextPack } from "./context-pack";
import {
  fallbackAnswer,
  validateAiDraft,
  validateQuestionBoundary,
} from "./guardrails";
import {
  KNOWLEDGE_CORPUS_VERSION,
} from "./knowledge-artifacts";
import { selectReportReviewAiProvider } from "./provider";
import type {
  ReportReviewAiQuestionType,
  ReportReviewAiRequest,
  ReportReviewAiResponse,
  ReportReviewAiVersions,
} from "./types";

export class ReportReviewAiRequestError extends Error {}

const QUESTION_TYPES: ReportReviewAiQuestionType[] = [
  "explain_finding",
  "missing_context",
  "plain_language",
  "next_questions",
  "follow_up",
];

export async function explainReportReviewFinding(
  request: ReportReviewAiRequest,
): Promise<ReportReviewAiResponse> {
  const contextPack = buildFindingContextPack({
    evidenceSources: request.evidenceSources,
    finding: request.finding,
  });
  const provider = selectReportReviewAiProvider();
  const versions: ReportReviewAiVersions = {
    answerValidator: "ai_answer_validator.v0",
    contextPack: "coach_context_pack.v0",
    corpus: KNOWLEDGE_CORPUS_VERSION,
    model: provider.model,
    prompt: "report_review_explain.v0",
  };
  const boundary = validateQuestionBoundary({
    questionType: request.questionType,
    userMessage: request.userMessage,
  });

  if (!boundary.allowed) {
    return {
      ...fallbackAnswer({
        contextPack,
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
          reasons: validation.reasons,
          versions,
        }),
        questionType: request.questionType,
        target: contextPack.target,
      };
    }

    return {
      ...draft,
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
  const targetType = readString(record, "targetType", "AI explanation request");
  const targetId = readString(record, "targetId", "AI explanation request");
  const questionType = readQuestionType(record.questionType);
  const userMessage = readNullableString(
    record.userMessage,
    "AI explanation request.userMessage",
  );
  const finding = expectRecord(record.finding, "AI explanation request.finding");

  if (surface !== "report_review") {
    throw new ReportReviewAiRequestError("surface must be report_review.");
  }

  if (targetType !== "finding") {
    throw new ReportReviewAiRequestError("targetType must be finding.");
  }

  const parsedFinding = {
    id: readString(finding, "id", "finding"),
    title: readString(finding, "title", "finding"),
    summary: readString(finding, "summary", "finding"),
    whyItMatters: readString(finding, "whyItMatters", "finding"),
    options: readStringArray(finding.options, "finding.options"),
    limitations: readStringArray(finding.limitations, "finding.limitations"),
    educationTopics: readStringArray(
      finding.educationTopics,
      "finding.educationTopics",
    ),
    evidenceSourceIds: readStringArray(
      finding.evidenceSourceIds,
      "finding.evidenceSourceIds",
    ),
  };

  if (targetId !== parsedFinding.id) {
    throw new ReportReviewAiRequestError(
      "targetId must match the selected finding id.",
    );
  }

  return {
    evidenceSources: parseEvidenceSources(record.evidenceSources),
    finding: parsedFinding,
    questionType,
    surface,
    targetId,
    targetType,
    userMessage,
  };
}

function parseEvidenceSources(value: unknown) {
  if (!Array.isArray(value)) {
    throw new ReportReviewAiRequestError("evidenceSources must be an array.");
  }

  return value.map((source, index) => {
    const record = expectRecord(source, `evidenceSources[${index}]`);
    return {
      id: readString(record, "id", `evidenceSources[${index}]`),
      publisher: readString(record, "publisher", `evidenceSources[${index}]`),
      title: readString(record, "title", `evidenceSources[${index}]`),
      url: readString(record, "url", `evidenceSources[${index}]`),
      reviewedOn: readString(record, "reviewedOn", `evidenceSources[${index}]`),
      supports: readString(record, "supports", `evidenceSources[${index}]`),
      limitations: readStringArray(
        record.limitations,
        `evidenceSources[${index}].limitations`,
      ),
    };
  });
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

function readNullableString(value: unknown, label: string) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ReportReviewAiRequestError(`${label} must be text or null.`);
  }

  return value;
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

function readStringArray(value: unknown, label: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ReportReviewAiRequestError(`${label} must be an array of text.`);
  }

  return value as string[];
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ReportReviewAiRequestError(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}
