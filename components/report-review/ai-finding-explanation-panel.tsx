"use client";

import { useState, type FormEvent } from "react";

import type { Finding } from "@/data/report-review-sample";
import type {
  ReportReviewAiQuestionType,
  ReportReviewAiResponse,
} from "@/lib/report-review/ai/types";

import {
  joinClasses,
  reviewSubtlePanelClass,
  StatusPill,
} from "./shared";

type AiRequestState = "idle" | "loading" | "ready" | "error";

const fixedActions: {
  label: string;
  type: Exclude<ReportReviewAiQuestionType, "follow_up">;
}[] = [
  { label: "Explain finding", type: "explain_finding" },
  { label: "Missing context", type: "missing_context" },
  { label: "Plain language", type: "plain_language" },
  { label: "Next questions", type: "next_questions" },
];

export function AiFindingExplanationPanel({
  enabled,
  finding,
}: {
  enabled: boolean;
  finding: Finding;
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
          questionType,
          surface: "report_review",
          targetId: finding.id,
          targetType: "finding",
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
      setRequestState("error");
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
        data-testid={`ai-explanation-disabled-${finding.id}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <StatusPill label="AI dev flag off" tone="stone" />
            <h4 className="mt-3 text-sm font-semibold text-seed-950">
              AI explanation unavailable
            </h4>
            <p className="mt-1 text-sm leading-6 text-earth-700">
              This private report-review panel is wired for Phase 4.0 but does
              not call the AI route until the dev flag is enabled.
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
      data-testid={`ai-explanation-panel-${finding.id}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill label="AI private/dev" tone="seed" />
            <StatusPill label="No saved history" tone="stone" />
          </div>
          <h4 className="mt-3 text-sm font-semibold text-seed-950">
            AI explanation
          </h4>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-earth-700">
            Answers are limited to this selected finding, approved knowledge
            corpus, evidence, limitations, and version metadata.
          </p>
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
              : action.label}
          </button>
        ))}
      </div>

      <form className="mt-4 space-y-2" onSubmit={submitFollowUp}>
        <label
          className="block text-sm font-semibold text-seed-950"
          htmlFor={`ai-follow-up-${finding.id}`}
        >
          Scoped follow-up
        </label>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <textarea
            className="min-h-20 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-earth-900 outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-500"
            disabled={isLoading}
            id={`ai-follow-up-${finding.id}`}
            maxLength={280}
            onChange={(event) => setFollowUp(event.target.value)}
            placeholder="Ask about this finding only"
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

      {requestState === "error" ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          {errorMessage}
        </p>
      ) : null}

      {answer ? <AiAnswerResult answer={answer} /> : null}
    </aside>
  );
}

function AiAnswerResult({ answer }: { answer: ReportReviewAiResponse }) {
  return (
    <div className="mt-4 space-y-3 rounded-md border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <StatusPill
          label={
            answer.validation.status === "passed"
              ? "Validated answer"
              : "Fallback answer"
          }
          tone={answer.validation.status === "passed" ? "seed" : "stone"}
        />
        <StatusPill label={answer.provider.label} tone="stone" />
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
