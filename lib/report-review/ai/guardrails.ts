import type {
  CoachContextPack,
  ReportReviewAiAnswer,
  ReportReviewAiDraft,
  ReportReviewAiQuestionType,
  ReportReviewAiVersions,
} from "./types";

const MAX_FOLLOW_UP_LENGTH = 280;

const blockedQuestionPatterns = [
  /\b(buy|sell|hold)\s+(a\s+|the\s+|this\s+|that\s+)?(stock|security|securities|crypto|bitcoin|etf|option|bond|shares?)\b/i,
  /\b(which|what|best)\b.*\b(stock|security|securities|crypto|bitcoin|etf|option|bond|shares?)\b/i,
  /\b(tax deduction|irs|filing|refund|write[- ]?off|for tax purposes)\b/i,
  /\b(legal advice|lawyer|attorney|lawsuit|sue|bankruptcy|insolvency)\b/i,
  /\b(credit card recommendation|best card|which card)\b/i,
  /\b(refinance|consolidate|balance transfer)\b/i,
  /\b(cancel|dispute|chargeback|call the merchant|contact the merchant)\b/i,
  /\b(rank|priority|prioritize|what should i do first)\b/i,
  /\b(which|what)\b.*\b(pay|repay).*\bfirst\b/i,
  /\b(calculate|compute|exact amount|how much should i pay)\b/i,
];

const blockedAnswerPatterns = [
  /\byou should\s+(buy|sell|hold|pay|refinance|consolidate|cancel|dispute|apply|open)\b/i,
  /\bi recommend\s+(buying|selling|holding|paying|refinancing|consolidating|canceling|disputing|applying|opening)\b/i,
  /\bpay .* first\b/i,
  /\b(buy|sell|hold)\s+(a\s+|the\s+|this\s+|that\s+)?(stock|security|securities|crypto|bitcoin|etf|option|bond|shares?)\b/i,
  /\brefinance\b/i,
  /\bconsolidate\b/i,
  /\bbalance transfer\b/i,
  /\b(apply for|open|get)\b.*\bcredit card\b/i,
  /\bfor tax purposes\b/i,
  /\blegally required\b/i,
  /\bguarantee[sd]?\b/i,
];

export function validateQuestionBoundary({
  questionType,
  userMessage,
}: {
  questionType: ReportReviewAiQuestionType;
  userMessage: string | null;
}) {
  const reasons: string[] = [];

  if (questionType === "follow_up") {
    const message = userMessage?.trim() ?? "";

    if (message.length === 0) {
      reasons.push("Follow-up questions must include a message.");
    }

    if (message.length > MAX_FOLLOW_UP_LENGTH) {
      reasons.push("Follow-up questions must stay under 280 characters.");
    }

    for (const pattern of blockedQuestionPatterns) {
      if (pattern.test(message)) {
        reasons.push(
          "This question asks for advice, ranking, calculation, or action outside the report-review AI boundary.",
        );
        break;
      }
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

export function validateAiDraft({
  contextPack,
  draft,
}: {
  contextPack: CoachContextPack;
  draft: ReportReviewAiDraft;
}) {
  const reasons: string[] = [];

  if (draft.answer.trim().length === 0) {
    reasons.push("Answer is empty.");
  }

  if (draft.evidence.length === 0) {
    reasons.push("Answer is missing evidence.");
  }

  if (draft.limitations.length === 0) {
    reasons.push("Answer is missing limitations.");
  }

  if (draft.sources.length === 0) {
    reasons.push("Answer is missing source references.");
  }

  for (const pattern of blockedAnswerPatterns) {
    if (pattern.test(draft.answer)) {
      reasons.push("Answer appears to include prohibited advice or certainty.");
      break;
    }
  }

  const allowedSourceIds = new Set([
    contextPack.finding.id,
    contextPack.id,
    ...contextPack.knowledgeArtifacts.map((artifact) => artifact.id),
    ...contextPack.evidenceSources.map((source) => source.id),
  ]);

  for (const source of draft.sources) {
    if (!allowedSourceIds.has(source.id)) {
      reasons.push(`Source ${source.id} is not in the approved context pack.`);
    }
  }

  return {
    passed: reasons.length === 0,
    reasons,
  };
}

export function fallbackAnswer({
  contextPack,
  reasons,
  versions,
}: {
  contextPack: CoachContextPack;
  reasons: string[];
  versions: ReportReviewAiVersions;
}): ReportReviewAiAnswer {
  return {
    answer:
      "I cannot answer that from this selected report-review finding. This prototype can only explain the finding, name missing context, simplify the result, or suggest non-ranked questions to review next.",
    evidence: [
      {
        id: contextPack.id,
        text:
          "The request was evaluated against the bounded report-review context pack.",
      },
    ],
    limitations: [
      "This is not investment, tax, legal, credit-product, merchant-action, or account-linking advice.",
      "This prototype does not calculate new values or rank actions.",
      "No prompt or answer body is saved by this route.",
    ],
    sources: [
      {
        id: contextPack.id,
        title: contextPack.target.title,
        type: "context_pack",
      },
    ],
    validation: {
      fallbackUsed: true,
      reasons,
      status: "fallback",
    },
    versions,
    provider: {
      id: "fixture",
      label: "Boundary fallback",
      mode: "deterministic-fixture",
    },
  };
}
