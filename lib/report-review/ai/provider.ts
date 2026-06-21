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
    async generateAnswer({ contextPack, questionType, userMessage }) {
      const artifact = contextPack.knowledgeArtifacts[0];
      const sourceTitle = artifact?.title ?? "Selected finding context";
      const baseEvidence = [
        {
          id: contextPack.finding.id,
          text: contextPack.finding.summary,
        },
        {
          id: artifact?.id ?? contextPack.id,
          text: artifact?.summary ?? contextPack.finding.whyItMatters,
        },
      ];
      const baseSources = [
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

      if (questionType === "missing_context") {
        return {
          answer: `This finding is limited by context that is not fully visible in the current report. The most important missing or limiting information is: ${contextPack.finding.limitations.join(" ")}`,
          evidence: baseEvidence,
          limitations: defaultLimitations(contextPack),
          sources: baseSources,
        };
      }

      if (questionType === "plain_language") {
        return {
          answer: `In plain language, this finding says: ${contextPack.finding.summary} It is an area to review, not a ranked action or a product recommendation.`,
          evidence: baseEvidence,
          limitations: defaultLimitations(contextPack),
          sources: baseSources,
        };
      }

      if (questionType === "next_questions") {
        return {
          answer: `Useful next questions are: What information could change this interpretation? Which entered values are estimates? Are the obligations temporary or recurring? These are review questions, not action priorities.`,
          evidence: baseEvidence,
          limitations: defaultLimitations(contextPack),
          sources: baseSources,
        };
      }

      if (questionType === "follow_up") {
        return {
          answer: `For this selected finding, your follow-up is scoped to: "${userMessage}". Based on the available context, the answer can only use the finding summary, why-it-matters text, limitations, and approved knowledge fixture. It cannot choose an action, calculate a new amount, or use account history.`,
          evidence: baseEvidence,
          limitations: defaultLimitations(contextPack),
          sources: baseSources,
        };
      }

      return {
        answer: `This finding means the report observed: ${contextPack.finding.summary} It may matter because ${contextPack.finding.whyItMatters} The interpretation should stay inside the selected report context and the approved knowledge fixture.`,
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
            "Do not calculate new values.",
            "Do not rank actions.",
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
      const parsed = JSON.parse(text) as ReportReviewAiDraft;

      return parsed;
    },
  };
}

function defaultLimitations(contextPack: CoachContextPack) {
  return [
    "Uses only the selected report-review finding and approved knowledge fixture.",
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
