import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  createFixtureReportReviewAiProvider,
  selectReportReviewAiProvider,
  type ReportReviewAiProvider,
} from "./provider";
import {
  explainReportReviewFinding,
  parseReportReviewAiRequest,
  ReportReviewAiRequestError,
} from "./report-review-ai";
import type {
  CoachContextPack,
  ReportReviewAiQuestionType,
  ReportReviewAiRequest,
  ReportReviewAiResponse,
} from "./types";

export const REPORT_REVIEW_AI_EVAL_SUITE_VERSION =
  "report_review_ai_eval.v0";

export const REPORT_REVIEW_AI_EVAL_CASES_PATH = join(
  process.cwd(),
  "data/evals/report-review-ai.eval.jsonl",
);

export type ReportReviewAiEvalProviderMode = "fixture" | "openai";

type ReportReviewAiEvalOutcome = "answer" | "request_error";
type ReportReviewAiEvalStatus = "passed" | "failed";
type ReportReviewAiEvalProviderScenario =
  | "fixture"
  | "missing_evidence"
  | "prohibited_advice";

export type ReportReviewAiEvalCase = {
  id: string;
  description: string;
  providerScenario: ReportReviewAiEvalProviderScenario;
  request: unknown;
  expect: {
    outcome: ReportReviewAiEvalOutcome;
    fallbackUsed?: boolean;
    forbiddenAnswerPatterns: RegExp[];
    requiredErrorPatterns: RegExp[];
    requiredEvidenceIds: string[];
    requiredSourceIds: string[];
    requiredValidationReasonPatterns: RegExp[];
    requiredVersions: Partial<Record<keyof ReportReviewAiResponse["versions"], string>>;
    validationStatus?: ReportReviewAiResponse["validation"]["status"];
  };
};

export type ReportReviewAiEvalResult = {
  id: string;
  description: string;
  status: ReportReviewAiEvalStatus;
  outcome: ReportReviewAiEvalOutcome | "unexpected_error";
  provider: {
    id: string;
    mode: string;
    model: string;
  } | null;
  questionType: ReportReviewAiQuestionType | null;
  targetId: string | null;
  validation: {
    fallbackUsed: boolean | null;
    reasons: string[];
    status: string | null;
  };
  versions: Partial<ReportReviewAiResponse["versions"]>;
  failureReasons: string[];
};

export type ReportReviewAiEvalSummary = {
  suiteVersion: typeof REPORT_REVIEW_AI_EVAL_SUITE_VERSION;
  casesPath: string;
  providerMode: ReportReviewAiEvalProviderMode;
  total: number;
  passed: number;
  failed: number;
  results: ReportReviewAiEvalResult[];
};

export async function runReportReviewAiEvalSuite({
  cases = loadReportReviewAiEvalCases(),
  providerMode = "fixture",
}: {
  cases?: ReportReviewAiEvalCase[];
  providerMode?: ReportReviewAiEvalProviderMode;
} = {}): Promise<ReportReviewAiEvalSummary> {
  const baseProvider = selectEvalBaseProvider(providerMode);
  const results = [];

  for (const testCase of cases) {
    results.push(await runReportReviewAiEvalCase(testCase, baseProvider));
  }

  const passed = results.filter((result) => result.status === "passed").length;

  return {
    suiteVersion: REPORT_REVIEW_AI_EVAL_SUITE_VERSION,
    casesPath: REPORT_REVIEW_AI_EVAL_CASES_PATH,
    providerMode,
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}

export function loadReportReviewAiEvalCases({
  path = REPORT_REVIEW_AI_EVAL_CASES_PATH,
}: {
  path?: string;
} = {}) {
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line, index) => parseEvalCase(JSON.parse(line), index));
}

async function runReportReviewAiEvalCase(
  testCase: ReportReviewAiEvalCase,
  baseProvider: ReportReviewAiProvider,
): Promise<ReportReviewAiEvalResult> {
  const provider = providerForScenario(testCase.providerScenario, baseProvider);

  try {
    const request = parseReportReviewAiRequest(testCase.request);
    const answer = await explainReportReviewFinding(request, { provider });
    const failureReasons = evaluateAnswer(testCase, answer);

    return {
      id: testCase.id,
      description: testCase.description,
      status: failureReasons.length === 0 ? "passed" : "failed",
      outcome: "answer",
      provider: {
        id: answer.provider.id,
        mode: answer.provider.mode,
        model: answer.versions.model,
      },
      questionType: answer.questionType,
      targetId: answer.target.id,
      validation: {
        fallbackUsed: answer.validation.fallbackUsed,
        reasons: answer.validation.reasons,
        status: answer.validation.status,
      },
      versions: answer.versions,
      failureReasons,
    };
  } catch (error) {
    const failureReasons = evaluateError(testCase, error);
    const parsedRequest = readRequestHint(testCase.request);

    return {
      id: testCase.id,
      description: testCase.description,
      status: failureReasons.length === 0 ? "passed" : "failed",
      outcome:
        error instanceof ReportReviewAiRequestError
          ? "request_error"
          : "unexpected_error",
      provider: null,
      questionType: parsedRequest.questionType,
      targetId: parsedRequest.targetId,
      validation: {
        fallbackUsed: null,
        reasons: [],
        status: null,
      },
      versions: {},
      failureReasons,
    };
  }
}

function evaluateAnswer(
  testCase: ReportReviewAiEvalCase,
  answer: ReportReviewAiResponse,
) {
  const failures = [];

  if (testCase.expect.outcome !== "answer") {
    failures.push(`Expected ${testCase.expect.outcome}, received answer.`);
  }

  if (
    testCase.expect.validationStatus &&
    answer.validation.status !== testCase.expect.validationStatus
  ) {
    failures.push(
      `Expected validation status ${testCase.expect.validationStatus}, received ${answer.validation.status}.`,
    );
  }

  if (
    testCase.expect.fallbackUsed !== undefined &&
    answer.validation.fallbackUsed !== testCase.expect.fallbackUsed
  ) {
    failures.push(
      `Expected fallbackUsed ${testCase.expect.fallbackUsed}, received ${answer.validation.fallbackUsed}.`,
    );
  }

  for (const id of testCase.expect.requiredEvidenceIds) {
    if (!answer.evidence.some((evidence) => evidence.id === id)) {
      failures.push(`Missing required evidence id ${id}.`);
    }
  }

  for (const id of testCase.expect.requiredSourceIds) {
    if (!answer.sources.some((source) => source.id === id)) {
      failures.push(`Missing required source id ${id}.`);
    }
  }

  for (const pattern of testCase.expect.requiredValidationReasonPatterns) {
    if (!answer.validation.reasons.some((reason) => pattern.test(reason))) {
      failures.push(
        `Missing validation reason matching ${pattern.toString()}.`,
      );
    }
  }

  for (const [key, expected] of Object.entries(
    testCase.expect.requiredVersions,
  )) {
    const actual = answer.versions[key as keyof ReportReviewAiResponse["versions"]];
    if (actual !== expected) {
      failures.push(`Expected version ${key}=${expected}, received ${actual}.`);
    }
  }

  for (const pattern of testCase.expect.forbiddenAnswerPatterns) {
    if (pattern.test(answer.answer)) {
      failures.push(`Answer matched forbidden pattern ${pattern.toString()}.`);
    }
  }

  return failures;
}

function evaluateError(testCase: ReportReviewAiEvalCase, error: unknown) {
  const failures = [];

  if (testCase.expect.outcome !== "request_error") {
    failures.push(`Expected ${testCase.expect.outcome}, received error.`);
  }

  if (!(error instanceof ReportReviewAiRequestError)) {
    failures.push("Error was not a ReportReviewAiRequestError.");
    return failures;
  }

  for (const pattern of testCase.expect.requiredErrorPatterns) {
    if (!pattern.test(error.message)) {
      failures.push(`Error did not match ${pattern.toString()}.`);
    }
  }

  return failures;
}

function selectEvalBaseProvider(providerMode: ReportReviewAiEvalProviderMode) {
  if (providerMode === "openai") {
    const provider = selectReportReviewAiProvider();

    if (provider.info.id !== "openai") {
      throw new Error(
        "OpenAI eval requires LITTLESEED_AI_PROVIDER=openai and OPENAI_API_KEY.",
      );
    }

    return provider;
  }

  return createFixtureReportReviewAiProvider();
}

function providerForScenario(
  scenario: ReportReviewAiEvalProviderScenario,
  baseProvider: ReportReviewAiProvider,
) {
  if (scenario === "missing_evidence") {
    return createScenarioProvider({
      model: "fixture.report-review-ai.missing-evidence.v0",
      generateAnswer: async ({ contextPack }) => ({
        answer:
          "This intentionally malformed eval answer omits evidence while keeping limitations and sources.",
        evidence: [],
        limitations: ["Eval scenario: missing evidence should fail validation."],
        sources: [contextPackSource(contextPack)],
      }),
    });
  }

  if (scenario === "prohibited_advice") {
    return createScenarioProvider({
      model: "fixture.report-review-ai.prohibited-advice.v0",
      generateAnswer: async ({ contextPack }) => ({
        answer:
          "You should pay this debt first before doing anything else.",
        evidence: [
          {
            id: contextPack.finding.id,
            text: contextPack.finding.summary,
          },
        ],
        limitations: ["Eval scenario: prohibited advice should fail validation."],
        sources: [contextPackSource(contextPack)],
      }),
    });
  }

  return baseProvider;
}

function createScenarioProvider({
  generateAnswer,
  model,
}: {
  generateAnswer: ReportReviewAiProvider["generateAnswer"];
  model: string;
}): ReportReviewAiProvider {
  return {
    info: {
      id: "fixture",
      label: "Eval scenario fixture provider",
      mode: "deterministic-fixture",
    },
    generateAnswer,
    model,
  };
}

function contextPackSource(contextPack: CoachContextPack) {
  return {
    id: contextPack.id,
    title: contextPack.target.title,
    type: "context_pack" as const,
  };
}

function parseEvalCase(value: unknown, index: number): ReportReviewAiEvalCase {
  const record = expectRecord(value, `evalCases[${index}]`);
  const expect = expectRecord(record.expect, `evalCases[${index}].expect`);

  return {
    description: readString(record, "description", `evalCases[${index}]`),
    expect: {
      fallbackUsed: readOptionalBoolean(
        expect.fallbackUsed,
        `evalCases[${index}].expect.fallbackUsed`,
      ),
      forbiddenAnswerPatterns: readRegexArray(
        expect.forbiddenAnswerPatterns,
        `evalCases[${index}].expect.forbiddenAnswerPatterns`,
      ),
      outcome: readOutcome(expect.outcome, `evalCases[${index}].expect.outcome`),
      requiredErrorPatterns: readRegexArray(
        expect.requiredErrorPatterns,
        `evalCases[${index}].expect.requiredErrorPatterns`,
      ),
      requiredEvidenceIds: readOptionalStringArray(
        expect.requiredEvidenceIds,
        `evalCases[${index}].expect.requiredEvidenceIds`,
      ),
      requiredSourceIds: readOptionalStringArray(
        expect.requiredSourceIds,
        `evalCases[${index}].expect.requiredSourceIds`,
      ),
      requiredValidationReasonPatterns: readRegexArray(
        expect.requiredValidationReasonPatterns,
        `evalCases[${index}].expect.requiredValidationReasonPatterns`,
      ),
      requiredVersions: readVersionExpectations(
        expect.requiredVersions,
        `evalCases[${index}].expect.requiredVersions`,
      ),
      validationStatus: readOptionalValidationStatus(
        expect.validationStatus,
        `evalCases[${index}].expect.validationStatus`,
      ),
    },
    id: readString(record, "id", `evalCases[${index}]`),
    providerScenario: readProviderScenario(
      record.providerScenario,
      `evalCases[${index}].providerScenario`,
    ),
    request: record.request,
  };
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function readString(
  record: Record<string, unknown>,
  field: string,
  label: string,
) {
  const value = record[field];

  if (typeof value !== "string") {
    throw new Error(`${label}.${field} must be text.`);
  }

  return value;
}

function readOptionalBoolean(value: unknown, label: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean.`);
  }

  return value;
}

function readOptionalStringArray(value: unknown, label: string) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${label} must be an array of text.`);
  }

  return value as string[];
}

function readRegexArray(value: unknown, label: string) {
  return readOptionalStringArray(value, label).map(
    (pattern) => new RegExp(pattern, "i"),
  );
}

function readOutcome(value: unknown, label: string) {
  if (value === "answer" || value === "request_error") {
    return value;
  }

  throw new Error(`${label} must be answer or request_error.`);
}

function readOptionalValidationStatus(value: unknown, label: string) {
  if (value === undefined) {
    return undefined;
  }

  if (value === "passed" || value === "fallback") {
    return value;
  }

  throw new Error(`${label} must be passed or fallback.`);
}

function readProviderScenario(value: unknown, label: string) {
  if (value === undefined || value === "fixture") {
    return "fixture";
  }

  if (value === "missing_evidence" || value === "prohibited_advice") {
    return value;
  }

  throw new Error(`${label} must be a supported provider scenario.`);
}

function readVersionExpectations(value: unknown, label: string) {
  if (value === undefined) {
    return {};
  }

  const record = expectRecord(value, label);
  const versions: Partial<Record<keyof ReportReviewAiResponse["versions"], string>> =
    {};

  for (const [key, item] of Object.entries(record)) {
    if (
      key !== "answerValidator" &&
      key !== "contextPack" &&
      key !== "corpus" &&
      key !== "model" &&
      key !== "prompt" &&
      key !== "sourceMap"
    ) {
      throw new Error(`${label}.${key} is not a supported version key.`);
    }

    if (typeof item !== "string") {
      throw new Error(`${label}.${key} must be text.`);
    }

    versions[key] = item;
  }

  return versions;
}

function readRequestHint(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { questionType: null, targetId: null };
  }

  const record = value as Record<string, unknown>;
  return {
    questionType:
      typeof record.questionType === "string"
        ? (record.questionType as ReportReviewAiQuestionType)
        : null,
    targetId: typeof record.targetId === "string" ? record.targetId : null,
  };
}
