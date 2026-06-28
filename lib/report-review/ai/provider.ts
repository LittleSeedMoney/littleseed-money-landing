import type {
  CoachContextPack,
  ReportReviewAiDraft,
  ReportReviewAiProviderInfo,
  ReportReviewAiQuestionType,
} from "./types";

export type ReportReviewAiProviderInput = {
  contextPack: CoachContextPack;
  questionType: ReportReviewAiQuestionType;
  userMessage: string | null;
};

export type ReportReviewAiProvider = {
  info: ReportReviewAiProviderInfo;
  model: string;
  generateAnswer: (
    input: ReportReviewAiProviderInput,
  ) => Promise<ReportReviewAiDraft>;
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export function selectReportReviewAiProvider(): ReportReviewAiProvider {
  if (
    process.env.LITTLESEED_AI_PROVIDER === "openai" &&
    process.env.OPENAI_API_KEY
  ) {
    return createOpenAiReportReviewProvider({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.LITTLESEED_OPENAI_MODEL ?? "gpt-4.1-mini",
    });
  }

  return createFixtureReportReviewAiProvider();
}

export function createFixtureReportReviewAiProvider(): ReportReviewAiProvider {
  return {
    info: {
      id: "fixture",
      label: "Deterministic fixture provider",
      mode: "deterministic-fixture",
    },
    model: "fixture.report-review-ai.v0",
    async generateAnswer({ contextPack, questionType }) {
      const artifact = contextPack.knowledgeArtifacts[0];
      const sourceTitle = artifact?.title ?? "Selected finding context";
      const baseEvidence = baseContextEvidence(contextPack);
      const baseSources = baseContextSources({ contextPack, sourceTitle });

      if (questionType === "missing_context") {
        return {
          answer: missingContextAnswer(contextPack),
          evidence: baseEvidence,
          limitations: defaultLimitations(contextPack),
          sources: baseSources,
        };
      }

      if (questionType === "plain_language") {
        return {
          answer: plainLanguageAnswer(contextPack),
          evidence: baseEvidence,
          limitations: defaultLimitations(contextPack),
          sources: baseSources,
        };
      }

      if (questionType === "next_questions") {
        return {
          answer: nextQuestionsAnswer(contextPack),
          evidence: baseEvidence,
          limitations: defaultLimitations(contextPack),
          sources: baseSources,
        };
      }

      if (questionType === "follow_up") {
        return {
          answer:
            followUpBoundaryAnswer(contextPack),
          evidence: baseEvidence,
          limitations: defaultLimitations(contextPack),
          sources: baseSources,
        };
      }

      return {
        answer: explainAnswer(contextPack),
        evidence: baseEvidence,
        limitations: defaultLimitations(contextPack),
        sources: baseSources,
      };
    },
  };
}

function createOpenAiReportReviewProvider({
  apiKey,
  model,
}: {
  apiKey: string;
  model: string;
}): ReportReviewAiProvider {
  return {
    info: {
      id: "openai",
      label: "OpenAI Responses API",
      mode: "llm",
    },
    model,
    async generateAnswer(input) {
      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: JSON.stringify({
                    contextPack: input.contextPack,
                    questionType: input.questionType,
                    userMessage: input.userMessage,
                  }),
                },
              ],
            },
          ],
          instructions: [
            "You explain selected LittleSeed Money report-review findings.",
            "Use only the supplied context pack and knowledge artifacts.",
            "You may explain monthly spending aggregate rows only when the context pack includes monthlySpendingSummary.",
            "You may explain bounded category evidence only when the context pack includes categoryEvidence.",
            "You may explain deterministic user-provided target comparisons only when they are already present in categoryEvidence.",
            "You may explain deterministic monthly target comparison facts only when they are already present in categoryEvidence.",
            "Do not calculate new values.",
            "Do not rank actions.",
            "Do not infer budgets, create targets, recategorize transactions, judge categories as right or wrong, recommend merchant actions, or create required next steps.",
            "Do not provide investment, tax, legal, credit-product, merchant-action, account-linking, or dispute advice.",
            "Return concise JSON that matches the schema.",
          ].join(" "),
          max_output_tokens: 700,
          model,
          store: false,
          temperature: 0.2,
          text: {
            format: {
              name: "report_review_ai_answer",
              schema: responseSchema,
              strict: true,
              type: "json_schema",
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI provider request failed with ${response.status}.`);
      }

      const payload = await response.json();
      const text = extractResponseText(payload);
      const parsed = parseReportReviewAiDraft(JSON.parse(text));

      return parsed;
    },
  };
}

export function parseReportReviewAiDraft(value: unknown): ReportReviewAiDraft {
  const record = expectRecord(value, "AI provider answer");

  return {
    answer: readString(record, "answer", "AI provider answer"),
    evidence: readObjectArray(record.evidence, "AI provider answer.evidence")
      .map((item, index) => ({
        id: readString(item, "id", `AI provider answer.evidence[${index}]`),
        text: readString(
          item,
          "text",
          `AI provider answer.evidence[${index}]`,
        ),
      })),
    limitations: readStringArray(
      record.limitations,
      "AI provider answer.limitations",
    ),
    sources: readObjectArray(record.sources, "AI provider answer.sources")
      .map((item, index) => ({
        id: readString(item, "id", `AI provider answer.sources[${index}]`),
        title: readString(
          item,
          "title",
          `AI provider answer.sources[${index}]`,
        ),
        type: readSourceType(item.type, `AI provider answer.sources[${index}]`),
      })),
  };
}

function baseContextEvidence(contextPack: CoachContextPack) {
  if (contextPack.finding) {
    const artifact = contextPack.knowledgeArtifacts[0];

    return [
      {
        id: contextPack.finding.id,
        text: contextPack.finding.summary,
      },
      {
        id: artifact?.id ?? contextPack.id,
        text: artifact?.summary ?? contextPack.finding.whyItMatters,
      },
    ];
  }

  if (contextPack.monthlySpendingSummary) {
    return [
      {
        id: contextPack.monthlySpendingSummary.id,
        text: monthlySpendingEvidenceText(contextPack.monthlySpendingSummary.rows),
      },
      {
        id: contextPack.id,
        text:
          "Monthly spending context contains aggregate posted-date rows only, not raw transactions.",
      },
    ];
  }

  if (contextPack.categoryEvidence) {
    return [
      {
        id: contextPack.categoryEvidence.id,
        text: categoryEvidenceText(contextPack.categoryEvidence),
      },
      {
        id: contextPack.id,
        text:
          "Category evidence context contains bounded merchant-display rows, review status, and aggregate category-by-month rows only, not raw transaction history.",
      },
    ];
  }

  return [
    {
      id: contextPack.id,
      text: "The selected context pack contains no supported detail.",
    },
  ];
}

function baseContextSources({
  contextPack,
  sourceTitle,
}: {
  contextPack: CoachContextPack;
  sourceTitle: string;
}) {
  const artifact = contextPack.knowledgeArtifacts[0];

  if (contextPack.finding) {
    return [
      {
        id: contextPack.finding.id,
        title: contextPack.finding.title,
        type: "report_finding" as const,
      },
      {
        id: artifact?.id ?? contextPack.id,
        title: sourceTitle,
        type: artifact ? ("knowledge_artifact" as const) : ("context_pack" as const),
      },
    ];
  }

  return [
    {
      id: contextPack.id,
      title: contextPack.target.title,
      type: "context_pack" as const,
    },
  ];
}

function explainAnswer(contextPack: CoachContextPack) {
  if (contextPack.finding) {
    return `This finding means the report observed: ${contextPack.finding.summary} It may matter because ${contextPack.finding.whyItMatters} The interpretation should stay inside the selected report context and the approved knowledge corpus.`;
  }

  if (contextPack.monthlySpendingSummary) {
    return `This monthly spending summary shows aggregate posted-date totals for ${contextPack.monthlySpendingSummary.rows.length.toLocaleString("en-US")} month${contextPack.monthlySpendingSummary.rows.length === 1 ? "" : "s"}. It can explain spending, credits, net cash flow, and row counts, but it cannot infer budgets, categories, or required actions.`;
  }

  if (contextPack.categoryEvidence) {
    const visibleEvidenceCount = contextPack.categoryEvidence.categories.reduce(
      (count, category) => count + category.evidenceRows.length,
      0,
    );

    const targetComparisonCount = contextPack.categoryEvidence.categories.filter(
      (category) => category.budgetComparison,
    ).length;
    const monthlyCategoryRows =
      contextPack.categoryEvidence.categoryMonthlySummaryWindow;
    const monthlyTargetComparisonRows =
      contextPack.categoryEvidence.categoryMonthlyBudgetComparisonWindow;

    return `This category evidence summary shows deterministic rule output for ${contextPack.categoryEvidence.categories.length.toLocaleString("en-US")} categor${contextPack.categoryEvidence.categories.length === 1 ? "y" : "ies"}, ${visibleEvidenceCount.toLocaleString("en-US")} bounded merchant-display evidence row${visibleEvidenceCount === 1 ? "" : "s"}, ${monthlyCategoryRows.includedCount.toLocaleString("en-US")} of ${monthlyCategoryRows.totalCount.toLocaleString("en-US")} aggregate category-by-month row${monthlyCategoryRows.totalCount === 1 ? "" : "s"}, ${targetComparisonCount.toLocaleString("en-US")} user-entered target comparison${targetComparisonCount === 1 ? "" : "s"}, and ${monthlyTargetComparisonRows.includedCount.toLocaleString("en-US")} of ${monthlyTargetComparisonRows.totalCount.toLocaleString("en-US")} monthly target comparison row${monthlyTargetComparisonRows.totalCount === 1 ? "" : "s"}. It can explain which visible rows are attached to a category, what review status is selected, category-by-month aggregate facts, and any already-calculated target comparison facts, but it cannot create targets, recategorize rows, score spending quality, recommend changes, or rank actions.`;
  }

  return "This context pack does not include enough supported detail to explain.";
}

function plainLanguageAnswer(contextPack: CoachContextPack) {
  if (contextPack.finding) {
    return `In plain language, this finding says: ${contextPack.finding.summary} It is an area to review, not a ranked action or a product recommendation.`;
  }

  if (contextPack.monthlySpendingSummary) {
    return "In plain language, the monthly spending summary is a table of totals by posted-date month. It is useful for checking what the normalized rows add up to, but it is not a budget, category model, or recommendation.";
  }

  if (contextPack.categoryEvidence) {
    return "In plain language, category evidence is the visible trail behind the category table: category totals, matched merchant-display rows, rule ids, current review status, and optional user-entered target comparisons by review period and month. It is explanation support, not an automatic recategorization, target recommendation, or spending-quality assessment.";
  }

  return "In plain language, this context pack does not include enough supported detail to explain.";
}

function missingContextAnswer(contextPack: CoachContextPack) {
  if (contextPack.finding) {
    return "This finding is limited by context that is not fully visible in the current report. See the Limitations list for the specific factors that could change the interpretation.";
  }

  if (contextPack.monthlySpendingSummary) {
    return "This monthly spending summary is limited by the aggregate fields available here. Missing context includes whether each month is complete, whether credits are income, transfers, refunds, or reimbursements, and whether any rows were excluded or failed parsing.";
  }

  if (contextPack.categoryEvidence) {
    return "This category evidence is limited by the bounded fields available here. Missing context includes receipts, full merchant descriptors, statement period completeness, whether the user-entered target covers the same review period and monthly cadence, and whether a product owner has reviewed any ambiguous category rules.";
  }

  return "This context is limited by the fields available in the selected context pack.";
}

function nextQuestionsAnswer(contextPack: CoachContextPack) {
  if (contextPack.finding) {
    return "Useful next questions are: What information could change this interpretation? Which entered values are estimates? Are the obligations temporary or recurring? These are review questions, not action priorities.";
  }

  if (contextPack.monthlySpendingSummary) {
    return "Useful next questions are: Is each month complete? Are the credits income, transfers, refunds, or reimbursements? Were any rows excluded or returned as parse errors? Are any net cash-flow months worth reviewing for context? These are review questions, not action priorities.";
  }

  if (contextPack.categoryEvidence) {
    return "Useful next questions are: Which merchant-display labels look ambiguous? Which categories are marked needs review? Do any user-entered targets need review-period or monthly context? Are any rule ids too broad for product review? Does the statement period look complete? These are review questions, not action priorities.";
  }

  return "Useful next questions should stay inside the selected context pack and focus on missing context, source limits, and versioned evidence.";
}

function followUpBoundaryAnswer(contextPack: CoachContextPack) {
  if (contextPack.finding) {
    return "For this selected finding, the follow-up can only use the finding summary, why-it-matters text, limitations, and approved knowledge corpus. It cannot choose an action, calculate a new amount, or use account history.";
  }

  if (contextPack.monthlySpendingSummary) {
    return "For this monthly spending summary, the follow-up can only use aggregate monthly totals, row counts, source labels, versions, and limitations. It cannot use raw transactions, calculate new totals, rank actions, or infer categories.";
  }

  return "For this category evidence context, follow-up is not enabled. Use one of the fixed explanation questions so the answer stays inside bounded category evidence, review status, rule ids, versions, and limitations.";
}

function monthlySpendingEvidenceText(
  rows: NonNullable<CoachContextPack["monthlySpendingSummary"]>["rows"],
) {
  if (rows.length === 0) {
    return "No monthly spending aggregate rows are available.";
  }

  return rows
    .map(
      (row) =>
        `${row.month}: spending ${row.debitTotalLabel}, credits ${row.creditTotalLabel}, net ${row.netCashFlowLabel}, ${row.transactionCount.toLocaleString("en-US")} rows.`,
    )
    .join(" ");
}

function categoryEvidenceText(
  categoryEvidence: NonNullable<CoachContextPack["categoryEvidence"]>,
) {
  const categories = categoryEvidence.categories;
  if (categories.length === 0) {
    return "No category summary rows are available.";
  }

  const categoryRows = categories
    .map((category) => {
      const summary =
        `${category.label} (${category.reviewStatus}): ` +
        `${category.debitTotalLabel} spending, ` +
        `${category.creditTotalLabel} credits, ` +
        `${category.transactionCount.toLocaleString("en-US")} rows, ` +
        `rules ${category.ruleIds.join(", ") || "none"}`;
      const budgetComparison = category.budgetComparison
        ? ` User target comparison: actual ${category.budgetComparison.actualDebitTotalLabel}, target ${category.budgetComparison.targetDebitTotalLabel}, difference ${category.budgetComparison.varianceAmountLabel} (${category.budgetComparison.variancePercentLabel}), status ${category.budgetComparison.statusLabel}.`
        : "";

      if (category.evidenceRows.length === 0) {
        return `${summary}.${budgetComparison} No bounded merchant-display evidence rows are available for this category.`;
      }

      const rows = category.evidenceRows
        .map(
          (row) =>
            `${row.postedDate} ${row.merchantName} ${row.amountLabel} ${row.directionLabel.toLowerCase()} via ${row.ruleId}`,
        )
        .join("; ");

      return `${summary}.${budgetComparison} Matched rows: ${rows}.`;
    })
    .join(" ");

  const monthlyRows =
    categoryEvidence.categoryMonthlySummaryRows.length > 0
      ? ` Category-by-month aggregate rows: ${categoryEvidence.categoryMonthlySummaryRows
          .map(
            (row) =>
              `${row.month} ${row.label}: ${row.debitTotalLabel} spending, ${row.creditTotalLabel} credits, ${row.transactionCount.toLocaleString("en-US")} rows`,
          )
          .join("; ")}.`
      : " No category-by-month aggregate rows are available.";
  const monthlyBudgetRows =
    categoryEvidence.categoryMonthlyBudgetComparisons.length > 0
      ? ` Monthly target comparison rows: ${categoryEvidence.categoryMonthlyBudgetComparisons
          .map(
            (comparison) =>
              `${comparison.month} ${comparison.label}: actual ${comparison.actualDebitTotalLabel}, target ${comparison.targetDebitTotalLabel}, difference ${comparison.varianceAmountLabel} (${comparison.variancePercentLabel}), status ${comparison.statusLabel}, debit rows ${comparison.debitTransactionCount.toLocaleString("en-US")}`,
          )
          .join("; ")}.`
      : " No monthly target comparison rows are available.";

  return `${categoryRows}${windowMetadataText(
    "Category-by-month context window",
    categoryEvidence.categoryMonthlySummaryWindow,
  )}${monthlyRows}${windowMetadataText(
    "Monthly target comparison context window",
    categoryEvidence.categoryMonthlyBudgetComparisonWindow,
  )}${monthlyBudgetRows}`;
}

function windowMetadataText(
  label: string,
  metadata: NonNullable<
    CoachContextPack["categoryEvidence"]
  >["categoryMonthlySummaryWindow"],
) {
  const omitted =
    metadata.omittedCount > 0
      ? `${metadata.omittedCount.toLocaleString("en-US")} omitted`
      : "no rows omitted";

  return ` ${label}: ${metadata.includedCount.toLocaleString("en-US")} of ${metadata.totalCount.toLocaleString("en-US")} rows included by recent ${metadata.window.recentMonths.toLocaleString("en-US")}-month / ${metadata.window.rowCap.toLocaleString("en-US")}-row policy; ${omitted}.`;
}

function defaultLimitations(contextPack: CoachContextPack) {
  if (contextPack.monthlySpendingSummary) {
    return [
      "Uses only monthly aggregate totals and row counts from the server-owned context pack.",
      "Does not use raw transaction rows, merchant names, account history, account credentials, saved chat history, or long-term memory.",
      ...contextPack.monthlySpendingSummary.limitations.slice(0, 2),
    ];
  }

  if (contextPack.categoryEvidence) {
    return [
      "Uses only bounded category evidence from the server-owned context pack.",
      "Does not use raw CSV rows, full descriptions, balances, account identifiers, saved chat history, or long-term memory.",
      "Does not create budget targets, recategorize rows, score spending quality, rank actions, infer monthly budgets, or recommend merchant actions.",
      ...contextPack.categoryEvidence.limitations.slice(0, 2),
    ];
  }

  if (!contextPack.finding) {
    return [
      "Uses only the selected report-review context pack.",
      "Does not use raw transaction rows, account history, account credentials, saved chat history, or long-term memory.",
    ];
  }

  return [
    "Uses only the selected report-review finding and approved knowledge corpus.",
    "Does not use raw transaction rows, account history, account credentials, saved chat history, or long-term memory.",
    ...contextPack.finding.limitations.slice(0, 2),
  ];
}

function extractResponseText(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("OpenAI provider returned an invalid response.");
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") {
    return record.output_text;
  }

  if (Array.isArray(record.output)) {
    for (const item of record.output) {
      if (typeof item !== "object" || item === null) {
        continue;
      }

      const itemRecord = item as Record<string, unknown>;
      if (!Array.isArray(itemRecord.content)) {
        continue;
      }

      for (const content of itemRecord.content) {
        if (typeof content !== "object" || content === null) {
          continue;
        }

        const contentRecord = content as Record<string, unknown>;
        if (
          contentRecord.type === "output_text" &&
          typeof contentRecord.text === "string"
        ) {
          return contentRecord.text;
        }
      }
    }
  }

  throw new Error("OpenAI provider response did not include output text.");
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

function readStringArray(value: unknown, label: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${label} must be an array of text.`);
  }

  return value as string[];
}

function readObjectArray(value: unknown, label: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value.map((item, index) => expectRecord(item, `${label}[${index}]`));
}

function readSourceType(value: unknown, label: string) {
  if (
    value === "context_pack" ||
    value === "knowledge_artifact" ||
    value === "report_finding"
  ) {
    return value;
  }

  throw new Error(`${label}.type must be a supported source type.`);
}

const responseSchema = {
  additionalProperties: false,
  properties: {
    answer: {
      type: "string",
    },
    evidence: {
      items: {
        additionalProperties: false,
        properties: {
          id: {
            type: "string",
          },
          text: {
            type: "string",
          },
        },
        required: ["id", "text"],
        type: "object",
      },
      type: "array",
    },
    limitations: {
      items: {
        type: "string",
      },
      type: "array",
    },
    sources: {
      items: {
        additionalProperties: false,
        properties: {
          id: {
            type: "string",
          },
          title: {
            type: "string",
          },
          type: {
            enum: ["context_pack", "knowledge_artifact", "report_finding"],
            type: "string",
          },
        },
        required: ["id", "title", "type"],
        type: "object",
      },
      type: "array",
    },
  },
  required: ["answer", "evidence", "limitations", "sources"],
  type: "object",
} as const;
