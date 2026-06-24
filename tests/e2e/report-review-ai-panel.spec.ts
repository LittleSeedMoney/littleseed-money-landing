import { expect, type Page, test } from "@playwright/test";

const reportReviewPath = "/private/report-review";

test.describe("private report review AI panel", () => {
  test.skip(
    process.env.LITTLESEED_REPORT_REVIEW_AI_ENABLED !== "true",
    "AI panel hardening tests require the private/dev AI flag.",
  );

  test("shows validated answers, debug versions, and boundary refusals", async ({
    page,
  }) => {
    await openFirstAiPanel(page);

    await page.getByRole("button", { name: "Explain finding" }).click();
    const validatedAnswer = page.getByTestId("ai-answer-validated_answer");
    await expect(validatedAnswer).toBeVisible();
    await expect(
      validatedAnswer.getByText("Validated explanation"),
    ).toBeVisible();
    await expect(
      validatedAnswer.getByRole("heading", { name: "Evidence" }),
    ).toBeVisible();
    await expect(
      validatedAnswer.getByRole("heading", { name: "Limitations" }),
    ).toBeVisible();
    await expect(
      validatedAnswer.getByRole("heading", { name: "Sources" }),
    ).toBeVisible();

    await validatedAnswer.getByText("Version details").click();
    await expect(validatedAnswer.getByText("Source map", { exact: true }))
      .toBeVisible();
    await expect(validatedAnswer.getByText("Validator", { exact: true }))
      .toBeVisible();

    await page
      .getByLabel("Scoped follow-up")
      .fill("Which debt should I pay first?");
    await page.getByRole("button", { name: "Ask" }).click();

    await expect(page.getByTestId("ai-answer-boundary_refusal"))
      .toBeVisible();
    await expect(page.getByText("Boundary refusal shown")).toBeVisible();
    await expect(
      page.getByText("The selected question is outside the current"),
    ).toBeVisible();
  });

  test("shows validation fallback without rendering the unsafe draft", async ({
    page,
  }) => {
    await page.route("**/internal/ai/report-review/explain", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: aiPanelAnswer({
          answerKind: "validation_fallback",
          answer:
            "I cannot answer that from this selected report-review finding.",
          reason: "Answer appears to include prohibited advice or certainty.",
        }),
        status: 200,
      });
    });

    await openFirstAiPanel(page);
    await page.getByRole("button", { name: "Explain finding" }).click();

    await expect(page.getByTestId("ai-answer-validation_fallback"))
      .toBeVisible();
    await expect(page.getByText("Validation fallback shown")).toBeVisible();
    await expect(page.getByText("unsafe draft was not displayed"))
      .toBeVisible();
    await expect(page.getByText("You should pay this debt first")).toHaveCount(
      0,
    );
  });

  test("shows provider fallback when the provider cannot return an answer", async ({
    page,
  }) => {
    await page.route("**/internal/ai/report-review/explain", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: aiPanelAnswer({
          answerKind: "provider_error_fallback",
          answer:
            "I cannot answer that from this selected report-review finding.",
          reason: "The AI provider could not return a validated answer.",
        }),
        status: 200,
      });
    });

    await openFirstAiPanel(page);
    await page.getByRole("button", { name: "Explain finding" }).click();

    await expect(page.getByTestId("ai-answer-provider_error_fallback"))
      .toBeVisible();
    await expect(page.getByText("Provider fallback shown")).toBeVisible();
    await expect(page.getByText("provider did not return a usable answer"))
      .toBeVisible();
  });

  test("shows request errors separately from fallback answers", async ({
    page,
  }) => {
    await page.route("**/internal/ai/report-review/explain", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: {
          error: "targetId is not supported for report-review AI explanation.",
        },
        status: 400,
      });
    });

    await openFirstAiPanel(page);
    await page.getByRole("button", { name: "Explain finding" }).click();

    await expect(page.getByTestId("ai-request-error-high_interest_debt_detected"))
      .toBeVisible();
    await expect(page.getByText("AI request was rejected")).toBeVisible();
    await expect(page.getByText("targetId is not supported")).toBeVisible();
  });

  test("shows monthly spending AI explanation with monthly context version", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#charge-inspector`);

    const monthlyPanel = page.getByTestId(
      "ai-explanation-panel-charge_inspector_monthly_spending_summary",
    );
    await expect(monthlyPanel).toBeVisible();
    await expect(monthlyPanel.getByText("AI monthly summary")).toBeVisible();
    await expect(
      monthlyPanel.getByText("Raw transactions, merchant names"),
    ).toBeVisible();

    await monthlyPanel.getByRole("button", { name: "Explain summary" }).click();

    const validatedAnswer = monthlyPanel.getByTestId(
      "ai-answer-validated_answer",
    );
    await expect(validatedAnswer).toBeVisible();
    await expect(
      validatedAnswer.getByText("Validated explanation"),
    ).toBeVisible();
    await validatedAnswer.getByText("Version details").click();
    await expect(
      validatedAnswer.getByText("Monthly spend", { exact: true }),
    ).toBeVisible();
    await expect(
      validatedAnswer.getByText("monthly_spending_ai_context.v0"),
    ).toBeVisible();
    await expect(validatedAnswer.getByText("Streamly Premium")).toHaveCount(0);
  });
});

async function openFirstAiPanel(page: Page) {
  await page.goto(`${reportReviewPath}#report`);

  const firstFinding = page.getByTestId("report-finding-card").first();
  await firstFinding.locator("summary").click();
  await expect(
    firstFinding.getByTestId("ai-explanation-panel-high_interest_debt_detected"),
  ).toBeVisible();
}

function aiPanelAnswer({
  answer,
  answerKind,
  reason,
}: {
  answer: string;
  answerKind:
    | "boundary_refusal"
    | "provider_error_fallback"
    | "validation_fallback";
  reason: string;
}) {
  return {
    answer,
    answerKind,
    evidence: [
      {
        id: "coach_context_pack.v0.high_interest_debt_detected",
        text:
          "The request was evaluated against the bounded report-review context pack.",
      },
    ],
    limitations: [
      "This is not investment, tax, legal, credit-product, merchant-action, or account-linking advice.",
      "This prototype does not calculate new values or rank actions.",
    ],
    provider: {
      id: "fixture",
      label: "Boundary fallback",
      mode: "deterministic-fixture",
    },
    questionType: "explain_finding",
    sources: [
      {
        id: "coach_context_pack.v0.high_interest_debt_detected",
        title: "High-interest debt was identified",
        type: "context_pack",
      },
    ],
    target: {
      id: "high_interest_debt_detected",
      title: "High-interest debt was identified",
      type: "finding",
    },
    validation: {
      fallbackUsed: true,
      reasons: [reason],
      status: "fallback",
    },
    versions: {
      answerValidator: "ai_answer_validator.v0",
      contextPack: "coach_context_pack.v0",
      corpus: "knowledge_corpus.fixture.v0",
      model: "fixture.report-review-ai.v0",
      prompt: "report_review_explain.v0",
      sourceMap: "report_review_context_source_map.v0",
    },
  };
}
