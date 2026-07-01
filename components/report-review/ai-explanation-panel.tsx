"use client";

import { useState, type FormEvent } from "react";

import type { Finding } from "@/data/report-review-sample";
import type {
  ChargeInspectorCategoryBudgetTargetAmounts,
  ChargeInspectorCategoryReviewStatus,
} from "@/lib/report-review/charge-inspector";
import {
  REPORT_REVIEW_AI_CATEGORY_EVIDENCE_TARGET_ID,
  REPORT_REVIEW_AI_MONTHLY_SPENDING_TARGET_ID,
} from "@/lib/report-review/ai/types";
import type {
  ReportReviewAiAnswerKind,
  ReportReviewAiQuestionType,
  ReportReviewAiResponse,
  ReportReviewAiTargetType,
  ReportReviewAiVersions,
} from "@/lib/report-review/ai/types";

import {
  joinClasses,
  reviewSubtlePanelClass,
  StatusPill,
} from "./shared";

type AiRequestState = "idle" | "loading" | "ready" | "request_error";

const versionDetailItems: {
  key: keyof ReportReviewAiVersions;
  label: string;
}[] = [
  { key: "monthlySpendingContext", label: "Monthly spend" },
  { key: "categoryEvidenceContext", label: "Category evidence" },
  { key: "categoryMonthlySummaryContext", label: "Category monthly" },
  { key: "categoryBudgetComparisonContext", label: "Target comparison" },
  { key: "categoryMonthlyBudgetComparisonContext", label: "Monthly target" },
  {
    key: "categoryBudgetAutomationReadinessContext",
    label: "Automation readiness",
  },
  {
    key: "categoryBudgetAutomationJudgmentContext",
    label: "Automation judgment",
  },
];

const answerKindDetails: Record<
  ReportReviewAiAnswerKind,
  {
    description: string;
    label: string;
    title: string;
    tone: "earth" | "seed" | "stone";
  }
> = {
  boundary_refusal: {
    description:
      "The selected question is outside the current report-review AI boundary. The unsafe request was replaced with a deterministic fallback.",
    label: "Boundary refusal",
    title: "Boundary refusal shown",
    tone: "stone",
  },
  provider_error_fallback: {
    description:
      "The provider did not return a usable answer. The panel is showing a deterministic fallback instead.",
    label: "Provider fallback",
    title: "Provider fallback shown",
    tone: "stone",
  },
  validated_answer: {
    description:
      "The answer passed the source, evidence, limitation, and boundary checks for this selected report-review target.",
    label: "Validated answer",
    title: "Validated explanation",
    tone: "seed",
  },
  validation_fallback: {
    description:
      "The provider returned an answer that failed validation. The unsafe draft was not displayed.",
    label: "Validation fallback",
    title: "Validation fallback shown",
    tone: "earth",
  },
};

const fixedActions: {
  type: Exclude<ReportReviewAiQuestionType, "follow_up">;
}[] = [
  { type: "explain_finding" },
  { type: "missing_context" },
  { type: "plain_language" },
  { type: "next_questions" },
];

const findingActionLabels: Record<
  Exclude<ReportReviewAiQuestionType, "follow_up">,
  string
> = {
  explain_finding: "Explain finding",
  missing_context: "Missing context",
  next_questions: "Next questions",
  plain_language: "Plain language",
};

const monthlySummaryActionLabels: Record<
  Exclude<ReportReviewAiQuestionType, "follow_up">,
  string
> = {
  explain_finding: "Explain summary",
  missing_context: "Missing context",
  next_questions: "Next questions",
  plain_language: "Plain language",
};

const categoryEvidenceActionLabels: Record<
  Exclude<ReportReviewAiQuestionType, "follow_up">,
  string
> = {
  explain_finding: "Explain categories",
  missing_context: "Missing context",
  next_questions: "Next questions",
  plain_language: "Plain language",
};

type AiExplanationTarget = {
  id: string;
  type: ReportReviewAiTargetType;
};

type AiExplanationPanelCopy = {
  actionLabels: Record<Exclude<ReportReviewAiQuestionType, "follow_up">, string>;
  disabledDescription: string;
  enabledDescription: string;
  followUpPlaceholder?: string;
  title: string;
};

export function AiFindingExplanationPanel({
  enabled,
  finding,
}: {
  enabled: boolean;
  finding: Finding;
}) {
  return (
    <AiReportReviewExplanationPanel
      allowFollowUp={true}
      copy={{
        actionLabels: findingActionLabels,
        disabledDescription:
          "This private report-review panel is wired for bounded AI explanations but does not call the AI route until the dev flag is enabled.",
        enabledDescription:
          "Answers are limited to this selected finding, approved knowledge corpus, evidence, limitations, and version metadata.",
        followUpPlaceholder: "Ask about this finding only",
        title: "AI explanation",
      }}
      enabled={enabled}
      target={{
        id: finding.id,
        type: "finding",
      }}
    />
  );
}

export function AiMonthlySpendingExplanationPanel({
  enabled,
}: {
  enabled: boolean;
}) {
  return (
    <AiReportReviewExplanationPanel
      allowFollowUp={false}
      copy={{
        actionLabels: monthlySummaryActionLabels,
        disabledDescription:
          "This monthly summary can be explained only when the private/dev AI flag is enabled. The request still uses server-owned aggregate context, not raw transactions.",
        enabledDescription:
          "Answers are limited to server-owned monthly aggregate rows, source labels, limitations, and version metadata. Raw transactions, merchant names, categories, budgets, and action priorities are excluded.",
        title: "AI monthly summary",
      }}
      enabled={enabled}
      target={{
        id: REPORT_REVIEW_AI_MONTHLY_SPENDING_TARGET_ID,
        type: "monthly_spending_summary",
      }}
    />
  );
}

export function AiCategoryEvidenceExplanationPanel({
  categoryBudgetTargets,
  categoryReviewStatuses,
  enabled,
}: {
  categoryBudgetTargets: ChargeInspectorCategoryBudgetTargetAmounts;
  categoryReviewStatuses: Record<string, ChargeInspectorCategoryReviewStatus>;
  enabled: boolean;
}) {
  return (
    <AiReportReviewExplanationPanel
      allowFollowUp={false}
      categoryBudgetTargets={categoryBudgetTargets}
      categoryReviewStatuses={categoryReviewStatuses}
      copy={{
        actionLabels: categoryEvidenceActionLabels,
        disabledDescription:
          "This category evidence panel is wired for bounded AI explanations but does not call the AI route until the private/dev flag is enabled.",
        enabledDescription:
          "Answers are limited to server-owned category totals, bounded merchant-display evidence rows, rule ids, review status, user-entered target comparison facts, monthly target comparison facts, limitations, and version metadata. Raw CSV rows, account history, balances, inferred budgets, recategorization, and action ranking are excluded.",
        title: "AI category evidence",
      }}
      enabled={enabled}
      target={{
        id: REPORT_REVIEW_AI_CATEGORY_EVIDENCE_TARGET_ID,
        type: "category_evidence",
      }}
    />
  );
}

function AiReportReviewExplanationPanel({
  allowFollowUp,
  categoryBudgetTargets,
  categoryReviewStatuses,
  copy,
  enabled,
  target,
}: {
  allowFollowUp: boolean;
  categoryBudgetTargets?: ChargeInspectorCategoryBudgetTargetAmounts;
  categoryReviewStatuses?: Record<string, ChargeInspectorCategoryReviewStatus>;
  copy: AiExplanationPanelCopy;
  enabled: boolean;
  target: AiExplanationTarget;
}) {
  const [answer, setAnswer] = useState<ReportReviewAiResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [requestState, setRequestState] = useState<AiRequestState>("idle");
  const [selectedQuestion, setSelectedQuestion] =
    useState<ReportReviewAiQuestionType | null>(null);

  async function requestExplanation(
    questionType: ReportReviewAiQuestionType,
    userMessage: string | null = null,
  ) {
    setErrorMessage("");
    setRequestState("loading");
    setSelectedQuestion(questionType);

    try {
      const response = await fetch("/internal/ai/report-review/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(categoryReviewStatuses
            ? { categoryReviewStatuses }
            : {}),
          ...(categoryBudgetTargets && Object.keys(categoryBudgetTargets).length > 0
            ? { categoryBudgetTargets }
            : {}),
          questionType,
          surface: "report_review",
          targetId: target.id,
          targetType: target.type,
          userMessage,
        }),
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        throw new Error(readResponseError(payload));
      }

      setAnswer(payload as ReportReviewAiResponse);
      setRequestState("ready");
    } catch (error) {
      setRequestState("request_error");
      setErrorMessage(
        error instanceof Error ? error.message : "AI explanation failed.",
      );
    }
  }

  function submitFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void requestExplanation("follow_up", followUp);
  }

  if (!enabled) {
    return (
      <aside
        className={reviewSubtlePanelClass("p-4")}
        data-testid={`ai-explanation-disabled-${target.id}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <StatusPill label="AI dev flag off" tone="stone" />
            <h4 className="mt-3 text-sm font-semibold text-seed-950">
              AI explanation unavailable
            </h4>
            <p className="sr-only">
              {copy.disabledDescription}
            </p>
          </div>
          <button
            className="min-h-10 rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-earth-500"
            disabled
            type="button"
          >
            Explain
          </button>
        </div>
      </aside>
    );
  }

  const isLoading = requestState === "loading";

  return (
    <aside
      className={reviewSubtlePanelClass("p-4")}
      data-testid={`ai-explanation-panel-${target.id}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill label="AI private/dev" tone="seed" />
            <StatusPill label="No saved history" tone="stone" />
          </div>
          <h4 className="mt-3 text-sm font-semibold text-seed-950">
            {copy.title}
          </h4>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-semibold text-earth-700 outline-none focus:ring-2 focus:ring-seed-500">
              Limits
            </summary>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-earth-700">
              {copy.enabledDescription}
            </p>
          </details>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {fixedActions.map((action) => (
          <button
            className={actionButtonClass(
              selectedQuestion === action.type && isLoading,
            )}
            disabled={isLoading}
            key={action.type}
            onClick={() => void requestExplanation(action.type)}
            type="button"
          >
            {selectedQuestion === action.type && isLoading
              ? "Loading"
              : copy.actionLabels[action.type]}
          </button>
        ))}
      </div>

      {allowFollowUp ? (
        <form className="mt-4 space-y-2" onSubmit={submitFollowUp}>
          <label
            className="block text-sm font-semibold text-seed-950"
            htmlFor={`ai-follow-up-${target.id}`}
          >
            Scoped follow-up
          </label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <textarea
              className="min-h-20 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-earth-900 outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-500"
              disabled={isLoading}
              id={`ai-follow-up-${target.id}`}
              maxLength={280}
              onChange={(event) => setFollowUp(event.target.value)}
              placeholder={copy.followUpPlaceholder}
              value={followUp}
            />
            <button
              className={actionButtonClass(false)}
              disabled={isLoading || followUp.trim().length === 0}
              type="submit"
            >
              Ask
            </button>
          </div>
        </form>
      ) : null}

      {requestState === "request_error" ? (
        <div
          className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3"
          data-testid={`ai-request-error-${target.id}`}
        >
          <StatusPill label="Request error" tone="stone" />
          <h5 className="mt-2 text-sm font-semibold text-amber-950">
            AI request was rejected
          </h5>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            {errorMessage}
          </p>
        </div>
      ) : null}

      {answer ? <AiAnswerResult answer={answer} /> : null}
    </aside>
  );
}

function AiAnswerResult({ answer }: { answer: ReportReviewAiResponse }) {
  const details =
    answerKindDetails[answer.answerKind] ??
    answerKindDetails.provider_error_fallback;

  return (
    <div
      className="mt-4 space-y-3 rounded-md border border-stone-200 bg-white p-4"
      data-testid={`ai-answer-${answer.answerKind}`}
    >
      <div className="flex flex-wrap gap-2">
        <StatusPill label={details.label} tone={details.tone} />
        <StatusPill label={answer.provider.label} tone="stone" />
      </div>

      <div>
        <h5 className="text-sm font-semibold text-seed-950">
          {details.title}
        </h5>
        <p className="sr-only">
          {details.description}
        </p>
      </div>

      <p className="text-sm leading-6 text-earth-800">{answer.answer}</p>

      <div className="grid gap-3 md:grid-cols-3">
        <AiList title="Evidence" items={answer.evidence.map((item) => item.text)} />
        <AiList title="Limitations" items={answer.limitations} />
        <AiList
          title="Sources"
          items={answer.sources.map((source) => source.title)}
        />
      </div>

      <details className="rounded-md border border-stone-200 bg-stone-50 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-seed-950 outline-none focus:ring-2 focus:ring-seed-500">
          Version details
        </summary>
        <dl className="mt-3 grid gap-2 text-xs text-earth-700 sm:grid-cols-2">
          <VersionItem label="Prompt" value={answer.versions.prompt} />
          <VersionItem label="Model" value={answer.versions.model} />
          <VersionItem label="Context" value={answer.versions.contextPack} />
          {versionDetailItems.map(({ key, label }) => {
            const value = answer.versions[key];

            return value ? (
              <VersionItem key={key} label={label} value={value} />
            ) : null;
          })}
          <VersionItem label="Corpus" value={answer.versions.corpus} />
          <VersionItem label="Source map" value={answer.versions.sourceMap} />
          <VersionItem
            label="Validator"
            value={answer.versions.answerValidator}
          />
        </dl>
        {answer.validation.reasons.length > 0 ? (
          <AiList title="Validation notes" items={answer.validation.reasons} />
        ) : null}
      </details>
    </div>
  );
}

function AiList({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <h5 className="text-xs font-semibold uppercase text-earth-500">
        {title}
      </h5>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-earth-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function VersionItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-earth-500">{label}</dt>
      <dd className="mt-0.5 break-words text-earth-800">{value}</dd>
    </div>
  );
}

function actionButtonClass(active: boolean) {
  return joinClasses(
    "min-h-10 rounded-md border px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-seed-500 disabled:cursor-not-allowed disabled:opacity-60",
    active
      ? "border-seed-300 bg-seed-50 text-seed-900"
      : "border-stone-200 bg-white text-earth-800 hover:border-seed-300 hover:text-seed-900",
  );
}

function readResponseError(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return "AI explanation request failed.";
  }

  const error = (payload as Record<string, unknown>).error;
  return typeof error === "string" ? error : "AI explanation request failed.";
}
