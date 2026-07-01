const assert = require("node:assert/strict");
const test = require("node:test");

const {
  MANUAL_PROFILE_FIELD_REQUIREMENTS,
  MANUAL_PROFILE_PRESETS,
  OPTIONAL_DECIMAL_FIELDS,
  OPTIONAL_INTEGER_FIELDS,
  OPTIONAL_POSITIVE_DECIMAL_FIELDS,
  REQUIRED_DECIMAL_FIELDS,
  REQUIRED_INTEGER_FIELDS,
  REQUIRED_SELECT_FIELDS,
  buildManualProfileRequest,
  defaultManualProfileValues,
  manualProfilePresetValues,
  ManualProfileValidationError,
} = require("../lib/report-review/manual-profile.ts");
const {
  reportReviewSample,
} = require("../data/report-review-sample.ts");
const {
  REPORT_REVIEW_VALIDATION_CHECKLIST,
} = require("../lib/report-review/validation-checklist.ts");
const {
  chargeInspectorEmptyReview,
  chargeInspectorFallbackReview,
  chargeInspectorFindingTypeLabels,
  chargeInspectorSampleReview,
  buildCategoryBudgetAutomationReviewQueue,
  categoryBudgetTargetsFromInputs,
  compareCategoryBudgetTarget,
  compareCategoryMonthlyBudgetTargets,
  deriveCategoryBudgetAutomationJudgments,
  deriveCategoryBudgetAutomationReadiness,
  isChargeInspectorEmpty,
  mapPlatformChargeInspectorReview,
  mergeCategoryMonthlyBudgetComparisons,
  parseCategoryBudgetTargetInput,
  recurringPaymentReviewItems,
  summarizeChargeInspectorReview,
  visibleChargeInspectorFindings,
  windowChargeInspectorRows,
} = require("../lib/report-review/charge-inspector.ts");
const {
  chargeInspectorSampleCsv,
} = require("../lib/report-review/charge-inspector-sample-csv.ts");
const {
  CHARGE_INSPECTOR_CSV_REQUEST_MAX_LENGTH,
  CHARGE_INSPECTOR_CSV_TEXT_MAX_LENGTH,
  chargeInspectorCsvRequestBodyExceedsLimit,
  parseChargeInspectorCsvRequestBody,
} = require("../lib/report-review/charge-inspector-upload.ts");
const {
  parseChargeInspectorReviewResponse,
} = require("../lib/report-review/platform-charge-inspector-response.ts");
const {
  parseWorkspaceReportResponse,
} = require("../lib/report-review/platform-workspace-response.ts");
const {
  mapPlatformReport,
} = require("../lib/report-review/platform-report.ts");
const {
  educationTopicAnchor,
  resolveEducationTopic,
  uniqueTopicIds,
} = require("../lib/report-review/education-topics.ts");
const {
  calculateSavingGoalDraft,
  defaultSavingGoalDraftValues,
  formatSavingGoalDraftMoney,
} = require("../lib/report-review/saving-goal-draft.ts");
const {
  currentGoalPlanningAsOfMonth,
  defaultGoalPlanningRows,
  summarizeGoalPlan,
  summarizeGoalPlanningRow,
} = require("../lib/report-review/goal-planning.ts");
const {
  centsToInputValue,
  deriveSnapshotMonthlyDraftRows,
  parseMoneyCents,
  targetPresetForCategory,
  targetStatusForRow,
} = require("../lib/report-review/snapshot-monthly-draft.ts");
const {
  approvedKnowledgeArtifactIdsForFinding,
  buildCategoryEvidenceContextPack,
  buildFindingContextPack,
  buildMonthlySpendingSummaryContextPack,
} = require("../lib/report-review/ai/context-pack.ts");
const {
  approvedKnowledgeArtifacts,
} = require("../lib/report-review/ai/knowledge-artifacts.ts");
const {
  parseReportReviewAiDraft,
} = require("../lib/report-review/ai/provider.ts");
const {
  loadReportReviewAiEvalCases,
  runReportReviewAiEvalSuite,
} = require("../lib/report-review/ai/eval-harness.ts");
const {
  explainReportReviewFinding,
  parseReportReviewAiRequest,
  ReportReviewAiRequestError,
} = require("../lib/report-review/ai/report-review-ai.ts");
const {
  reportReviewScreenFromKeyboard,
  reportReviewScreenFromHash,
  reportReviewScreens,
} = require("../lib/report-review/report-review-screens.ts");
const {
  joinClasses,
} = require("../components/report-review/class-names.ts");

function classListIncludes(className, token) {
  return className.split(/\s+/).includes(token);
}

function snapshotMonthlyRow({
  category,
  debitTotalCents,
  label,
  month = "2026-05",
  transactionCount = 1,
}) {
  return {
    category,
    creditTotalCents: 0,
    creditTotalLabel: "$0",
    creditTransactionCount: 0,
    debitTotalCents,
    debitTotalLabel: `$${(debitTotalCents / 100).toFixed(2)}`,
    debitTransactionCount: transactionCount,
    label: label ?? category,
    limitations: [],
    month,
    ruleIds: [],
    transactionCount,
  };
}

function snapshotEvidenceRow({
  amountLabel,
  category,
  id,
  postedDate = "2026-05-10",
}) {
  return {
    amountLabel,
    directionLabel: "Debit",
    id: id ?? `${category}-${amountLabel}`,
    merchantName: `${category} merchant`,
    postedDate,
    ruleId: `${category}-rule`,
  };
}

test("manual profile omits blank user target months", () => {
  const values = defaultManualProfileValues();

  const request = buildManualProfileRequest(values);

  assert.equal(request.userTargetMonths, undefined);
  assert.equal(request.profile.monthly_take_home_income, "5200.00");
});

test("report review class names resolve Tailwind utility conflicts", () => {
  const className = joinClasses(
    "rounded-lg border border-stone-200 bg-white shadow-sm",
    "rounded-md border-seed-300 p-3 shadow-none",
  );

  assert.equal(classListIncludes(className, "rounded-lg"), false);
  assert.equal(classListIncludes(className, "rounded-md"), true);
  assert.equal(classListIncludes(className, "border-stone-200"), false);
  assert.equal(classListIncludes(className, "border-seed-300"), true);
  assert.equal(classListIncludes(className, "shadow-sm"), false);
  assert.equal(classListIncludes(className, "shadow-none"), true);
});

test("snapshot monthly draft rows recalculate visible category moves", () => {
  const rows = [
    snapshotMonthlyRow({
      category: "groceries",
      debitTotalCents: 13056,
      label: "Groceries",
      transactionCount: 2,
    }),
    snapshotMonthlyRow({
      category: "dining",
      debitTotalCents: 1650,
      label: "Dining",
    }),
  ];
  const transactionsByOriginalCategory = new Map([
    [
      "groceries",
      [
        snapshotEvidenceRow({
          amountLabel: "$76.44",
          category: "groceries",
          id: "groceries-1",
        }),
        snapshotEvidenceRow({
          amountLabel: "$54.12",
          category: "groceries",
          id: "groceries-2",
        }),
      ],
    ],
  ]);

  const draftRows = deriveSnapshotMonthlyDraftRows(
    rows,
    transactionsByOriginalCategory,
    { "groceries-1": "dining" },
    "2026-05",
  );
  const rowByCategory = new Map(
    draftRows.map((row) => [row.category, row]),
  );

  assert.equal(rowByCategory.get("groceries").debitTotalCents, 5412);
  assert.equal(rowByCategory.get("groceries").debitTotalLabel, "$54.12");
  assert.equal(rowByCategory.get("groceries").debitTransactionCount, 1);
  assert.equal(rowByCategory.get("dining").debitTotalCents, 9294);
  assert.equal(rowByCategory.get("dining").debitTotalLabel, "$92.94");
  assert.equal(rowByCategory.get("dining").debitTransactionCount, 2);
});

test("snapshot monthly draft rows clamp empty sources and skip unsupported moves", () => {
  const rows = [
    snapshotMonthlyRow({
      category: "groceries",
      debitTotalCents: 500,
      label: "Groceries",
    }),
    snapshotMonthlyRow({
      category: "utilities",
      debitTotalCents: 100,
      label: "Utilities",
    }),
    snapshotMonthlyRow({
      category: "income",
      debitTotalCents: 50000,
      label: "Income",
    }),
  ];
  const transactionsByOriginalCategory = new Map([
    [
      "groceries",
      [
        snapshotEvidenceRow({
          amountLabel: "$7.00",
          category: "groceries",
          id: "groceries-1",
        }),
        snapshotEvidenceRow({
          amountLabel: "$1.00",
          category: "groceries",
          id: "groceries-old",
          postedDate: "2026-04-30",
        }),
      ],
    ],
    [
      "utilities",
      [
        snapshotEvidenceRow({
          amountLabel: "Not available",
          category: "utilities",
          id: "utilities-1",
        }),
      ],
    ],
    [
      "income",
      [
        snapshotEvidenceRow({
          amountLabel: "$50.00",
          category: "income",
          id: "income-1",
        }),
      ],
    ],
  ]);

  const draftRows = deriveSnapshotMonthlyDraftRows(
    rows,
    transactionsByOriginalCategory,
    {
      "groceries-1": "dining",
      "groceries-old": "dining",
      "income-1": "dining",
      "utilities-1": "dining",
    },
    "2026-05",
  );
  const rowByCategory = new Map(
    draftRows.map((row) => [row.category, row]),
  );

  assert.equal(rowByCategory.has("groceries"), false);
  assert.equal(rowByCategory.get("dining").debitTotalCents, 700);
  assert.equal(rowByCategory.get("dining").debitTotalLabel, "$7");
  assert.equal(rowByCategory.get("utilities").debitTotalCents, 100);
  assert.equal(rowByCategory.has("income"), false);
});

test("snapshot monthly target status stays factual", () => {
  const row = snapshotMonthlyRow({
    category: "groceries",
    debitTotalCents: 13056,
    label: "Groceries",
  });

  assert.deepEqual(targetStatusForRow(row, ""), {
    kind: "no-target",
    label: "No target",
  });
  assert.deepEqual(targetStatusForRow(row, "abc"), {
    kind: "invalid-target",
    label: "Invalid target",
  });
  assert.deepEqual(targetStatusForRow(row, "0"), {
    kind: "invalid-target",
    label: "Invalid target",
  });
  assert.deepEqual(targetStatusForRow(row, "140"), {
    kind: "within-target",
    label: "Within target",
  });
  assert.deepEqual(targetStatusForRow(row, "$100.00"), {
    kind: "over-target",
    label: "Over by $30.56",
  });
});

test("snapshot monthly target preset uses recent non-zero prior months", () => {
  const rows = [
    snapshotMonthlyRow({
      category: "subscriptions",
      debitTotalCents: 1000,
      month: "2026-01",
    }),
    snapshotMonthlyRow({
      category: "subscriptions",
      debitTotalCents: 0,
      month: "2026-02",
    }),
    snapshotMonthlyRow({
      category: "subscriptions",
      debitTotalCents: 2000,
      month: "2026-03",
    }),
    snapshotMonthlyRow({
      category: "subscriptions",
      debitTotalCents: 3000,
      month: "2026-04",
    }),
    snapshotMonthlyRow({
      category: "subscriptions",
      debitTotalCents: 4000,
      month: "2026-05",
    }),
    snapshotMonthlyRow({
      category: "subscriptions",
      debitTotalCents: 9000,
      month: "2026-06",
    }),
  ];

  assert.deepEqual(targetPresetForCategory(rows, "subscriptions", "2026-05"), {
    amountCents: 2000,
    amountLabel: "$20",
  });
  assert.equal(targetPresetForCategory(rows, "groceries", "2026-05"), null);
  assert.equal(centsToInputValue(1599), "15.99");
  assert.equal(centsToInputValue(1500), "15");
  assert.equal(parseMoneyCents("$1,234.56"), 123456);
  assert.equal(parseMoneyCents("Not available"), null);
});

test("report-review AI context pack stays bounded to the selected finding", () => {
  const finding = reportReviewSample.findings[0];
  const contextPack = buildFindingContextPack({
    targetId: finding.id,
  });

  assert.equal(contextPack.version, "coach_context_pack.v0");
  assert.equal(contextPack.authority, "server");
  assert.equal(contextPack.target.id, finding.id);
  assert.deepEqual(contextPack.finding.evidenceSourceIds, finding.evidenceSourceIds);
  assert.ok(contextPack.allowedQuestionTypes.includes("follow_up"));
  assert.deepEqual(
    contextPack.knowledgeArtifacts.map((artifact) => artifact.id),
    ["knowledge.debt_cost_context.v0"],
  );
  assert.ok(contextPack.excludedData.includes("raw transaction rows"));
  assert.ok(contextPack.excludedData.includes("saved AI conversation history"));
  assert.equal(contextPack.versions.corpus, "knowledge_corpus.fixture.v0");
  assert.equal(
    contextPack.versions.sourceMap,
    "report_review_context_source_map.v0",
  );
});

test("report-review AI monthly spending context pack uses aggregate rows only", () => {
  const contextPack = buildMonthlySpendingSummaryContextPack({
    targetId: "charge_inspector_monthly_spending_summary",
  });
  const renderedContext = JSON.stringify(contextPack);

  assert.equal(contextPack.version, "coach_context_pack.v0");
  assert.equal(contextPack.authority, "server");
  assert.equal(contextPack.target.type, "monthly_spending_summary");
  assert.equal(
    contextPack.monthlySpendingSummary.version,
    "monthly_spending_ai_context.v0",
  );
  assert.deepEqual(
    contextPack.monthlySpendingSummary.rows.map((row) => row.month),
    ["2026-03", "2026-04", "2026-05"],
  );
  assert.ok(contextPack.excludedData.includes("raw transaction rows"));
  assert.ok(contextPack.excludedData.includes("merchant names"));
  assert.equal(renderedContext.includes("evidenceRows"), false);
  assert.equal(renderedContext.includes("Streamly Premium"), false);
});

test("report-review AI category evidence context pack stays bounded", () => {
  const contextPack = buildCategoryEvidenceContextPack({
    categoryBudgetTargets: {
      fees: 1000,
      groceries: 10000,
    },
    categoryReviewStatuses: {
      fees: "needs-review",
      groceries: "confirmed",
    },
    targetId: "charge_inspector_category_evidence",
  });
  const renderedContext = JSON.stringify(contextPack);
  const groceries = contextPack.categoryEvidence.categories.find(
    (category) => category.category === "groceries",
  );
  const fees = contextPack.categoryEvidence.categories.find(
    (category) => category.category === "fees",
  );

  assert.equal(contextPack.version, "coach_context_pack.v0");
  assert.equal(contextPack.authority, "server");
  assert.equal(contextPack.target.type, "category_evidence");
  assert.equal(
    contextPack.categoryEvidence.version,
    "category_evidence_ai_context.v0",
  );
  assert.equal(groceries.reviewStatus, "confirmed");
  assert.equal(fees.reviewStatus, "needs-review");
  assert.equal(
    contextPack.categoryEvidence.budgetComparisonVersion,
    "category_budget_comparison_ai_context.v0",
  );
  assert.equal(
    contextPack.categoryEvidence.categorySummaryContractVersion,
    "sample_fixture",
  );
  assert.equal(
    contextPack.categoryEvidence.categoryMonthlySummaryVersion,
    "category_monthly_summary_ai_context.v0",
  );
  assert.equal(
    contextPack.categoryEvidence.categoryMonthlyBudgetComparisonVersion,
    "category_monthly_budget_comparison_ai_context.v0",
  );
  assert.equal(
    contextPack.categoryEvidence.categoryBudgetAutomationReadinessVersion,
    "category_budget_automation_readiness_ai_context.v0",
  );
  assert.equal(
    contextPack.categoryEvidence.categoryBudgetAutomationJudgmentVersion,
    "category_budget_automation_judgment_ai_context.v0",
  );
  assert.equal(
    contextPack.categoryEvidence.categoryMonthlySummaryContractVersion,
    "sample_fixture",
  );
  assert.equal(
    contextPack.categoryEvidence.categoryMonthlyBudgetComparisonContractVersion,
    "sample_fixture",
  );
  assert.equal(
    contextPack.categoryEvidence.categoryBudgetAutomationReadinessContractVersion,
    "sample_fixture",
  );
  assert.equal(
    contextPack.categoryEvidence.categoryBudgetAutomationJudgmentContractVersion,
    "sample_fixture",
  );
  assert.deepEqual(
    contextPack.categoryEvidence.factBundles.map((bundle) => ({
      aiContextVersion: bundle.aiContextVersion,
      contractVersion: bundle.contractVersion,
      id: bundle.id,
      rowLabel: bundle.rowLabel,
    })),
    [
      {
        aiContextVersion: "category_monthly_summary_ai_context.v0",
        contractVersion: "sample_fixture",
        id: "category_monthly_summary",
        rowLabel: "category-by-month summary rows",
      },
      {
        aiContextVersion: "category_monthly_budget_comparison_ai_context.v0",
        contractVersion: "sample_fixture",
        id: "category_monthly_budget_comparison",
        rowLabel: "monthly target comparison rows",
      },
      {
        aiContextVersion:
          "category_budget_automation_readiness_ai_context.v0",
        contractVersion: "sample_fixture",
        id: "category_budget_automation_readiness",
        rowLabel: "budget automation readiness rows",
      },
      {
        aiContextVersion:
          "category_budget_automation_judgment_ai_context.v0",
        contractVersion: "sample_fixture",
        id: "category_budget_automation_judgment",
        rowLabel: "budget automation judgment rows",
      },
    ],
  );
  assert.equal(
    contextPack.categoryEvidence.categoryMonthlySummaryRows.find(
      (row) => row.month === "2026-05" && row.category === "groceries",
    ).debitTotalLabel,
    "$130.56",
  );
  assert.equal(
    contextPack.categoryEvidence.categoryMonthlyBudgetComparisons.find(
      (row) => row.month === "2026-05" && row.category === "groceries",
    ).statusLabel,
    "Over target",
  );
  assert.equal(
    contextPack.categoryEvidence.categoryMonthlyBudgetComparisons.find(
      (row) => row.month === "2026-03" && row.category === "groceries",
    ).actualDebitTotalLabel,
    "$0.00",
  );
  assert.equal(
    contextPack.categoryEvidence.categoryMonthlyBudgetComparisons.find(
      (row) => row.month === "2026-05" && row.category === "groceries",
    ).debitTransactionCount,
    2,
  );
  assert.deepEqual(
    pickFields(
      contextPack.categoryEvidence.categoryMonthlyBudgetComparisons.find(
        (row) => row.month === "2026-05" && row.category === "housing",
      ),
      ["status", "targetDebitTotalLabel"],
    ),
    {
      status: "no-target",
      targetDebitTotalLabel: "No target",
    },
  );
  assert.equal(
    contextPack.categoryEvidence.categoryBudgetAutomationReadinessRows.find(
      (row) => row.month === "2026-05" && row.category === "groceries",
    ).readinessStatusLabel,
    "Needs review",
  );
  assert.deepEqual(
    pickFields(
      contextPack.categoryEvidence.categoryBudgetAutomationReadinessRows.find(
        (row) => row.month === "2026-05" && row.category === "housing",
      ),
      ["readinessStatus", "reasonCode"],
    ),
    {
      readinessStatus: "insufficient-context",
      reasonCode: "missing-target",
    },
  );
  assert.equal(
    contextPack.categoryEvidence.categoryBudgetAutomationReadinessRows.find(
      (row) => row.month === "2026-03" && row.category === "groceries",
    ).readinessStatus,
    "ready",
  );
  assert.deepEqual(
    pickFields(
      contextPack.categoryEvidence.categoryBudgetAutomationJudgmentRows.find(
        (row) => row.month === "2026-05" && row.category === "housing",
      ),
      ["judgmentStatus", "reasonCode"],
    ),
    {
      judgmentStatus: "not-enough-context",
      reasonCode: "missing-target",
    },
  );
  assert.equal(
    contextPack.categoryEvidence.categoryBudgetAutomationJudgmentRows.find(
      (row) => row.month === "2026-03" && row.category === "groceries",
    ).judgmentStatus,
    "automation-candidate",
  );
  assert.equal(
    contextPack.categoryEvidence.categoryBudgetAutomationJudgmentRows.find(
      (row) => row.month === "2026-05" && row.category === "groceries",
    ).reasonCode,
    "over-target-review-required",
  );
  assert.equal(groceries.budgetComparison.targetDebitTotalLabel, "$100.00");
  assert.equal(groceries.budgetComparison.varianceAmountLabel, "$30.56 over");
  assert.equal(groceries.budgetComparison.variancePercentLabel, "30.56% over");
  assert.equal(groceries.budgetComparison.status, "over-target");
  assert.equal(fees.budgetComparison.status, "over-target");
  assert.deepEqual(
    groceries.evidenceRows.map((row) => row.merchantName),
    ["Corner Grocer", "Corner Grocer"],
  );
  assert.ok(contextPack.excludedData.includes("raw transaction rows"));
  assert.ok(contextPack.excludedData.includes("automatic recategorization"));
  assert.ok(contextPack.excludedData.includes("saved budget targets"));
  assert.equal(renderedContext.includes("original_description"), false);
  assert.equal(renderedContext.includes("Balance"), false);
});

function pickFields(value, fields) {
  return Object.fromEntries(fields.map((field) => [field, value[field]]));
}

test("report-review AI category evidence context records row window omissions", () => {
  const contextPack = buildCategoryEvidenceContextPack({
    categoryBudgetTargets: {
      fees: 1000,
      groceries: 10000,
    },
    categoryMonthlyWindowPolicy: {
      recentMonths: 1,
      rowCap: 2,
    },
    targetId: "charge_inspector_category_evidence",
  });

  assert.deepEqual(contextPack.categoryEvidence.categoryMonthlySummaryWindow, {
    totalCount: 15,
    includedCount: 2,
    omittedCount: 13,
    window: { recentMonths: 1, rowCap: 2 },
  });
  assert.deepEqual(
    contextPack.categoryEvidence.categoryMonthlyBudgetComparisonWindow,
    {
      totalCount: 19,
      includedCount: 2,
      omittedCount: 17,
      window: { recentMonths: 1, rowCap: 2 },
    },
  );
  assert.deepEqual(
    contextPack.categoryEvidence.categoryBudgetAutomationReadinessWindow,
    {
      totalCount: 19,
      includedCount: 2,
      omittedCount: 17,
      window: { recentMonths: 1, rowCap: 2 },
    },
  );
  assert.deepEqual(
    contextPack.categoryEvidence.categoryBudgetAutomationJudgmentWindow,
    {
      totalCount: 19,
      includedCount: 2,
      omittedCount: 17,
      window: { recentMonths: 1, rowCap: 2 },
    },
  );
  assert.deepEqual(
    contextPack.categoryEvidence.factBundles.map((bundle) => [
      bundle.id,
      bundle.window.includedCount,
      bundle.window.omittedCount,
    ]),
    [
      ["category_monthly_summary", 2, 13],
      ["category_monthly_budget_comparison", 2, 17],
      ["category_budget_automation_readiness", 2, 17],
      ["category_budget_automation_judgment", 2, 17],
    ],
  );
  assert.deepEqual(
    contextPack.categoryEvidence.categoryMonthlyBudgetComparisons.map(
      (row) => `${row.month}:${row.category}`,
    ),
    ["2026-05:groceries", "2026-05:fees"],
  );
  assert.deepEqual(
    contextPack.categoryEvidence.categoryBudgetAutomationReadinessRows.map(
      (row) => `${row.month}:${row.category}:${row.readinessStatus}`,
    ),
    ["2026-05:groceries:needs-review", "2026-05:fees:needs-review"],
  );
  assert.deepEqual(
    contextPack.categoryEvidence.categoryBudgetAutomationJudgmentRows.map(
      (row) => `${row.month}:${row.category}:${row.judgmentStatus}`,
    ),
    [
      "2026-05:groceries:needs-human-review",
      "2026-05:fees:needs-human-review",
    ],
  );
  assert.match(
    contextPack.categoryEvidence.limitations.join(" "),
    /omitted by the recent 1-month \/ 2-row context window/,
  );
});

test("charge inspector category budget target parser keeps deterministic cents", () => {
  assert.deepEqual(parseCategoryBudgetTargetInput(""), {
    amountCents: null,
    errorMessage: null,
  });
  assert.deepEqual(parseCategoryBudgetTargetInput("$1,234.50"), {
    amountCents: 123450,
    errorMessage: null,
  });
  assert.deepEqual(categoryBudgetTargetsFromInputs({
    groceries: "$100.00",
    dining: "bad",
    fees: "",
  }), {
    groceries: 10000,
  });
  assert.match(
    parseCategoryBudgetTargetInput("12.345").errorMessage,
    /up to 2 decimals/,
  );
  assert.match(
    parseCategoryBudgetTargetInput("0").errorMessage,
    /positive target/,
  );
});

test("charge inspector category budget comparison uses user target facts", () => {
  const groceries = chargeInspectorSampleReview.categorySummary.find(
    (category) => category.category === "groceries",
  );

  const comparison = compareCategoryBudgetTarget(groceries, 10000);

  assert.equal(comparison.actualDebitTotalCents, 13056);
  assert.equal(comparison.actualDebitTotalLabel, "$130.56");
  assert.equal(comparison.targetDebitTotalLabel, "$100.00");
  assert.equal(comparison.varianceAmountCents, 3056);
  assert.equal(comparison.varianceAmountLabel, "$30.56 over");
  assert.equal(comparison.variancePercentLabel, "30.56% over");
  assert.equal(comparison.status, "over-target");
  assert.match(comparison.limitations.join(" "), /user-entered target/);
});

test("charge inspector monthly category budget comparison uses user target facts", () => {
  const comparisons = compareCategoryMonthlyBudgetTargets(
    chargeInspectorSampleReview.categoryMonthlySummary,
    { groceries: 10000 },
  );
  const marchGroceries = comparisons.find(
    (comparison) =>
      comparison.month === "2026-03" && comparison.category === "groceries",
  );
  const mayGroceries = comparisons.find(
    (comparison) =>
      comparison.month === "2026-05" && comparison.category === "groceries",
  );
  const mayHousing = comparisons.find(
    (comparison) =>
      comparison.month === "2026-05" && comparison.category === "housing",
  );

  const noTargetComparisons = compareCategoryMonthlyBudgetTargets(
    chargeInspectorSampleReview.categoryMonthlySummary,
    {},
  );
  const noTargetMayGroceries = noTargetComparisons.find(
    (comparison) =>
      comparison.month === "2026-05" && comparison.category === "groceries",
  );

  assert.equal(
    noTargetComparisons.length,
    chargeInspectorSampleReview.categoryMonthlySummary.length,
  );
  assert.equal(noTargetMayGroceries.actualDebitTotalLabel, "$130.56");
  assert.equal(noTargetMayGroceries.targetDebitTotalLabel, "No target");
  assert.equal(noTargetMayGroceries.status, "no-target");
  assert.equal(marchGroceries.actualDebitTotalLabel, "$0.00");
  assert.equal(marchGroceries.targetDebitTotalLabel, "$100.00");
  assert.equal(marchGroceries.status, "within-target");
  assert.equal(mayGroceries.actualDebitTotalLabel, "$130.56");
  assert.equal(mayGroceries.varianceAmountLabel, "$30.56 over");
  assert.equal(mayGroceries.variancePercentLabel, "30.56% over");
  assert.equal(mayGroceries.status, "over-target");
  assert.equal(mayHousing.targetDebitTotalLabel, "No target");
  assert.equal(mayHousing.status, "no-target");
});

test("charge inspector monthly comparison merge keeps platform target rows", () => {
  const platformComparisons = compareCategoryMonthlyBudgetTargets(
    chargeInspectorSampleReview.categoryMonthlySummary,
    { housing: 120000 },
  );
  const localComparisons = compareCategoryMonthlyBudgetTargets(
    chargeInspectorSampleReview.categoryMonthlySummary,
    { groceries: 10000 },
  );

  const merged = mergeCategoryMonthlyBudgetComparisons(
    platformComparisons,
    localComparisons,
  );
  const mayGroceries = merged.find(
    (comparison) =>
      comparison.month === "2026-05" && comparison.category === "groceries",
  );
  const mayHousing = merged.find(
    (comparison) =>
      comparison.month === "2026-05" && comparison.category === "housing",
  );
  const marchHousing = merged.find(
    (comparison) =>
      comparison.month === "2026-03" && comparison.category === "housing",
  );

  assert.equal(merged.length, 19);
  assert.equal(mayGroceries.targetDebitTotalLabel, "$100.00");
  assert.equal(mayGroceries.status, "over-target");
  assert.equal(mayGroceries.debitTransactionCount, 2);
  assert.equal(mayHousing.targetDebitTotalLabel, "$1,200.00");
  assert.equal(mayHousing.status, "over-target");
  assert.equal(marchHousing.actualDebitTotalLabel, "$0.00");
  assert.equal(marchHousing.targetDebitTotalLabel, "$1,200.00");
  assert.equal(marchHousing.status, "within-target");
});

test("charge inspector budget automation readiness derives from monthly comparisons", () => {
  const readinessRows = deriveCategoryBudgetAutomationReadiness(
    compareCategoryMonthlyBudgetTargets(chargeInspectorSampleReview.categoryMonthlySummary, {
      groceries: 10000,
      subscriptions: 2000,
    }),
  );
  const rowsByKey = new Map(
    readinessRows.map((row) => [`${row.month}:${row.category}`, row]),
  );

  assert.equal(
    rowsByKey.get("2026-03:groceries").readinessStatus,
    "ready",
  );
  assert.equal(
    rowsByKey.get("2026-03:groceries").reasonCode,
    "within-target",
  );
  assert.equal(
    rowsByKey.get("2026-03:groceries").automationScope,
    "explanation-only",
  );
  assert.equal(
    rowsByKey.get("2026-03:fitness").readinessStatus,
    "insufficient-context",
  );
  assert.equal(
    rowsByKey.get("2026-03:fitness").reasonCode,
    "missing-target",
  );
  assert.equal(
    rowsByKey.get("2026-05:groceries").readinessStatus,
    "needs-review",
  );
  assert.equal(
    rowsByKey.get("2026-05:groceries").varianceAmountLabel,
    "$30.56 over",
  );
  assert.match(
    rowsByKey.get("2026-05:groceries").limitations.join(" "),
    /not an automation decision/,
  );
});

test("charge inspector budget automation judgment derives boundary labels", () => {
  const readinessRows = deriveCategoryBudgetAutomationReadiness(
    compareCategoryMonthlyBudgetTargets(
      chargeInspectorSampleReview.categoryMonthlySummary,
      {
        groceries: 10000,
        subscriptions: 2000,
      },
    ),
  );
  const judgmentRows = deriveCategoryBudgetAutomationJudgments(readinessRows);
  const rowsByKey = new Map(
    judgmentRows.map((row) => [`${row.month}:${row.category}`, row]),
  );

  assert.equal(
    rowsByKey.get("2026-03:groceries").judgmentStatus,
    "automation-candidate",
  );
  assert.equal(
    rowsByKey.get("2026-03:groceries").reasonCode,
    "within-target-ready",
  );
  assert.equal(
    rowsByKey.get("2026-03:groceries").judgmentScope,
    "boundary-only",
  );
  assert.equal(
    rowsByKey.get("2026-03:fitness").judgmentStatus,
    "not-enough-context",
  );
  assert.equal(
    rowsByKey.get("2026-03:fitness").reasonCode,
    "missing-target",
  );
  assert.equal(
    rowsByKey.get("2026-05:groceries").judgmentStatus,
    "needs-human-review",
  );
  assert.equal(
    rowsByKey.get("2026-05:groceries").reasonCode,
    "over-target-review-required",
  );
  assert.match(
    rowsByKey.get("2026-05:groceries").explanation,
    /does not recommend a spending change/,
  );
  assert.deepEqual(
    Array.from(new Set(judgmentRows.map((row) => row.judgmentStatus))).sort(),
    ["automation-candidate", "needs-human-review", "not-enough-context"],
  );
  assert.equal(
    judgmentRows.some(
      (row) => row.reasonCode === "unsupported-automation-scope",
    ),
    false,
  );
});

test("charge inspector automation review queue groups visible judgments", () => {
  const readinessRows = deriveCategoryBudgetAutomationReadiness(
    compareCategoryMonthlyBudgetTargets(
      chargeInspectorSampleReview.categoryMonthlySummary,
      {
        groceries: 10000,
        subscriptions: 2000,
      },
    ),
  );
  const judgmentRows = deriveCategoryBudgetAutomationJudgments(readinessRows);
  const queueItems = buildCategoryBudgetAutomationReviewQueue(judgmentRows);
  const firstCandidateIndex = queueItems.findIndex(
    (item) => item.lane === "candidate",
  );
  const firstMissingContextIndex = queueItems.findIndex(
    (item) => item.lane === "missing-context",
  );

  assert.equal(queueItems.length, judgmentRows.length);
  assert.equal(queueItems[0].lane, "human-review");
  assert.equal(firstMissingContextIndex > 0, true);
  assert.equal(firstCandidateIndex > firstMissingContextIndex, true);
  assert.equal(queueItems[0].judgment.month, "2026-05");
  assert.match(queueItems[0].reviewPrompt, /before any later workflow/);
  assert.match(
    queueItems[0].sourceFactsLabel,
    /actual \$130\.56, target \$100\.00, variance \$30\.56 over, debit rows 2/,
  );
  assert.equal(
    queueItems.some((item) => item.lane === "boundary-blocked"),
    false,
  );
  assert.doesNotMatch(
    queueItems.map((item) => item.reviewPrompt).join(" "),
    /you should|recommend/i,
  );
});

test("charge inspector monthly row window keeps recent months before target priority", () => {
  const rows = [
    {
      id: "old-target",
      month: "2025-01",
      category: "groceries",
      label: "Groceries",
      targetDebitTotalCents: 10000,
    },
    {
      id: "recent-housing",
      month: "2026-04",
      category: "housing",
      label: "Housing",
      targetDebitTotalCents: null,
    },
    {
      id: "recent-shopping",
      month: "2026-05",
      category: "shopping",
      label: "Shopping",
      targetDebitTotalCents: null,
    },
    {
      id: "recent-groceries-target",
      month: "2026-05",
      category: "groceries",
      label: "Groceries",
      targetDebitTotalCents: 10000,
    },
    {
      id: "recent-fees-target",
      month: "2026-05",
      category: "fees",
      label: "Fees",
      targetDebitTotalCents: 1000,
    },
  ];

  const windowedRows = windowChargeInspectorRows(rows, {
    isPriorityRow: (row) => row.targetDebitTotalCents !== null,
    policy: { recentMonths: 2, rowCap: 3 },
  });

  assert.deepEqual(
    windowedRows.kept.map((row) => row.id),
    ["recent-groceries-target", "recent-fees-target", "recent-shopping"],
  );
  assert.equal(windowedRows.totalCount, 5);
  assert.equal(windowedRows.includedCount, 3);
  assert.equal(windowedRows.omittedCount, 2);
  assert.deepEqual(windowedRows.window, { recentMonths: 2, rowCap: 3 });
});

test("report-review AI approved corpus loader reads collector-shaped JSONL", () => {
  const artifacts = approvedKnowledgeArtifacts({
    artifactIds: ["knowledge.debt_cost_context.v0"],
  });

  assert.equal(artifacts.length, 1);
  assert.equal(artifacts[0].id, "knowledge.debt_cost_context.v0");
  assert.equal(artifacts[0].reviewStatus, "approved");
  assert.equal(artifacts[0].sourcePath.endsWith(".jsonl"), true);
  assert.ok(artifacts[0].prohibitedUses.length > 0);
});

test("report-review AI source map covers every approved corpus artifact", () => {
  const mappedArtifactIds = new Set();

  for (const finding of reportReviewSample.findings) {
    const artifactIds = approvedKnowledgeArtifactIdsForFinding(finding.id);
    assert.ok(artifactIds.length > 0);

    const artifacts = approvedKnowledgeArtifacts({ artifactIds });
    assert.deepEqual(
      artifacts.map((artifact) => artifact.id),
      artifactIds,
    );

    for (const artifactId of artifactIds) {
      mappedArtifactIds.add(artifactId);
    }
  }

  assert.deepEqual(
    approvedKnowledgeArtifacts()
      .map((artifact) => artifact.id)
      .sort(),
    [...mappedArtifactIds].sort(),
  );
});

test("report-review AI source map fails closed for unmapped targets", () => {
  assert.throws(
    () => approvedKnowledgeArtifactIdsForFinding("unmapped-finding"),
    /No approved knowledge artifacts are mapped/,
  );
});

test("report-review AI request parser rejects client-supplied context", () => {
  const finding = reportReviewSample.findings[0];

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        evidenceSources: reportReviewSample.evidenceSources,
        finding,
        questionType: "explain_finding",
        surface: "report_review",
        targetId: finding.id,
        targetType: "finding",
        userMessage: null,
      }),
    /evidenceSources must not be supplied/,
  );
});

test("report-review AI request parser rejects raw data leakage", () => {
  const finding = reportReviewSample.findings[0];

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        questionType: "explain_finding",
        rawTransactions: [{ amount: "12.00", merchant: "Example" }],
        surface: "report_review",
        targetId: finding.id,
        targetType: "finding",
        userMessage: null,
      }),
    /rawTransactions must not be supplied/,
  );
});

test("report-review AI request parser rejects client-supplied spending context", () => {
  assert.throws(
    () =>
      parseReportReviewAiRequest({
        monthlySpendingSummary: [
          { month: "2026-05", debitTotalLabel: "$1.00" },
        ],
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "charge_inspector_monthly_spending_summary",
        targetType: "monthly_spending_summary",
        userMessage: null,
      }),
    /monthlySpendingSummary must not be supplied/,
  );
});

test("report-review AI request parser rejects client-supplied category evidence", () => {
  assert.throws(
    () =>
      parseReportReviewAiRequest({
        categoryEvidence: [{ merchantName: "Injected Merchant" }],
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "charge_inspector_category_evidence",
        targetType: "category_evidence",
        userMessage: null,
      }),
    /categoryEvidence must not be supplied/,
  );

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        categoryBudgetComparison: [{ category: "groceries" }],
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "charge_inspector_category_evidence",
        targetType: "category_evidence",
        userMessage: null,
      }),
    /categoryBudgetComparison must not be supplied/,
  );

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        categoryMonthlyBudgetComparison: [
          { category: "groceries", month: "2026-05" },
        ],
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "charge_inspector_category_evidence",
        targetType: "category_evidence",
        userMessage: null,
      }),
    /categoryMonthlyBudgetComparison must not be supplied/,
  );

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        categoryBudgetAutomationReadiness: [
          { category: "groceries", month: "2026-05", readinessStatus: "ready" },
        ],
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "charge_inspector_category_evidence",
        targetType: "category_evidence",
        userMessage: null,
      }),
    /categoryBudgetAutomationReadiness must not be supplied/,
  );

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        categoryBudgetAutomationJudgment: [
          {
            category: "groceries",
            judgmentStatus: "automation-candidate",
            month: "2026-05",
          },
        ],
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "charge_inspector_category_evidence",
        targetType: "category_evidence",
        userMessage: null,
      }),
    /categoryBudgetAutomationJudgment must not be supplied/,
  );

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        categoryMonthlyTargetStatus: [
          {
            category: "groceries",
            targetStatus: "over-user-target",
            month: "2026-05",
          },
        ],
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "charge_inspector_category_evidence",
        targetType: "category_evidence",
        userMessage: null,
      }),
    /categoryMonthlyTargetStatus must not be supplied/,
  );

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        categoryMonthlySummary: [{ category: "groceries", month: "2026-05" }],
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "charge_inspector_category_evidence",
        targetType: "category_evidence",
        userMessage: null,
      }),
    /categoryMonthlySummary must not be supplied/,
  );
});

test("report-review AI request parser accepts target-only payload", () => {
  const finding = reportReviewSample.findings[0];

  const request = parseReportReviewAiRequest({
    questionType: "explain_finding",
    surface: "report_review",
    targetId: finding.id,
    targetType: "finding",
    userMessage: null,
  });

  assert.equal(request.targetId, finding.id);
  assert.equal(request.questionType, "explain_finding");
});

test("report-review AI request parser accepts monthly spending target payload", () => {
  const request = parseReportReviewAiRequest({
    questionType: "explain_finding",
    surface: "report_review",
    targetId: "charge_inspector_monthly_spending_summary",
    targetType: "monthly_spending_summary",
    userMessage: null,
  });

  assert.equal(request.targetId, "charge_inspector_monthly_spending_summary");
  assert.equal(request.targetType, "monthly_spending_summary");
});

test("report-review AI request parser accepts category review statuses only for category evidence", () => {
  const request = parseReportReviewAiRequest({
    categoryBudgetTargets: {
      fees: 1000,
      groceries: 10000,
    },
    categoryReviewStatuses: {
      fees: "needs-review",
      groceries: "confirmed",
    },
    questionType: "explain_finding",
    surface: "report_review",
    targetId: "charge_inspector_category_evidence",
    targetType: "category_evidence",
    userMessage: null,
  });

  assert.equal(request.targetId, "charge_inspector_category_evidence");
  assert.equal(request.targetType, "category_evidence");
  assert.deepEqual(request.categoryReviewStatuses, {
    fees: "needs-review",
    groceries: "confirmed",
  });
  assert.deepEqual(request.categoryBudgetTargets, {
    fees: 1000,
    groceries: 10000,
  });

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        categoryReviewStatuses: { groceries: "confirmed" },
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "charge_inspector_monthly_spending_summary",
        targetType: "monthly_spending_summary",
        userMessage: null,
      }),
    /categoryReviewStatuses is only supported for category evidence/,
  );

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        categoryBudgetTargets: { groceries: 10000 },
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "charge_inspector_monthly_spending_summary",
        targetType: "monthly_spending_summary",
        userMessage: null,
      }),
    /categoryBudgetTargets is only supported for category evidence/,
  );

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        categoryBudgetTargets: { groceries: 0 },
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "charge_inspector_category_evidence",
        targetType: "category_evidence",
        userMessage: null,
      }),
    /positive cents integer/,
  );
});

test("report-review AI explanation rejects unsupported targets", async () => {
  await assert.rejects(
    () =>
      explainReportReviewFinding({
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "unsupported-finding",
        targetType: "finding",
        userMessage: null,
      }),
    /targetId is not supported/,
  );
});

test("report-review AI explains monthly spending aggregate without raw rows", async () => {
  const answer = await explainReportReviewFinding({
    questionType: "explain_finding",
    surface: "report_review",
    targetId: "charge_inspector_monthly_spending_summary",
    targetType: "monthly_spending_summary",
    userMessage: null,
  });

  assert.equal(answer.answerKind, "validated_answer");
  assert.equal(answer.validation.status, "passed");
  assert.equal(answer.target.type, "monthly_spending_summary");
  assert.equal(
    answer.versions.monthlySpendingContext,
    "monthly_spending_ai_context.v0",
  );
  assert.equal(
    answer.evidence.some((item) =>
      item.text.includes("2026-05: spending $1,889.90"),
    ),
    true,
  );
  assert.doesNotMatch(JSON.stringify(answer), /Streamly Premium/);
  assert.doesNotMatch(answer.answer, /you should/i);
});

test("report-review AI monthly spending copy avoids finding-only wording", async () => {
  for (const questionType of ["missing_context", "next_questions"]) {
    const answer = await explainReportReviewFinding({
      questionType,
      surface: "report_review",
      targetId: "charge_inspector_monthly_spending_summary",
      targetType: "monthly_spending_summary",
      userMessage: null,
    });

    assert.equal(answer.answerKind, "validated_answer", questionType);
    assert.equal(answer.validation.status, "passed", questionType);
    assert.match(answer.answer, /monthly spending summary|month/i);
    assert.doesNotMatch(answer.answer, /This finding/i);
    assert.doesNotMatch(answer.answer, /obligations temporary or recurring/i);
    assert.doesNotMatch(answer.answer, /you should/i);
  }
});

test("report-review AI explains category evidence without recategorizing", async () => {
  const answer = await explainReportReviewFinding({
    categoryBudgetTargets: {
      groceries: 10000,
    },
    categoryReviewStatuses: {
      fees: "needs-review",
      groceries: "confirmed",
    },
    questionType: "explain_finding",
    surface: "report_review",
    targetId: "charge_inspector_category_evidence",
    targetType: "category_evidence",
    userMessage: null,
  });

  assert.equal(answer.answerKind, "validated_answer");
  assert.equal(answer.validation.status, "passed");
  assert.equal(answer.target.type, "category_evidence");
  assert.equal(
    answer.versions.categoryEvidenceContext,
    "category_evidence_ai_context.v0",
  );
  assert.equal(
    answer.versions.categoryBudgetComparisonContext,
    "category_budget_comparison_ai_context.v0",
  );
  assert.equal(
    answer.versions.categoryBudgetAutomationReadinessContext,
    "category_budget_automation_readiness_ai_context.v0",
  );
  assert.equal(
    answer.versions.categoryBudgetAutomationJudgmentContext,
    "category_budget_automation_judgment_ai_context.v0",
  );
  assert.equal(
    answer.versions.categoryMonthlyBudgetComparisonContext,
    "category_monthly_budget_comparison_ai_context.v0",
  );
  assert.equal(
    answer.versions.categoryMonthlySummaryContext,
    "category_monthly_summary_ai_context.v0",
  );
  assert.equal(
    answer.evidence.some((item) => item.text.includes("Corner Grocer")),
    true,
  );
  assert.equal(
    answer.evidence.some((item) =>
      item.text.includes("target $100.00"),
    ),
    true,
  );
  assert.equal(
    answer.evidence.some((item) => item.text.includes("30.56% over")),
    true,
  );
  assert.equal(
    answer.evidence.some((item) =>
      item.text.includes("2026-05 Groceries"),
    ),
    true,
  );
  assert.equal(
    answer.evidence.some((item) =>
      item.text.includes(
        "2026-05 Groceries: actual $130.56, target $100.00",
      ),
    ),
    true,
  );
  assert.equal(
    answer.evidence.some((item) =>
      item.text.includes("status Over target, debit rows 2"),
    ),
    true,
  );
  assert.equal(
    answer.evidence.some((item) =>
      item.text.includes(
        "Budget automation readiness rows: 2026-03 Groceries: Ready for explanation",
      ),
    ),
    true,
  );
  assert.equal(
    answer.evidence.some((item) =>
      item.text.includes(
        "Budget automation judgment rows: 2026-03 Groceries: Candidate",
      ),
    ),
    true,
  );
  assert.equal(
    answer.evidence.some((item) => item.text.includes("Fees (needs-review)")),
    true,
  );
  assert.doesNotMatch(JSON.stringify(answer), /"original_description"/i);
  assert.doesNotMatch(JSON.stringify(answer), /"balance"/i);
  assert.doesNotMatch(answer.answer, /you should/i);
  assert.doesNotMatch(answer.answer, /wrong category/i);
});

test("report-review AI category evidence refuses unsupported follow-up", async () => {
  const answer = await explainReportReviewFinding({
    questionType: "follow_up",
    surface: "report_review",
    targetId: "charge_inspector_category_evidence",
    targetType: "category_evidence",
    userMessage: "Why is this category here?",
  });

  assert.equal(answer.answerKind, "boundary_refusal");
  assert.equal(answer.validation.status, "fallback");
  assert.equal(answer.validation.fallbackUsed, true);
  assert.match(answer.validation.reasons.join(" "), /not enabled/);
});

test("report-review AI explanation returns validated fixture answer", async () => {
  const finding = reportReviewSample.findings[0];
  const answer = await explainReportReviewFinding({
    questionType: "explain_finding",
    surface: "report_review",
    targetId: finding.id,
    targetType: "finding",
    userMessage: null,
  });

  assert.equal(answer.answerKind, "validated_answer");
  assert.equal(answer.validation.status, "passed");
  assert.equal(answer.validation.fallbackUsed, false);
  assert.equal(answer.versions.contextPack, "coach_context_pack.v0");
  assert.equal(answer.versions.prompt, "report_review_explain.v0");
  assert.equal(answer.sources.some((source) => source.id === finding.id), true);
  assert.doesNotMatch(answer.answer, /you should/i);
});

test("report-review AI missing-context answers validate across findings", async () => {
  for (const finding of reportReviewSample.findings) {
    const answer = await explainReportReviewFinding({
      questionType: "missing_context",
      surface: "report_review",
      targetId: finding.id,
      targetType: "finding",
      userMessage: null,
    });

    assert.equal(answer.validation.status, "passed", finding.id);
    assert.equal(answer.validation.fallbackUsed, false, finding.id);
    assert.doesNotMatch(answer.answer, /tax treatment/i);
  }
});

test("report-review AI follow-up allows non-advisory hold phrasing", async () => {
  const finding = reportReviewSample.findings[0];
  const answer = await explainReportReviewFinding({
    questionType: "follow_up",
    surface: "report_review",
    targetId: finding.id,
    targetType: "finding",
    userMessage: "Does this still hold if income changes?",
  });

  assert.equal(answer.validation.status, "passed");
  assert.equal(answer.validation.fallbackUsed, false);
  assert.doesNotMatch(answer.answer, /income changes/i);
});

test("report-review AI follow-up refuses action ranking requests", async () => {
  const finding = reportReviewSample.findings[0];
  const answer = await explainReportReviewFinding({
    questionType: "follow_up",
    surface: "report_review",
    targetId: finding.id,
    targetType: "finding",
    userMessage: "What should I do first and can you rank the actions?",
  });

  assert.equal(answer.answerKind, "boundary_refusal");
  assert.equal(answer.validation.status, "fallback");
  assert.equal(answer.validation.fallbackUsed, true);
  assert.match(answer.answer, /cannot answer/i);
  assert.match(answer.limitations.join(" "), /not investment, tax, legal/i);
});

test("report-review AI marks provider validation fallback answers", async () => {
  const finding = reportReviewSample.findings[0];
  const answer = await explainReportReviewFinding(
    {
      questionType: "explain_finding",
      surface: "report_review",
      targetId: finding.id,
      targetType: "finding",
      userMessage: null,
    },
    {
      provider: {
        info: {
          id: "fixture",
          label: "Invalid fixture provider",
          mode: "deterministic-fixture",
        },
        model: "fixture.invalid-answer.v0",
        generateAnswer: async ({ contextPack }) => ({
          answer:
            "This intentionally invalid provider draft omits evidence for testing.",
          evidence: [],
          limitations: ["Invalid provider draft for testing."],
          sources: [
            {
              id: contextPack.id,
              title: contextPack.target.title,
              type: "context_pack",
            },
          ],
        }),
      },
    },
  );

  assert.equal(answer.answerKind, "validation_fallback");
  assert.equal(answer.validation.status, "fallback");
  assert.equal(answer.validation.fallbackUsed, true);
  assert.match(answer.validation.reasons.join(" "), /missing evidence/i);
});

test("report-review AI marks provider error fallback answers", async () => {
  const finding = reportReviewSample.findings[0];
  const answer = await explainReportReviewFinding(
    {
      questionType: "explain_finding",
      surface: "report_review",
      targetId: finding.id,
      targetType: "finding",
      userMessage: null,
    },
    {
      provider: {
        info: {
          id: "fixture",
          label: "Throwing fixture provider",
          mode: "deterministic-fixture",
        },
        model: "fixture.provider-error.v0",
        generateAnswer: async () => {
          throw new Error("Provider unavailable for test.");
        },
      },
    },
  );

  assert.equal(answer.answerKind, "provider_error_fallback");
  assert.equal(answer.validation.status, "fallback");
  assert.equal(answer.validation.fallbackUsed, true);
  assert.match(answer.validation.reasons.join(" "), /could not return/i);
});

test("report-review AI provider draft parser rejects malformed output", () => {
  assert.throws(
    () =>
      parseReportReviewAiDraft({
        answer: "Missing structured arrays.",
        evidence: [],
        limitations: [],
        sources: [{ id: "bad", title: "Bad", type: "unsupported" }],
      }),
    /supported source type/,
  );
});

test("report-review AI eval harness passes deterministic fixture cases", async () => {
  const summary = await runReportReviewAiEvalSuite({ providerMode: "fixture" });

  assert.equal(summary.suiteVersion, "report_review_ai_eval.v0");
  assert.equal(summary.failed, 0);
  assert.equal(summary.passed, summary.total);
  assert.ok(summary.total >= 10);
  assert.ok(
    summary.results.some(
      (result) =>
        result.id === "validator_rejects_action_ranking_answer" &&
        result.validation.status === "fallback",
    ),
  );
  assert.equal(JSON.stringify(summary).includes("You should pay this debt"), false);
});

test("report-review AI eval cases cover required boundary categories", () => {
  const cases = loadReportReviewAiEvalCases();
  const caseIds = new Set(cases.map((testCase) => testCase.id));

  assert.ok(caseIds.has("allowed_explain_finding"));
  assert.ok(caseIds.has("allowed_bounded_follow_up"));
  assert.ok(caseIds.has("refuses_action_ranking_follow_up"));
  assert.ok(caseIds.has("refuses_llm_calculation_follow_up"));
  assert.ok(caseIds.has("refuses_tax_legal_product_follow_up"));
  assert.ok(caseIds.has("rejects_raw_transaction_context"));
  assert.ok(caseIds.has("allowed_monthly_spending_summary_explain"));
  assert.ok(caseIds.has("allowed_monthly_spending_summary_missing_context"));
  assert.ok(caseIds.has("allowed_monthly_spending_summary_next_questions"));
  assert.ok(caseIds.has("rejects_client_supplied_monthly_spending_context"));
  assert.ok(caseIds.has("allowed_category_evidence_explain"));
  assert.ok(caseIds.has("allowed_category_evidence_missing_context"));
  assert.ok(caseIds.has("allowed_category_budget_target_comparison"));
  assert.ok(caseIds.has("refuses_category_evidence_follow_up"));
  assert.ok(caseIds.has("rejects_client_supplied_category_evidence_context"));
  assert.ok(caseIds.has("rejects_client_supplied_category_budget_comparison"));
  assert.ok(
    caseIds.has("rejects_client_supplied_category_monthly_budget_comparison"),
  );
  assert.ok(
    caseIds.has("rejects_client_supplied_category_budget_automation_judgment"),
  );
  assert.ok(caseIds.has("validator_rejects_missing_evidence"));
});

test("saving goal draft calculates the baseline arithmetic", () => {
  const summary = calculateSavingGoalDraft(defaultSavingGoalDraftValues());

  assert.equal(summary.goalName, "Emergency reserve top-up");
  assert.equal(summary.remainingAmount, 3000);
  assert.equal(summary.progressPercent, 80);
  assert.equal(summary.monthsAtCurrentContribution, 6);
  assert.equal(summary.monthlyNeededForTarget, 500);
  assert.equal(summary.status, "pace_fits_horizon");
  assert.equal(summary.statusLabel, "Pace fits entered horizon");
});

test("saving goal draft keeps blank target horizon missing", () => {
  const values = defaultSavingGoalDraftValues();
  values.targetMonths = "";

  const summary = calculateSavingGoalDraft(values);

  assert.equal(summary.targetMonths, null);
  assert.equal(summary.monthlyNeededForTarget, null);
  assert.equal(summary.status, "estimate_only");
  assert.deepEqual(summary.validationMessages, []);
});

test("saving goal draft caps progress when current savings exceed target", () => {
  const values = defaultSavingGoalDraftValues();
  values.currentSaved = "16000.00";

  const summary = calculateSavingGoalDraft(values);

  assert.equal(summary.remainingAmount, 0);
  assert.equal(summary.progressPercent, 100);
  assert.equal(summary.monthsAtCurrentContribution, 0);
  assert.equal(summary.monthlyNeededForTarget, 0);
  assert.equal(summary.status, "reached");
});

test("saving goal draft treats zero contribution as horizon-only context", () => {
  const values = defaultSavingGoalDraftValues();
  values.monthlyContribution = "0";

  const summary = calculateSavingGoalDraft(values);

  assert.equal(summary.monthsAtCurrentContribution, null);
  assert.equal(summary.monthlyNeededForTarget, 500);
  assert.equal(summary.status, "horizon_only");
});

test("saving goal draft requires contribution or horizon when both are absent", () => {
  const values = defaultSavingGoalDraftValues();
  values.monthlyContribution = "0";
  values.targetMonths = "";

  const summary = calculateSavingGoalDraft(values);

  assert.equal(summary.status, "needs_contribution_or_horizon");
  assert.equal(summary.monthsAtCurrentContribution, null);
  assert.equal(summary.monthlyNeededForTarget, null);
  assert.deepEqual(summary.validationMessages, []);
});

test("saving goal draft rejects a non-positive target amount", () => {
  const values = defaultSavingGoalDraftValues();
  values.targetAmount = "0";

  const summary = calculateSavingGoalDraft(values);

  assert.equal(summary.status, "needs_target");
  assert.equal(summary.remainingAmount, null);
  assert.match(summary.validationMessages.join(" "), /greater than 0/);
});

test("saving goal draft rejects an invalid optional horizon", () => {
  const values = defaultSavingGoalDraftValues();
  values.targetMonths = "0";

  const summary = calculateSavingGoalDraft(values);

  assert.equal(summary.status, "invalid_input");
  assert.equal(summary.monthlyNeededForTarget, null);
  assert.match(summary.validationMessages.join(" "), /Target horizon/);
});

test("saving goal draft money formatting preserves entered cents", () => {
  assert.equal(formatSavingGoalDraftMoney(3000), "$3,000");
  assert.equal(formatSavingGoalDraftMoney(3000.5), "$3,000.50");
  assert.equal(formatSavingGoalDraftMoney(750.125), "$750.13");
  assert.equal(formatSavingGoalDraftMoney(null), "Missing");
});

test("saving goal draft stays inside the product boundary", () => {
  const summary = calculateSavingGoalDraft(defaultSavingGoalDraftValues());
  const copy = [...summary.assumptions, ...summary.limitations].join(" ");

  assert.match(copy, /in-session draft/);
  assert.match(copy, /No bank connection/);
  assert.match(copy, /Does not compare this goal/);
  assert.doesNotMatch(copy, /you should/i);
  assert.doesNotMatch(copy, /credit card/i);
});

test("goal planning workspace summarizes user ordered goals", () => {
  const summaries = summarizeGoalPlan(defaultGoalPlanningRows(), "2026-07");

  assert.equal(summaries.length, 4);
  assert.equal(summaries[0].name, "Emergency fund");
  assert.equal(summaries[0].priority, 1);
  assert.equal(summaries[0].remainingAmount, 8000);
  assert.equal(summaries[0].progressPercent, 60);
  assert.equal(summaries[0].monthsUntilTarget, 6);
  assert.equal(summaries[0].monthlyNeededForTarget, 8000 / 6);
  assert.equal(summaries[0].monthsAtCurrentContribution, 14);
  assert.equal(summaries[0].status, "needs_more_monthly_input");
});

test("goal planning workspace supports a reached entered target", () => {
  const [row] = defaultGoalPlanningRows();
  const summary = summarizeGoalPlanningRow(
    { ...row, currentSaved: "21000.00" },
    1,
    "2026-07",
  );

  assert.equal(summary.remainingAmount, 0);
  assert.equal(summary.progressPercent, 100);
  assert.equal(summary.monthlyNeededForTarget, 0);
  assert.equal(summary.monthsAtCurrentContribution, 0);
  assert.equal(summary.status, "reached");
});

test("goal planning workspace derives a current as-of month", () => {
  assert.equal(
    currentGoalPlanningAsOfMonth(new Date(2027, 1, 15)),
    "2027-02",
  );
});

test("goal planning workspace accepts currency formatted money inputs", () => {
  const [row] = defaultGoalPlanningRows();
  const summary = summarizeGoalPlanningRow(
    {
      ...row,
      currentSaved: "12,000.50",
      monthlyContribution: "$600",
      targetAmount: "$20,000",
    },
    1,
    "2026-07",
  );

  assert.equal(summary.targetAmountValue, 20000);
  assert.equal(summary.currentSavedValue, 12000.5);
  assert.equal(summary.monthlyContributionValue, 600);
  assert.equal(summary.remainingAmount, 7999.5);
  assert.equal(summary.monthsAtCurrentContribution, 14);
  assert.deepEqual(summary.validationMessages, []);
});

test("goal planning workspace rejects target months before the as-of month", () => {
  const [row] = defaultGoalPlanningRows();
  const summary = summarizeGoalPlanningRow(
    { ...row, targetMonth: "2026-06" },
    1,
    "2026-07",
  );

  assert.equal(summary.status, "needs_valid_inputs");
  assert.equal(summary.monthsUntilTarget, null);
  assert.match(
    summary.validationMessages.join(" "),
    /Target month cannot be before the current month/,
  );
});

test("charge inspector sample covers every current finding type", () => {
  const summary = summarizeChargeInspectorReview(chargeInspectorSampleReview);

  assert.equal(summary.reviewedTransactionCount, 18);
  assert.equal(summary.totalFindings, 4);
  assert.equal(summary.recurringCount, 1);
  assert.equal(summary.duplicateCount, 1);
  assert.equal(summary.bankFeeCount, 1);
  assert.equal(summary.priceIncreaseCount, 1);
  assert.equal(chargeInspectorSampleReview.spendingSummaryVersion, "sample_fixture");
  assert.deepEqual(
    chargeInspectorSampleReview.monthlySpendingSummary.map((month) => month.month),
    ["2026-03", "2026-04", "2026-05"],
  );
  assert.deepEqual(
    chargeInspectorSampleReview.findings.map((finding) => finding.type).sort(),
    Object.keys(chargeInspectorFindingTypeLabels).sort(),
  );
});

test("charge inspector sample CSV keeps the platform contract fixture shape", () => {
  const rows = chargeInspectorSampleCsv.split("\n");

  assert.equal(rows.length, 19);
  assert.match(rows[0], /Posting Date,Description,Amount/);
  assert.match(chargeInspectorSampleCsv, /Streamly Premium/);
  assert.match(chargeInspectorSampleCsv, /Market Street Coffee/);
  assert.match(chargeInspectorSampleCsv, /Monthly Service Fee/);
  assert.match(chargeInspectorSampleCsv, /FitPlan App/);
});

test("charge inspector CSV request parser accepts bounded text only", () => {
  assert.equal(
    parseChargeInspectorCsvRequestBody({ csvText: "header\nvalue" }),
    "header\nvalue",
  );

  assert.throws(
    () => parseChargeInspectorCsvRequestBody(null),
    /must be an object/,
  );
  assert.throws(
    () => parseChargeInspectorCsvRequestBody({ csvText: "" }),
    /must not be blank/,
  );
  assert.throws(
    () =>
      parseChargeInspectorCsvRequestBody({
        csvText: "a".repeat(CHARGE_INSPECTOR_CSV_TEXT_MAX_LENGTH + 1),
      }),
    /250,000 characters or fewer/,
  );
});

test("charge inspector CSV request body limit rejects oversized JSON before parsing", () => {
  assert.equal(chargeInspectorCsvRequestBodyExceedsLimit(null), false);
  assert.equal(chargeInspectorCsvRequestBodyExceedsLimit("not-a-number"), false);
  assert.equal(
    chargeInspectorCsvRequestBodyExceedsLimit(
      String(CHARGE_INSPECTOR_CSV_REQUEST_MAX_LENGTH),
    ),
    false,
  );
  assert.equal(
    chargeInspectorCsvRequestBodyExceedsLimit(
      String(CHARGE_INSPECTOR_CSV_REQUEST_MAX_LENGTH + 1),
    ),
    true,
  );
});

test("charge inspector platform parser accepts the review contract", () => {
  const parsed = parseChargeInspectorReviewResponse(
    chargeInspectorPlatformPayload(),
  );

  assert.equal(parsed.schema_version, "charge_inspector_review_v0");
  assert.equal(parsed.source, "sample_csv");
  assert.equal(parsed.reviewed_transaction_count, 18);
  assert.equal(parsed.spending_summary_version, "monthly_spending_summary_v0");
  assert.equal(parsed.category_summary_version, "transaction_category_rules_v0");
  assert.equal(
    parsed.category_monthly_summary_version,
    "transaction_category_monthly_summary_v0",
  );
  assert.equal(
    parsed.category_monthly_budget_comparison_version,
    "transaction_category_monthly_budget_comparison_v1",
  );
  assert.equal(parsed.monthly_spending_summary[2].debit_total, "1889.90");
  assert.equal(parsed.category_summary[2].category, "groceries");
  assert.equal(parsed.category_summary[2].debit_total, "130.56");
  assert.equal(parsed.category_monthly_summary[2].month, "2026-05");
  assert.equal(parsed.category_monthly_summary[2].category, "groceries");
  assert.equal(parsed.category_monthly_summary[2].debit_total, "130.56");
  assert.equal(
    parsed.category_monthly_budget_comparison[0].status,
    "over_target",
  );
  assert.equal(
    parsed.category_monthly_budget_comparison[0].variance_amount,
    "30.56",
  );
  assert.equal(
    parsed.category_monthly_budget_comparison[0].debit_transaction_count,
    2,
  );
  assert.deepEqual(
    parsed.category_summary[2].evidence_rows.map((row) => row.merchant_name),
    ["Corner Grocer", "Corner Grocer"],
  );
  assert.equal(
    parsed.findings.recurring_charges[0].merchant_name,
    "Streamly Premium",
  );
  assert.equal(parsed.evidence_transactions.length, 8);
});

test("charge inspector platform parser tolerates missing monthly comparison row counts", () => {
  const payload = chargeInspectorPlatformPayload();
  delete payload.category_monthly_budget_comparison[0].debit_transaction_count;

  const parsed = parseChargeInspectorReviewResponse(payload);
  const review = mapPlatformChargeInspectorReview(parsed);

  assert.equal(
    parsed.category_monthly_budget_comparison[0].debit_transaction_count,
    0,
  );
  assert.equal(
    review.categoryMonthlyBudgetComparison[0].debitTransactionCount,
    0,
  );
});

test("charge inspector platform parser falls back without monthly summary fields", () => {
  const payload = chargeInspectorPlatformPayload();
  delete payload.spending_summary_version;
  delete payload.monthly_spending_summary;
  delete payload.category_summary_version;
  delete payload.category_summary;
  delete payload.category_monthly_summary_version;
  delete payload.category_monthly_summary;
  delete payload.category_monthly_budget_comparison_version;
  delete payload.category_monthly_budget_comparison;
  delete payload.category_budget_automation_readiness_version;
  delete payload.category_budget_automation_readiness;
  delete payload.category_budget_automation_judgment_version;
  delete payload.category_budget_automation_judgment;

  const parsed = parseChargeInspectorReviewResponse(payload);
  const review = mapPlatformChargeInspectorReview(parsed);

  assert.equal(parsed.spending_summary_version, "not_returned");
  assert.deepEqual(parsed.monthly_spending_summary, []);
  assert.equal(parsed.category_summary_version, "not_returned");
  assert.deepEqual(parsed.category_summary, []);
  assert.equal(parsed.category_monthly_summary_version, "not_returned");
  assert.deepEqual(parsed.category_monthly_summary, []);
  assert.equal(
    parsed.category_monthly_budget_comparison_version,
    "not_returned",
  );
  assert.deepEqual(parsed.category_monthly_budget_comparison, []);
  assert.equal(
    parsed.category_budget_automation_readiness_version,
    "not_returned",
  );
  assert.deepEqual(parsed.category_budget_automation_readiness, []);
  assert.equal(
    parsed.category_budget_automation_judgment_version,
    "not_returned",
  );
  assert.deepEqual(parsed.category_budget_automation_judgment, []);
  assert.equal(review.spendingSummaryVersion, "not_returned");
  assert.deepEqual(review.monthlySpendingSummary, []);
  assert.equal(review.categorySummaryVersion, "not_returned");
  assert.deepEqual(review.categorySummary, []);
  assert.equal(review.categoryMonthlySummaryVersion, "not_returned");
  assert.deepEqual(review.categoryMonthlySummary, []);
  assert.equal(review.categoryMonthlyBudgetComparisonVersion, "not_returned");
  assert.deepEqual(review.categoryMonthlyBudgetComparison, []);
  assert.equal(review.categoryBudgetAutomationReadinessVersion, "not_returned");
  assert.deepEqual(review.categoryBudgetAutomationReadiness, []);
  assert.equal(review.categoryBudgetAutomationJudgmentVersion, "not_returned");
  assert.deepEqual(review.categoryBudgetAutomationJudgment, []);
});

test("charge inspector platform mapper builds UI findings from contract evidence", () => {
  const review = mapPlatformChargeInspectorReview(
    parseChargeInspectorReviewResponse(chargeInspectorPlatformPayload()),
  );
  const summary = summarizeChargeInspectorReview(review);

  assert.equal(review.dataMode, "platform-sample");
  assert.equal(review.sourceLabel, "Platform sample CSV review");
  assert.deepEqual(summary, {
    totalFindings: 4,
    reviewedTransactionCount: 18,
    recurringCount: 1,
    duplicateCount: 1,
    bankFeeCount: 1,
    priceIncreaseCount: 1,
  });
  assert.deepEqual(
    review.findings.map((finding) => finding.type).sort(),
    Object.keys(chargeInspectorFindingTypeLabels).sort(),
  );
  assert.deepEqual(
    review.findings.find((finding) => finding.type === "price_increase")
      .evidenceRows.map((row) => row.postedDate),
    ["2026-04-21", "2026-05-21"],
  );
  assert.equal(review.spendingSummaryVersion, "monthly_spending_summary_v0");
  assert.equal(review.monthlySpendingSummary[2].debitTotalLabel, "$1,889.90");
  assert.equal(
    review.monthlySpendingSummary[2].netCashFlowLabel,
    "$4,510.10 net inflow",
  );
  assert.equal(review.categorySummaryVersion, "transaction_category_rules_v0");
  assert.equal(review.categorySummary[0].label, "Income");
  assert.equal(review.categorySummary[0].creditTotalLabel, "$6,400.00");
  assert.equal(review.categorySummary[2].label, "Groceries");
  assert.equal(review.categorySummary[2].debitTotalLabel, "$130.56");
  assert.equal(
    review.categoryMonthlySummaryVersion,
    "transaction_category_monthly_summary_v0",
  );
  assert.equal(review.categoryMonthlySummary[2].month, "2026-05");
  assert.equal(review.categoryMonthlySummary[2].label, "Groceries");
  assert.equal(review.categoryMonthlySummary[2].debitTotalLabel, "$130.56");
  assert.equal(
    review.categoryMonthlyBudgetComparisonVersion,
    "transaction_category_monthly_budget_comparison_v1",
  );
  assert.equal(
    review.categoryBudgetAutomationReadinessVersion,
    "transaction_category_budget_automation_readiness_v0",
  );
  assert.equal(
    review.categoryBudgetAutomationJudgmentVersion,
    "transaction_category_budget_automation_judgment_v0",
  );
  assert.equal(review.categoryMonthlyBudgetComparison[0].label, "Groceries");
  assert.equal(
    review.categoryMonthlyBudgetComparison[0].varianceAmountLabel,
    "$30.56 over",
  );
  assert.equal(review.categoryMonthlyBudgetComparison[0].status, "over-target");
  assert.equal(review.categoryMonthlyBudgetComparison[0].debitTransactionCount, 2);
  assert.equal(
    review.categoryBudgetAutomationReadiness[0].readinessStatus,
    "needs-review",
  );
  assert.equal(
    review.categoryBudgetAutomationReadiness[0].reasonCode,
    "over-target",
  );
  assert.equal(
    review.categoryBudgetAutomationReadiness[1].readinessStatus,
    "insufficient-context",
  );
  assert.equal(
    review.categoryBudgetAutomationJudgment[0].judgmentStatus,
    "needs-human-review",
  );
  assert.equal(
    review.categoryBudgetAutomationJudgment[0].reasonCode,
    "over-target-review-required",
  );
  assert.equal(
    review.categoryBudgetAutomationJudgment[0].judgmentScope,
    "boundary-only",
  );
  assert.equal(
    review.categoryBudgetAutomationJudgment[1].judgmentStatus,
    "not-enough-context",
  );
  assert.deepEqual(review.categorySummary[2].ruleIds, [
    "category.groceries.grocer_text.v0",
  ]);
  assert.deepEqual(
    review.categorySummary[2].evidenceRows.map((row) => [
      row.merchantName,
      row.amountLabel,
      row.directionLabel,
      row.ruleId,
    ]),
    [
      [
        "Corner Grocer",
        "$76.44",
        "Debit",
        "category.groceries.grocer_text.v0",
      ],
      [
        "Corner Grocer",
        "$54.12",
        "Debit",
        "category.groceries.grocer_text.v0",
      ],
    ],
  );
  assert.match(review.limitations.join(" "), /charge_inspector_review_v0/);
});

test("charge inspector platform mapper rejects unsupported automation scope", () => {
  const payload = chargeInspectorPlatformPayload();
  payload.category_budget_automation_readiness[0].automation_scope = "execute";

  assert.throws(
    () =>
      mapPlatformChargeInspectorReview(
        parseChargeInspectorReviewResponse(payload),
      ),
    /Unsupported automation scope: execute/,
  );
});

test("charge inspector platform mapper rejects unsupported automation judgment scope", () => {
  const payload = chargeInspectorPlatformPayload();
  payload.category_budget_automation_judgment[0].judgment_scope = "execute";

  assert.throws(
    () =>
      mapPlatformChargeInspectorReview(
        parseChargeInspectorReviewResponse(payload),
      ),
    /Unsupported automation judgment scope: execute/,
  );
});

test("charge inspector monthly cash flow label keeps zero neutral", () => {
  const payload = chargeInspectorPlatformPayload();
  payload.monthly_spending_summary = [
    monthlySummaryPayload("2026-06", "100.00", "100.00", "0", 2, 1, 1),
  ];

  const review = mapPlatformChargeInspectorReview(
    parseChargeInspectorReviewResponse(payload),
  );

  assert.equal(review.monthlySpendingSummary[0].netCashFlowLabel, "$0.00 net");
});

test("charge inspector maps linked-account and mixed platform sources", () => {
  for (const { source, mode, label } of [
    {
      source: "linked_account",
      mode: "linked-account",
      label: "Platform linked transaction review",
    },
    {
      source: "mixed",
      mode: "mixed",
      label: "Platform mixed transaction review",
    },
  ]) {
    const payload = chargeInspectorPlatformPayload();
    payload.source = source;

    const review = mapPlatformChargeInspectorReview(
      parseChargeInspectorReviewResponse(payload),
    );

    assert.equal(review.dataMode, mode);
    assert.equal(review.sourceLabel, label);
  }
});

test("charge inspector recurring explanation uses the platform cadence", () => {
  const payload = chargeInspectorPlatformPayload();
  payload.findings.recurring_charges[0].cadence = "weekly";

  const review = mapPlatformChargeInspectorReview(
    parseChargeInspectorReviewResponse(payload),
  );
  const recurring = review.findings.find(
    (finding) => finding.type === "recurring_charge",
  );

  assert.equal(recurring.cadenceLabel, "Weekly");
  assert.match(recurring.explanation, /3 weekly rows/);
  assert.doesNotMatch(recurring.explanation, /monthly debit rows/);
});

test("charge inspector findings can be hidden without mutating the review", () => {
  const firstFindingId = chargeInspectorSampleReview.findings[0].id;
  const visibleFindings = visibleChargeInspectorFindings(
    chargeInspectorSampleReview,
    [firstFindingId],
  );

  assert.equal(visibleFindings.length, 3);
  assert.equal(
    visibleFindings.some((finding) => finding.id === firstFindingId),
    false,
  );
  assert.equal(chargeInspectorSampleReview.findings.length, 4);
});

test("charge inspector builds recurring payment review items from visible findings", () => {
  const items = recurringPaymentReviewItems(chargeInspectorSampleReview.findings);

  assert.equal(items.length, 1);
  assert.deepEqual(items[0], {
    id: "sample-recurring-streaming",
    merchantName: "Streamly Premium",
    amountLabel: "$15.99",
    cadenceLabel: "Monthly pattern",
    evidenceCountLabel: "3 matched rows",
    lastSeenLabel: "May 9, 2026",
    reviewWindowLabel: "Around Jun 9, 2026",
    limitations: [
      "A recurring pattern does not mean the charge is unwanted.",
      "The sample does not verify contract terms, household use, or merchant category.",
    ],
  });
});

test("charge inspector recurring payment review sorts by date, not label text", () => {
  const [recurringFinding] = chargeInspectorSampleReview.findings;
  const findings = [
    recurringFindingWithLastSeen(recurringFinding, "recurring-apr", "2026-04-15"),
    recurringFindingWithLastSeen(recurringFinding, "recurring-dec", "2025-12-01"),
    recurringFindingWithLastSeen(recurringFinding, "recurring-feb", "2026-02-28"),
  ];

  assert.deepEqual(
    recurringPaymentReviewItems(findings).map((item) => item.id),
    ["recurring-dec", "recurring-feb", "recurring-apr"],
  );
});

test("charge inspector recurring payment review follows hidden finding state", () => {
  const firstFindingId = chargeInspectorSampleReview.findings[0].id;
  const visibleFindings = visibleChargeInspectorFindings(
    chargeInspectorSampleReview,
    [firstFindingId],
  );

  assert.equal(recurringPaymentReviewItems(visibleFindings).length, 0);
});

function recurringFindingWithLastSeen(finding, id, postedDate) {
  return {
    ...finding,
    id,
    evidenceRows: [
      {
        ...finding.evidenceRows[0],
        id: `${id}-evidence`,
        postedDate,
      },
    ],
  };
}

test("charge inspector empty review keeps a safe no-finding state", () => {
  const summary = summarizeChargeInspectorReview(chargeInspectorEmptyReview);

  assert.equal(isChargeInspectorEmpty(chargeInspectorEmptyReview), true);
  assert.deepEqual(summary, {
    totalFindings: 0,
    reviewedTransactionCount: 0,
    recurringCount: 0,
    duplicateCount: 0,
    bankFeeCount: 0,
    priceIncreaseCount: 0,
  });
  assert.deepEqual(
    visibleChargeInspectorFindings(chargeInspectorSampleReview, [
      ...chargeInspectorSampleReview.findings.map((finding) => finding.id),
    ]),
    [],
  );
  assert.match(
    chargeInspectorEmptyReview.emptyState.body,
    /No transaction upload/,
  );
  assert.match(
    chargeInspectorEmptyReview.emptyState.checks.join(" "),
    /does not prove every transaction is correct/,
  );
});

test("charge inspector fallback review is distinct from a no-finding review", () => {
  const summary = summarizeChargeInspectorReview(chargeInspectorFallbackReview);

  assert.equal(isChargeInspectorEmpty(chargeInspectorFallbackReview), true);
  assert.equal(chargeInspectorFallbackReview.dataMode, "fallback");
  assert.equal(
    chargeInspectorFallbackReview.sourceLabel,
    "Charge Inspector temporarily unavailable",
  );
  assert.deepEqual(summary, {
    totalFindings: 0,
    reviewedTransactionCount: 0,
    recurringCount: 0,
    duplicateCount: 0,
    bankFeeCount: 0,
    priceIncreaseCount: 0,
  });
  assert.match(
    chargeInspectorFallbackReview.emptyState.body,
    /unavailable for this session/,
  );
  assert.match(
    chargeInspectorFallbackReview.emptyState.checks.join(" "),
    /does not mean a transaction review found no issues/,
  );
});

test("charge inspector copy stays inside review-only boundaries", () => {
  const copy = [
    chargeInspectorSampleReview.sourceLabel,
    ...chargeInspectorSampleReview.limitations,
    chargeInspectorSampleReview.emptyState.title,
    chargeInspectorSampleReview.emptyState.body,
    ...chargeInspectorSampleReview.emptyState.checks,
    chargeInspectorFallbackReview.sourceLabel,
    ...chargeInspectorFallbackReview.limitations,
    chargeInspectorFallbackReview.emptyState.title,
    chargeInspectorFallbackReview.emptyState.body,
    ...chargeInspectorFallbackReview.emptyState.checks,
    ...chargeInspectorSampleReview.findings.flatMap((finding) => [
      finding.title,
      finding.summary,
      finding.explanation,
      ...finding.limitations,
      ...finding.suggestedReviewSteps,
      ...finding.evidenceRows.flatMap((row) => [
        row.merchantName,
        row.detail,
      ]),
    ]),
  ].join(" ");

  assert.match(copy, /review prompts/);
  assert.match(copy, /No account connection/);
  assert.doesNotMatch(
    copy,
    /\b(definitely|wasteful|cancel|dispute|guaranteed|you should)\b/i,
  );
});

test("report review screen hash mapping preserves legacy section links", () => {
  assert.deepEqual(
    reportReviewScreens.map((screen) => screen.id),
    ["snapshot", "goals", "report", "charge-inspector", "education"],
  );
  assert.equal(reportReviewScreenFromHash("#snapshot"), "snapshot");
  assert.equal(reportReviewScreenFromHash("#goals"), "goals");
  assert.equal(reportReviewScreenFromHash("#inputs"), "snapshot");
  assert.equal(reportReviewScreenFromHash("#manual-input"), "snapshot");
  assert.equal(reportReviewScreenFromHash("#findings"), "report");
  assert.equal(reportReviewScreenFromHash("#portfolio"), "snapshot");
  assert.equal(reportReviewScreenFromHash("#saving-goal-draft"), "goals");
  assert.equal(reportReviewScreenFromHash("#charge-inspector"), "charge-inspector");
  assert.equal(reportReviewScreenFromHash("#evidence"), "education");
  assert.equal(reportReviewScreenFromHash("#unknown"), "report");
});

test("report review keyboard navigation follows the tab order", () => {
  assert.equal(
    reportReviewScreenFromKeyboard("report", "ArrowRight"),
    "charge-inspector",
  );
  assert.equal(reportReviewScreenFromKeyboard("report", "ArrowLeft"), "goals");
  assert.equal(reportReviewScreenFromKeyboard("goals", "ArrowLeft"), "snapshot");
  assert.equal(
    reportReviewScreenFromKeyboard("education", "ArrowRight"),
    "snapshot",
  );
  assert.equal(
    reportReviewScreenFromKeyboard("snapshot", "ArrowLeft"),
    "education",
  );
  assert.equal(reportReviewScreenFromKeyboard("charge-inspector", "Home"), "snapshot");
  assert.equal(
    reportReviewScreenFromKeyboard("charge-inspector", "End"),
    "education",
  );
  assert.equal(reportReviewScreenFromKeyboard("charge-inspector", "Tab"), null);
});

test("report review sample exposes charge inspector review data", () => {
  assert.equal(
    reportReviewSample.chargeInspector.sourceLabel,
    "Sample CSV review fixture",
  );
  assert.equal(reportReviewSample.chargeInspector.findings.length, 4);
  assert.deepEqual(
    reportReviewSample.dataSources.map((source) => [
      source.id,
      source.kind,
      source.status,
    ]),
    [
      ["manual-profile", "manual", "active"],
      ["csv-transactions", "csv", "available"],
      ["linked-accounts", "linked-account", "future"],
    ],
  );
  assert.deepEqual(
    reportReviewSample.sourceReconciliation.accountMatching.map((rule) => [
      rule.id,
      rule.confidence,
    ]),
    [
      ["account-high-confidence", "high"],
      ["account-medium-confidence", "medium"],
      ["account-low-confidence", "low"],
    ],
  );
  assert.deepEqual(
    reportReviewSample.sourceReconciliation.transactionMatching.map((rule) => [
      rule.id,
      rule.confidence,
    ]),
    [
      ["transaction-high-confidence", "high"],
      ["transaction-medium-confidence", "medium"],
      ["transaction-low-confidence", "low"],
    ],
  );
});

test("manual profile presets expose the expected review scenarios", () => {
  assert.deepEqual(
    MANUAL_PROFILE_PRESETS.map((preset) => preset.id),
    [
      "sample",
      "low_cash_guidance",
      "three_month_boundary",
      "required_only",
    ],
  );
});

test("manual profile field requirements identify required and optional inputs", () => {
  const requirements = Object.entries(MANUAL_PROFILE_FIELD_REQUIREMENTS);
  const expectedRequiredFields = [
    ...REQUIRED_DECIMAL_FIELDS,
    ...REQUIRED_INTEGER_FIELDS,
    ...REQUIRED_SELECT_FIELDS,
  ].sort();
  const expectedOptionalFields = [
    ...OPTIONAL_DECIMAL_FIELDS,
    ...OPTIONAL_POSITIVE_DECIMAL_FIELDS,
    ...OPTIONAL_INTEGER_FIELDS,
  ].sort();
  const scalarFields = Object.keys(defaultManualProfileValues())
    .filter((field) => field !== "assets" && field !== "debts")
    .sort();
  const requiredFields = requirements
    .filter(([, requirement]) => requirement === "required")
    .map(([field]) => field)
    .sort();
  const optionalFields = requirements
    .filter(([, requirement]) => requirement === "optional")
    .map(([field]) => field)
    .sort();
  const labeledFields = requirements.map(([field]) => field).sort();

  assert.deepEqual(requiredFields, expectedRequiredFields);
  assert.deepEqual(optionalFields, expectedOptionalFields);
  assert.deepEqual(labeledFields, scalarFields);
});

test("report review validation checklist covers every preset", () => {
  assert.deepEqual(
    REPORT_REVIEW_VALIDATION_CHECKLIST.map((item) => item.presetId),
    MANUAL_PROFILE_PRESETS.map((preset) => preset.id),
  );
});

test("report review validation checklist includes human-verifiable cases", () => {
  for (const item of REPORT_REVIEW_VALIDATION_CHECKLIST) {
    assert.ok(item.focus.length > 0);
    assert.ok(item.inputChecks.length >= 2);
    assert.ok(item.expectedResults.length >= 2);
    assert.ok(item.boundary.length > 0);
  }

  const requiredOnlyCase = REPORT_REVIEW_VALIDATION_CHECKLIST.find(
    (item) => item.presetId === "required_only",
  );

  assert.ok(
    requiredOnlyCase.expectedResults.some((result) =>
      result.includes(
        "omits optional income, dependents, and user target months",
      ),
    ),
  );
  assert.ok(
    requiredOnlyCase.inputChecks.some((check) =>
      check.includes("Fields labeled Optional"),
    ),
  );
  assert.ok(
    requiredOnlyCase.boundary.includes("Missing information must stay missing"),
  );
});

test("manual profile presets return independent value copies", () => {
  const first = manualProfilePresetValues("sample");
  first.assets[0].balance = "1.00";
  first.debts[0].name = "Changed";

  const second = manualProfilePresetValues("sample");

  assert.equal(second.assets[0].balance, "12000.00");
  assert.equal(second.debts[0].name, "Student loan");
});

test("low-cash preset maps a guidance-trace review input", () => {
  const values = manualProfilePresetValues("low_cash_guidance");

  const request = buildManualProfileRequest(values);

  assert.equal(request.profile.assets.cash, "1500.00");
  assert.equal(request.userTargetMonths, "3");
});

test("three-month boundary preset maps exactly three months of required outflows", () => {
  const values = manualProfilePresetValues("three_month_boundary");

  const request = buildManualProfileRequest(values);
  const monthlyDebtPayments = request.profile.debts.reduce(
    (total, debt) => total + Number(debt.monthly_payment),
    0,
  );
  const monthlyRequiredOutflows =
    Number(request.profile.monthly_housing_cost) +
    Number(request.profile.monthly_non_housing_essential_expenses) +
    monthlyDebtPayments;

  assert.equal(request.profile.monthly_housing_cost, "1800.00");
  assert.equal(request.profile.monthly_non_housing_essential_expenses, "900.00");
  assert.deepEqual(
    request.profile.debts.map((debt) => debt.monthly_payment),
    ["250.00", "420.00", "100.00"],
  );
  assert.equal(
    request.profile.assets.cash,
    (monthlyRequiredOutflows * 3).toFixed(2),
  );
  assert.equal(request.userTargetMonths, "3");
});

test("required-only preset omits optional profile context", () => {
  const values = manualProfilePresetValues("required_only");

  const request = buildManualProfileRequest(values);

  assert.equal("gross_annual_income" in request.profile, false);
  assert.equal("dependents" in request.profile, false);
  assert.deepEqual(request.profile.debts, []);
  assert.equal(request.profile.income_pattern, "mostly_stable");
  assert.equal(request.profile.job_stability, "high");
  assert.equal(request.profile.monthly_investment_contribution, "500.00");
  assert.equal(request.profile.assets.cash, "12000.00");
  assert.equal(request.profile.assets.retirement, "45000.00");
  assert.equal(request.userTargetMonths, undefined);
});

test("manual profile aggregates asset rows into platform asset buckets", () => {
  const values = defaultManualProfileValues();
  values.assets = [
    {
      id: "checking",
      name: "Checking",
      category: "cash",
      balance: "1500.25",
    },
    {
      id: "savings",
      name: "Savings",
      category: "cash",
      balance: "2499.75",
    },
    {
      id: "retirement",
      name: "401(k)",
      category: "retirement",
      balance: "10000",
    },
    {
      id: "brokerage",
      name: "Brokerage",
      category: "brokerage",
      balance: "500",
    },
    {
      id: "other",
      name: "Other asset",
      category: "other",
      balance: "75.50",
    },
  ];
  values.debts = [];

  const request = buildManualProfileRequest(values);

  assert.deepEqual(request.profile.assets, {
    cash: "4000.00",
    retirement: "10000.00",
    brokerage: "500.00",
    other: "75.50",
  });
  assert.deepEqual(request.profile.debts, []);
});

test("manual profile requires at least one asset row", () => {
  const values = defaultManualProfileValues();
  values.assets = [];

  assert.throws(
    () => buildManualProfileRequest(values),
    ManualProfileValidationError,
  );
});

test("manual profile maps multiple liabilities and omits zero-balance rows", () => {
  const values = defaultManualProfileValues();
  values.debts = [
    {
      id: "credit-card",
      name: "Rewards card",
      debtType: "credit_card",
      balance: "1200.00",
      annualInterestRate: "24.99",
      monthlyPayment: "80.00",
      interestTaxAdvantaged: false,
    },
    {
      id: "student-loan",
      name: "Federal student loan",
      debtType: "student_loan",
      balance: "18000.00",
      annualInterestRate: "5.25",
      monthlyPayment: "250.00",
      interestTaxAdvantaged: true,
    },
    {
      id: "unused-line",
      name: "Unused line",
      debtType: "other",
      balance: "0",
      annualInterestRate: "0",
      monthlyPayment: "0",
      interestTaxAdvantaged: false,
    },
  ];

  const request = buildManualProfileRequest(values);

  assert.deepEqual(request.profile.debts, [
    {
      name: "Rewards card",
      debt_type: "credit_card",
      balance: "1200.00",
      annual_interest_rate: "24.99",
      monthly_payment: "80.00",
      interest_tax_advantaged: false,
    },
    {
      name: "Federal student loan",
      debt_type: "student_loan",
      balance: "18000.00",
      annual_interest_rate: "5.25",
      monthly_payment: "250.00",
      interest_tax_advantaged: true,
    },
  ]);
});

test("manual profile rejects zero-balance liability with APR or payment", () => {
  const values = defaultManualProfileValues();
  values.debts = [
    {
      id: "stale-debt",
      name: "Stale debt",
      debtType: "other",
      balance: "0",
      annualInterestRate: "7.5",
      monthlyPayment: "0",
      interestTaxAdvantaged: false,
    },
  ];

  assert.throws(
    () => buildManualProfileRequest(values),
    ManualProfileValidationError,
  );
});

test("manual profile carries positive user target months", () => {
  const values = defaultManualProfileValues();
  values.userTargetMonths = "2.5";

  const request = buildManualProfileRequest(values);

  assert.equal(request.userTargetMonths, "2.5");
});

test("manual profile rejects non-positive and partial user target months", () => {
  for (const value of ["0", "-1", "2abc"]) {
    const values = defaultManualProfileValues();
    values.userTargetMonths = value;

    assert.throws(
      () => buildManualProfileRequest(values),
      ManualProfileValidationError,
    );
  }
});

test("workspace parser tolerates omitted optional EFT trace fields", () => {
  const parsed = parseWorkspaceReportResponse(workspacePayload());

  assert.equal(
    parsed.workspace_snapshot.inputs.emergency_fund_target.user_target_months,
    null,
  );
  assert.equal(parsed.workspace_snapshot.eft_result.model_version, "");
  assert.equal(parsed.workspace_snapshot.eft_result.user_selected_target, null);
  assert.deepEqual(parsed.workspace_snapshot.eft_result.evidence_source_ids, []);
  assert.deepEqual(parsed.workspace_snapshot.eft_result.guidance_rules, []);
  assert.equal(parsed.workspace_snapshot.eft_result.guidance_rule_version, "");
});

test("workspace parser accepts matched guidance rule trace", () => {
  const payload = workspacePayload({
    eftResult: {
      guidance_rules: [guidanceRulePayload()],
    },
  });

  const parsed = parseWorkspaceReportResponse(payload);

  assert.deepEqual(parsed.workspace_snapshot.eft_result.guidance_rules, [
    guidanceRulePayload(),
  ]);
});

test("workspace parser accepts user-selected target comparison", () => {
  const payload = workspacePayload({
    emergencyFundTarget: {
      user_target_months: "2",
    },
    eftResult: {
      model_version: "emergency_fund_target_v0",
      evidence_source_ids: ["cfpb_emergency_fund_guide"],
      guidance_rule_version: "guidance_rule_registry_v0",
      user_selected_target: {
        target_months: "2.00",
        target_amount: "6000.00",
        gap_amount: "1000.00",
        alignment_to_baseline: "below_baseline",
      },
    },
  });

  const parsed = parseWorkspaceReportResponse(payload);

  assert.equal(
    parsed.workspace_snapshot.inputs.emergency_fund_target.user_target_months,
    "2",
  );
  assert.deepEqual(parsed.workspace_snapshot.eft_result.user_selected_target, {
    target_months: "2.00",
    target_amount: "6000.00",
    gap_amount: "1000.00",
    alignment_to_baseline: "below_baseline",
  });
});

test("workspace parser rejects malformed user-selected target values", () => {
  const payload = workspacePayload({
    eftResult: {
      user_selected_target: {
        target_months: { value: "2.00" },
        target_amount: "6000.00",
        gap_amount: "1000.00",
        alignment_to_baseline: "below_baseline",
      },
    },
  });

  assert.throws(
    () => parseWorkspaceReportResponse(payload),
    /user_selected_target\.target_months must be a string, number, or null/,
  );
});

test("education topic resolver returns registered display metadata", () => {
  const topic = resolveEducationTopic("emergency_fund.target_range");

  assert.deepEqual(topic, {
    id: "emergency_fund.target_range",
    title: "Emergency fund target range",
    concept: "Emergency fund target ranges and liquid cash context.",
    status: "pending",
  });
});

test("education topic resolver falls back for unknown platform topics", () => {
  const topic = resolveEducationTopic("future_topic.sample_case");

  assert.equal(topic.id, "future_topic.sample_case");
  assert.equal(topic.title, "Future Topic Sample Case");
  assert.equal(topic.status, "pending");
  assert.match(topic.concept, /does not have landing-side display metadata/);
});

test("education topic anchors preserve stable topic ids", () => {
  assert.equal(
    educationTopicAnchor("debt.interest_cost"),
    "education-topic-debt.interest_cost",
  );
});

test("uniqueTopicIds deduplicates topics while preserving first-seen order", () => {
  assert.deepEqual(
    uniqueTopicIds([
      ["debt.interest_cost", "cash_flow.monthly_deficit"],
      ["debt.interest_cost", "emergency_fund.target_range"],
      [],
      ["cash_flow.monthly_deficit", "net_worth.assets_and_liabilities"],
    ]),
    [
      "debt.interest_cost",
      "cash_flow.monthly_deficit",
      "emergency_fund.target_range",
      "net_worth.assets_and_liabilities",
    ],
  );
});

test("platform report mapper builds user-selected target comparison", () => {
  const mapped = mapWorkspacePayload({
    emergencyFundTarget: {
      user_target_months: "2",
    },
    eftResult: {
      model_version: "emergency_fund_target_v0",
      evidence_source_ids: ["cfpb_emergency_fund_guide"],
      guidance_rules: [guidanceRulePayload()],
      guidance_rule_version: "guidance_rule_registry_v0",
      assumptions: ["Baseline assumption."],
      limitations: ["Baseline limitation."],
      user_selected_target: {
        target_months: "2.00",
        target_amount: "6000.00",
        gap_amount: "1000.00",
        alignment_to_baseline: "below_baseline",
      },
    },
  });

  assert.equal(mapped.profileName, "Test profile");
  assert.equal(mapped.dataMode, "Test Platform API");
  assert.deepEqual(mapped.connectionNotice, {
    tone: "seed",
    message: "Loaded for mapper tests.",
  });
  assert.equal(mapped.chargeInspector.sourceLabel, "No transaction review source");
  assert.deepEqual(mapped.chargeInspector.findings, []);
  assert.deepEqual(
    mapped.dataSources.map((source) => [
      source.id,
      source.kind,
      source.status,
    ]),
    [
      ["manual-profile", "sample", "active"],
      ["csv-transactions", "csv", "empty"],
      ["linked-accounts", "linked-account", "future"],
    ],
  );
  assert.match(
    mapped.sourceReconciliation.summary,
    /account-level sources/,
  );
  assert.match(
    mapped.sourceReconciliation.resolution
      .map((rule) => rule.value)
      .join(" "),
    /CSV as backfill/,
  );

  const decision = mapped.decisionReadiness;
  assert.deepEqual(decision.evidenceSourceIds, ["cfpb_emergency_fund_guide"]);
  assert.deepEqual(decision.guidanceRules, [
    {
      id: "eft.cash_below_lower_target_range",
      allowedPhrasing:
        "Your cash currently covers less than the lower end of a typical emergency-fund range.",
      trigger:
        "current_months_covered Less Than target_months_range.min_months",
      evidenceSourceIds: [
        "cfpb_emergency_fund_guide",
        "fdic_money_smart_your_savings",
      ],
      requiredGuards: [
        "monthly_essential_expenses",
        "cash_liquid_balance",
      ],
      ruleVersion: "guidance_rule_registry_v0",
    },
  ]);
  assert.equal(decision.guidanceRuleVersion, "guidance_rule_registry_v0");
  assert.equal(decision.modelVersion, "emergency_fund_target_v0");
  assert.deepEqual(decision.assumptions, ["Baseline assumption."]);
  assert.deepEqual(decision.limitations, ["Baseline limitation."]);
  assert.deepEqual(decision.userSelectedTarget, {
    targetMonths: "2 months",
    targetAmount: "$6,000",
    gapAmount: "$1,000",
    alignmentLabel: "Below baseline",
    alignmentDetail:
      "This preference is below the source-backed baseline range, so the baseline range remains visible for comparison.",
  });

  assert.deepEqual(
    itemById(decision.availableInputs, "user_target_months"),
    {
      id: "user_target_months",
      label: "User-selected target",
      value: "2 months",
      provenance: "user-entered",
      detail:
        "Optional preference target; it does not replace the baseline range.",
    },
  );
});

test("platform report data sources reflect linked and mixed transaction modes", () => {
  for (const { source, kind, label } of [
    {
      source: "linked_account",
      kind: "linked-account",
      label: "Platform linked transaction review",
    },
    {
      source: "mixed",
      kind: "mixed",
      label: "Platform mixed transaction review",
    },
  ]) {
    const chargeInspectorPayload = chargeInspectorPlatformPayload();
    chargeInspectorPayload.source = source;
    const chargeInspector = mapPlatformChargeInspectorReview(
      parseChargeInspectorReviewResponse(chargeInspectorPayload),
    );
    const mapped = mapPlatformReport(
      parseWorkspaceReportResponse(workspacePayload()),
      {
        profileName: "Test profile",
        dataMode: "Test Platform API",
        connectionMessage: "Loaded for mapper tests.",
        chargeInspector,
      },
    );
    const transactionSource = itemById(mapped.dataSources, "csv-transactions");

    assert.equal(transactionSource.kind, kind);
    assert.equal(transactionSource.label, label);
    assert.equal(transactionSource.status, "active");
  }
});

test("platform report mapper preserves missing EFT values", () => {
  const mapped = mapWorkspacePayload({
    emergencyFundTarget: {
      monthly_essential_expenses: null,
      cash_liquid_balance: null,
      income_pattern: null,
      user_target_months: undefined,
    },
    eftResult: {
      target_months_range: null,
      target_amount_range: null,
      current_months_covered: null,
      gap_amount_range: null,
      missing_context: [
        "monthly_essential_expenses",
        "cash_liquid_balance",
        "surprise_context",
      ],
    },
  });

  const decision = mapped.decisionReadiness;
  assert.equal(decision.guidanceRuleVersion, "Unknown");
  assert.equal(decision.modelVersion, "Unknown");
  assert.equal(decision.userSelectedTarget, null);
  assert.equal(
    decision.availableInputs.some((item) => item.id === "user_target_months"),
    false,
  );
  assert.deepEqual(
    itemById(decision.availableInputs, "emergency_eligible_cash"),
    {
      id: "emergency_eligible_cash",
      label: "Emergency-eligible cash",
      value: "Missing",
      provenance: "missing",
    },
  );
  assert.deepEqual(itemById(decision.availableInputs, "income_pattern"), {
    id: "income_pattern",
    label: "Income pattern",
    value: "Missing",
    provenance: "missing",
  });
  assert.deepEqual(itemById(decision.resultMetrics, "current_months_covered"), {
    id: "current_months_covered",
    label: "Current coverage",
    value: "Missing",
    provenance: "missing",
    detail: "Reported liquid cash divided by required monthly outflows.",
  });
  assert.deepEqual(itemById(decision.resultMetrics, "target_months_range"), {
    id: "target_months_range",
    label: "Baseline months",
    value: "Missing",
    provenance: "missing",
    detail: "Educational range; not a single required number.",
  });
  assert.deepEqual(itemById(decision.resultMetrics, "gap_amount_range"), {
    id: "gap_amount_range",
    label: "Gap range",
    value: "Missing",
    provenance: "missing",
    detail: "Target amount range minus reported liquid cash, floored at zero.",
  });
  assert.deepEqual(decision.missingInputs, [
    {
      id: "monthly_essential_expenses",
      label: "Monthly Essential Expenses",
      whyItMatters:
        "Required monthly outflows are needed to translate target months into dollars.",
    },
    {
      id: "cash_liquid_balance",
      label: "Cash Liquid Balance",
      whyItMatters:
        "Emergency-eligible cash is needed before the model can compare current reserves with a target.",
    },
    {
      id: "surprise_context",
      label: "Surprise Context",
      whyItMatters:
        "This context is preserved as missing instead of being converted into a zero-dollar assumption.",
    },
  ]);
});

test("platform report mapper falls back for unknown user-target alignment", () => {
  const mapped = mapWorkspacePayload({
    emergencyFundTarget: {
      user_target_months: "7",
    },
    eftResult: {
      user_selected_target: {
        target_months: "7.00",
        target_amount: "21000.00",
        gap_amount: "16000.00",
        alignment_to_baseline: "custom_case",
      },
    },
  });

  assert.deepEqual(mapped.decisionReadiness.userSelectedTarget, {
    targetMonths: "7 months",
    targetAmount: "$21,000",
    gapAmount: "$16,000",
    alignmentLabel: "Custom Case",
    alignmentDetail:
      "This preference target is calculated separately from the source-backed baseline range.",
  });
});

test("platform report mapper summarizes cash flow and completeness labels", () => {
  const mapped = mapWorkspacePayload({
    report: {
      cash_flow: {
        monthly_surplus_after_investing: "-125.40",
      },
      data_completeness: {
        status: "partial",
        explanation: "Some optional context is unavailable.",
        missing_context: ["gross_annual_income"],
        potentially_unmeasured_categories: ["insurance_gap"],
      },
    },
  });

  const monthlyCashFlow = itemById(mapped.summaryMetrics, "monthly_cash_flow");
  assert.equal(monthlyCashFlow.value, "$125 short");
  assert.equal(
    monthlyCashFlow.detail,
    "After living expenses, debt payments, and contributions.",
  );
  assert.equal(monthlyCashFlow.provenance, "calculated");
  assert.equal(
    itemById(mapped.summaryMetrics, "data_completeness").value,
    "Partial",
  );
  assert.equal(
    itemById(mapped.summaryMetrics, "data_completeness").provenance,
    "missing",
  );
  assert.deepEqual(mapped.dataCompleteness, {
    status: "Partial",
    explanation: "Some optional context is unavailable.",
    uncertainty: [],
    missingContext: ["Gross Annual Income"],
    potentiallyUnmeasuredCategories: ["Insurance Gap"],
  });
});

test("platform report mapper maps portfolio totals and provenance", () => {
  const mapped = mapWorkspacePayload({
    report: {
      net_worth: {
        gross_assets: "9500.00",
        total_liabilities: "1500.00",
        net_worth: "8000.00",
        liquid_net_worth: "5000.00",
      },
    },
    assets: [
      {
        asset_id: "checking",
        name: "Checking",
        category: "cash",
        balance: "3500.00",
        liquidity: "liquid",
        provenance: "user_entered",
        emergency_fund_eligible: true,
      },
      {
        asset_id: "brokerage",
        name: "Brokerage",
        category: "taxable_brokerage",
        balance: "6000.00",
        liquidity: "market_exposed",
        provenance: "reference_data",
        emergency_fund_eligible: false,
      },
    ],
    liabilities: [
      {
        liability_id: "credit_card",
        name: "Credit card",
        category: "credit_card",
        balance: "1500.00",
        provenance: "estimated",
      },
    ],
  });

  assert.equal(
    itemById(mapped.assetPortfolio.totals, "emergency_eligible_cash").value,
    "$3,500",
  );
  assert.deepEqual(mapped.assetPortfolio.assets, [
    {
      id: "checking",
      name: "Checking",
      category: "Cash",
      value: "$3,500",
      liquidity: "Liquid",
      provenance: "user-entered",
      emergencyEligible: true,
    },
    {
      id: "brokerage",
      name: "Brokerage",
      category: "Taxable Brokerage",
      value: "$6,000",
      liquidity: "Market Exposed",
      provenance: "source-backed",
      emergencyEligible: false,
    },
  ]);
  assert.deepEqual(mapped.assetPortfolio.liabilities, [
    {
      id: "credit_card",
      name: "Credit card",
      category: "Credit Card",
      value: "$1,500",
      liquidity: "Debt",
      provenance: "estimated",
      emergencyEligible: false,
    },
  ]);
});

test("report review data preserves the workspace report when charge inspector fails", async () => {
  const platformReportModulePath = require.resolve(
    "../lib/report-review/platform-report.ts",
  );
  const previousPlatformApiUrl = process.env.LITTLESEED_PLATFORM_API_URL;
  const previousFetch = globalThis.fetch;
  const previousConsoleError = console.error;
  const calls = [];

  process.env.LITTLESEED_PLATFORM_API_URL = "http://platform.test";
  delete require.cache[platformReportModulePath];
  const { getReportReviewData } = require("../lib/report-review/platform-report.ts");

  globalThis.fetch = async (url) => {
    const urlText = String(url);
    calls.push(urlText);

    if (urlText.endsWith("/v1/phase3/workspace-report")) {
      return jsonResponse(workspacePayload());
    }

    if (urlText.endsWith("/v1/phase3/charge-inspector-review")) {
      return jsonResponse({ error: "temporary unavailable" }, 503);
    }

    return jsonResponse({ error: "not found" }, 404);
  };
  console.error = () => {};

  try {
    const report = await getReportReviewData();

    assert.equal(report.profileName, "Platform sample profile");
    assert.equal(report.dataMode, "Platform API");
    assert.equal(report.chargeInspector.dataMode, "fallback");
    assert.equal(
      report.chargeInspector.sourceLabel,
      "Charge Inspector temporarily unavailable",
    );
    assert.deepEqual(report.chargeInspector.findings, []);
    assert.equal(calls.length, 2);
    assert.ok(
      calls.some((url) => url.endsWith("/v1/phase3/workspace-report")),
    );
    assert.ok(
      calls.some((url) =>
        url.endsWith("/v1/phase3/charge-inspector-review"),
      ),
    );
  } finally {
    if (previousPlatformApiUrl === undefined) {
      delete process.env.LITTLESEED_PLATFORM_API_URL;
    } else {
      process.env.LITTLESEED_PLATFORM_API_URL = previousPlatformApiUrl;
    }
    if (previousFetch === undefined) {
      delete globalThis.fetch;
    } else {
      globalThis.fetch = previousFetch;
    }
    console.error = previousConsoleError;
    delete require.cache[platformReportModulePath];
  }
});

function chargeInspectorPlatformPayload() {
  const evidence = [
    transactionPayload("txn-streamly-1", 2, "2026-03-08", "Streamly Premium", "15.99"),
    transactionPayload("txn-streamly-2", 3, "2026-04-08", "Streamly Premium", "15.99"),
    transactionPayload("txn-streamly-3", 4, "2026-05-09", "Streamly Premium", "15.99"),
    transactionPayload("txn-coffee-1", 5, "2026-05-14", "Market Street Coffee", "8.25"),
    transactionPayload("txn-coffee-2", 6, "2026-05-14", "Market Street Coffee", "8.25"),
    transactionPayload(
      "txn-bank-fee",
      7,
      "2026-05-31",
      "Neighborhood Bank Monthly Service Fee",
      "12.00",
    ),
    transactionPayload("txn-fitplan-1", 9, "2026-04-21", "FitPlan App", "10.00"),
    transactionPayload("txn-fitplan-2", 10, "2026-05-21", "FitPlan App", "12.50"),
  ];

  return {
    schema_version: "charge_inspector_review_v0",
    review_id: "landing-sample-charge-review",
    csv_format: "chase_checking",
    source: "sample_csv",
    parser_schema_version: "charge_inspector_csv_parse_result_v0",
    detector_versions: {
      recurring_charge: "recurring_charge_detector_v0",
      duplicate_charge: "duplicate_charge_detector_v0",
      bank_fee: "bank_fee_detector_v0",
      price_increase: "price_increase_detector_v0",
    },
    spending_summary_version: "monthly_spending_summary_v0",
    category_summary_version: "transaction_category_rules_v0",
    category_monthly_summary_version: "transaction_category_monthly_summary_v0",
    category_monthly_budget_comparison_version:
      "transaction_category_monthly_budget_comparison_v1",
    category_budget_automation_readiness_version:
      "transaction_category_budget_automation_readiness_v0",
    category_budget_automation_judgment_version:
      "transaction_category_budget_automation_judgment_v0",
    reviewed_transaction_count: 18,
    parse_error_count: 0,
    findings: {
      recurring_charges: [
        {
          finding_id: "possible_recurring_charge_sample",
          merchant_name: "Streamly Premium",
          currency: "USD",
          typical_amount: "15.99",
          min_amount: "15.99",
          max_amount: "15.99",
          occurrence_count: 3,
          first_seen_date: "2026-03-08",
          last_seen_date: "2026-05-09",
          cadence: "monthly",
          evidence_transaction_ids: [
            "txn-streamly-1",
            "txn-streamly-2",
            "txn-streamly-3",
          ],
          evidence_source_row_numbers: [2, 3, 4],
          explanation:
            "This looks like a recurring charge because a similar debit amount appeared monthly.",
          limitations: ["Review the transaction evidence before acting."],
        },
      ],
      duplicate_charges: [
        {
          finding_id: "possible_duplicate_charge_sample",
          merchant_name: "Market Street Coffee",
          currency: "USD",
          amount: "8.25",
          occurrence_count: 2,
          posted_date: "2026-05-14",
          evidence_transaction_ids: ["txn-coffee-1", "txn-coffee-2"],
          evidence_source_row_numbers: [5, 6],
          explanation:
            "This looks like a possible duplicate charge because matching rows appeared.",
          limitations: ["Two matching rows can still be separate purchases."],
        },
      ],
      bank_fees: [
        {
          finding_id: "possible_bank_fee_sample",
          fee_type: "monthly_service_fee",
          merchant_name: "Neighborhood Bank Monthly Service Fee",
          currency: "USD",
          amount: "12.00",
          occurrence_count: 1,
          posted_date: "2026-05-31",
          evidence_transaction_ids: ["txn-bank-fee"],
          evidence_source_row_numbers: [7],
          explanation:
            "This looks like a possible bank fee because the description includes fee language.",
          limitations: ["This does not determine whether the fee is avoidable."],
        },
      ],
      price_increases: [
        {
          finding_id: "possible_price_increase_sample",
          merchant_name: "FitPlan App",
          currency: "USD",
          previous_amount: "10.00",
          increased_amount: "12.50",
          increase_amount: "2.50",
          increase_percent: "25.00",
          previous_posted_date: "2026-04-21",
          increased_posted_date: "2026-05-21",
          cadence: "monthly",
          occurrence_count: 2,
          evidence_transaction_ids: ["txn-fitplan-1", "txn-fitplan-2"],
          evidence_source_row_numbers: [9, 10],
          explanation:
            "This looks like a possible price increase because a monthly debit rose.",
          limitations: ["Plan changes, taxes, or fees can change amounts."],
        },
      ],
    },
    monthly_spending_summary: [
      monthlySummaryPayload("2026-03", "25.99", "0", "-25.99", 2, 2, 0),
      monthlySummaryPayload("2026-04", "25.99", "0", "-25.99", 2, 2, 0),
      monthlySummaryPayload("2026-05", "1889.90", "6400.00", "4510.10", 14, 12, 2),
    ],
    category_summary: [
      categorySummaryPayload("income", "Income", "0", "6400.00", 2, 0, 2, [
        "category.income.payroll_direct_deposit.v0",
      ]),
      categorySummaryPayload("housing", "Housing", "1500.00", "0", 1, 1, 0, [
        "category.housing.rent_payment.v0",
      ]),
      categorySummaryPayload(
        "groceries",
        "Groceries",
        "130.56",
        "0",
        2,
        2,
        0,
        ["category.groceries.grocer_text.v0"],
        [
          categoryEvidencePayload(
            "txn-groceries-1",
            "2026-05-03",
            "Corner Grocer",
            "76.44",
            "debit",
            "category.groceries.grocer_text.v0",
          ),
          categoryEvidencePayload(
            "txn-groceries-2",
            "2026-05-18",
            "Corner Grocer",
            "54.12",
            "debit",
            "category.groceries.grocer_text.v0",
          ),
        ],
      ),
    ],
    category_monthly_summary: [
      categoryMonthlySummaryPayload(
        "2026-03",
        "subscriptions",
        "Subscriptions",
        "15.99",
        "0",
        1,
        1,
        0,
        ["category.subscriptions.streaming.v0"],
      ),
      categoryMonthlySummaryPayload(
        "2026-04",
        "subscriptions",
        "Subscriptions",
        "15.99",
        "0",
        1,
        1,
        0,
        ["category.subscriptions.streaming.v0"],
      ),
      categoryMonthlySummaryPayload(
        "2026-05",
        "groceries",
        "Groceries",
        "130.56",
        "0",
        2,
        2,
        0,
        ["category.groceries.grocer_text.v0"],
      ),
    ],
    category_monthly_budget_comparison: [
      categoryMonthlyBudgetComparisonPayload(
        "2026-05",
        "groceries",
        "Groceries",
        "130.56",
        2,
        "100.00",
        "30.56",
        "30.56",
        "over_target",
      ),
      categoryMonthlyBudgetComparisonPayload(
        "2026-05",
        "housing",
        "Housing",
        "1500.00",
        1,
        null,
        null,
        null,
        "no_target",
      ),
    ],
    category_budget_automation_readiness: [
      categoryBudgetAutomationReadinessPayload(
        "2026-05",
        "groceries",
        "Groceries",
        "needs_review",
        "over_target",
        "over_target",
        "130.56",
        2,
        "100.00",
        "30.56",
      ),
      categoryBudgetAutomationReadinessPayload(
        "2026-05",
        "housing",
        "Housing",
        "insufficient_context",
        "missing_target",
        "no_target",
        "1500.00",
        1,
        null,
        null,
      ),
    ],
    category_budget_automation_judgment: [
      categoryBudgetAutomationJudgmentPayload(
        "2026-05",
        "groceries",
        "Groceries",
        "needs_human_review",
        "over_target_review_required",
        "needs_review",
        "over_target",
        "over_target",
        "130.56",
        2,
        "100.00",
        "30.56",
      ),
      categoryBudgetAutomationJudgmentPayload(
        "2026-05",
        "housing",
        "Housing",
        "not_enough_context",
        "missing_target",
        "insufficient_context",
        "missing_target",
        "no_target",
        "1500.00",
        1,
        null,
        null,
      ),
    ],
    evidence_transactions: evidence,
    parse_errors: [],
    limitations: [
      "Findings are deterministic review prompts, not ranked actions or financial advice.",
      "No account connection, continuous monitoring, merchant contact, or stored transaction history is introduced.",
    ],
  };
}

function categorySummaryPayload(
  category,
  label,
  debitTotal,
  creditTotal,
  transactionCount,
  debitTransactionCount,
  creditTransactionCount,
  ruleIds,
  evidenceRows = [],
) {
  return {
    schema_version: "transaction_category_summary_v0",
    category,
    label,
    currency: "USD",
    debit_total: debitTotal,
    credit_total: creditTotal,
    transaction_count: transactionCount,
    debit_transaction_count: debitTransactionCount,
    credit_transaction_count: creditTransactionCount,
    rule_ids: ruleIds,
    evidence_rows: evidenceRows,
    limitations: [
      "Category mapping uses deterministic merchant and transaction-type text rules only.",
    ],
  };
}

function categoryMonthlySummaryPayload(
  month,
  category,
  label,
  debitTotal,
  creditTotal,
  transactionCount,
  debitTransactionCount,
  creditTransactionCount,
  ruleIds,
) {
  return {
    schema_version: "transaction_category_monthly_summary_v0",
    month,
    category,
    label,
    currency: "USD",
    debit_total: debitTotal,
    credit_total: creditTotal,
    transaction_count: transactionCount,
    debit_transaction_count: debitTransactionCount,
    credit_transaction_count: creditTransactionCount,
    rule_ids: ruleIds,
    limitations: [
      "Category monthly summary groups deterministic category totals by posted-date month.",
    ],
  };
}

function categoryMonthlyBudgetComparisonPayload(
  month,
  category,
  label,
  actualDebitTotal,
  debitTransactionCount,
  targetDebitTotal,
  varianceAmount,
  variancePercent,
  status,
) {
  return {
    schema_version: "transaction_category_monthly_budget_comparison_v1",
    month,
    category,
    label,
    currency: "USD",
    actual_debit_total: actualDebitTotal,
    debit_transaction_count: debitTransactionCount,
    target_debit_total: targetDebitTotal,
    variance_amount: varianceAmount,
    variance_percent: variancePercent,
    status,
    limitations: [
      "Category monthly budget comparison uses only user-provided monthly targets and posted-date-month category debit totals.",
    ],
  };
}

function categoryBudgetAutomationReadinessPayload(
  month,
  category,
  label,
  readinessStatus,
  reasonCode,
  sourceComparisonStatus,
  actualDebitTotal,
  debitTransactionCount,
  targetDebitTotal,
  varianceAmount,
) {
  return {
    schema_version: "transaction_category_budget_automation_readiness_v0",
    month,
    category,
    label,
    currency: "USD",
    readiness_status: readinessStatus,
    reason_code: reasonCode,
    automation_scope: "explanation_only",
    source_comparison_status: sourceComparisonStatus,
    actual_debit_total: actualDebitTotal,
    debit_transaction_count: debitTransactionCount,
    target_debit_total: targetDebitTotal,
    variance_amount: varianceAmount,
    explanation:
      "This row is a deterministic explanation-only automation readiness preview.",
    limitations: [
      "Budget automation readiness is derived from already-calculated monthly target comparison facts.",
      "This is explanation-only readiness, not an automation decision.",
    ],
  };
}

function categoryBudgetAutomationJudgmentPayload(
  month,
  category,
  label,
  judgmentStatus,
  reasonCode,
  sourceReadinessStatus,
  sourceReadinessReason,
  sourceComparisonStatus,
  actualDebitTotal,
  debitTransactionCount,
  targetDebitTotal,
  varianceAmount,
) {
  return {
    schema_version: "transaction_category_budget_automation_judgment_v0",
    month,
    category,
    label,
    currency: "USD",
    judgment_status: judgmentStatus,
    reason_code: reasonCode,
    judgment_scope: "boundary_only",
    source_readiness_status: sourceReadinessStatus,
    source_readiness_reason: sourceReadinessReason,
    source_comparison_status: sourceComparisonStatus,
    actual_debit_total: actualDebitTotal,
    debit_transaction_count: debitTransactionCount,
    target_debit_total: targetDebitTotal,
    variance_amount: varianceAmount,
    explanation:
      "This row is a deterministic boundary-only automation judgment.",
    limitations: [
      "Budget automation judgment is derived from automation readiness facts.",
      "This is not an automation decision, recommendation, or execution approval.",
    ],
  };
}

function categoryEvidencePayload(
  evidenceId,
  postedDate,
  merchantName,
  amount,
  direction,
  ruleId,
) {
  return {
    evidence_id: evidenceId,
    posted_date: postedDate,
    merchant_name: merchantName,
    amount,
    direction,
    currency: "USD",
    rule_id: ruleId,
  };
}

function monthlySummaryPayload(
  month,
  debitTotal,
  creditTotal,
  netCashFlow,
  transactionCount,
  debitTransactionCount,
  creditTransactionCount,
) {
  return {
    schema_version: "monthly_spending_summary_v0",
    month,
    currency: "USD",
    debit_total: debitTotal,
    credit_total: creditTotal,
    net_cash_flow: netCashFlow,
    transaction_count: transactionCount,
    debit_transaction_count: debitTransactionCount,
    credit_transaction_count: creditTransactionCount,
  };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
    status,
  });
}

function transactionPayload(id, rowNumber, postedDate, merchantName, amount) {
  return {
    transaction_id: id,
    source: "sample_csv",
    source_row_number: rowNumber,
    posted_date: postedDate,
    merchant_name: merchantName,
    original_description: merchantName,
    amount,
    direction: "debit",
    currency: "USD",
    transaction_type: "DEBIT_CARD",
  };
}

function mapWorkspacePayload(overrides = {}) {
  return mapPlatformReport(
    parseWorkspaceReportResponse(workspacePayload(overrides)),
    {
      profileName: "Test profile",
      dataMode: "Test Platform API",
      connectionMessage: "Loaded for mapper tests.",
    },
  );
}

function itemById(items, id) {
  const item = items.find((candidate) => candidate.id === id);
  assert.ok(item, `Expected item with id ${id}`);
  return item;
}

function guidanceRulePayload() {
  return {
    rule_id: "eft.cash_below_lower_target_range",
    trigger: {
      metric: "current_months_covered",
      operator: "less_than",
      threshold_ref: "target_months_range.min_months",
      threshold_value: null,
    },
    allowed_phrasing:
      "Your cash currently covers less than the lower end of a typical emergency-fund range.",
    evidence_source_ids: [
      "cfpb_emergency_fund_guide",
      "fdic_money_smart_your_savings",
    ],
    required_guards: [
      "monthly_essential_expenses",
      "cash_liquid_balance",
    ],
    rule_version: "guidance_rule_registry_v0",
  };
}

function workspacePayload(overrides = {}) {
  return {
    report: reportPayload(overrides.report),
    workspace_snapshot: {
      inputs: {
        emergency_fund_target: {
          monthly_essential_expenses: "3000.00",
          cash_liquid_balance: "5000.00",
          income_pattern: "mostly_stable",
          dependents: 0,
          job_stability: "high",
          ...(overrides.emergencyFundTarget ?? {}),
        },
        assets: overrides.assets ?? [],
        liabilities: overrides.liabilities ?? [],
      },
      eft_result: {
        applicability: "applicable",
        target_months_range: {
          min_months: "3",
          max_months: "6",
        },
        target_amount_range: {
          min_amount: "9000.00",
          max_amount: "18000.00",
        },
        current_months_covered: "1.67",
        gap_amount_range: {
          min_amount: "4000.00",
          max_amount: "13000.00",
        },
        missing_context: [],
        assumptions: [],
        limitations: [],
        education_topics: ["emergency_fund.target_range"],
        ...(overrides.eftResult ?? {}),
      },
    },
  };
}

function reportPayload(overrides = {}) {
  const base = {
    report_schema_version: "financial_health_report_v0_3",
    report_status: "complete",
    calculated_at: "2026-06-17T00:00:00Z",
    disclaimer: {
      text: "Educational review only.",
    },
    sections: [],
    findings: [],
    evidence_sources: [],
    data_completeness: {
      status: "complete",
      explanation: "Complete enough for this parser test.",
      missing_context: [],
      potentially_unmeasured_categories: [],
    },
    report_context: {
      uncertainty: [],
    },
    net_worth: {
      gross_assets: "0.00",
      total_liabilities: "0.00",
      net_worth: "0.00",
      liquid_net_worth: "0.00",
    },
    cash_flow: {
      monthly_required_outflows: "3000.00",
      monthly_surplus_after_investing: "0.00",
    },
    debt_risk: {
      total_debt_balance: "0.00",
      confirmed_high_interest_balance: "0.00",
    },
    long_term_contribution: {
      known_monthly_total_contribution: "0.00",
    },
  };

  return {
    ...base,
    ...overrides,
    disclaimer: {
      ...base.disclaimer,
      ...(overrides.disclaimer ?? {}),
    },
    data_completeness: {
      ...base.data_completeness,
      ...(overrides.data_completeness ?? {}),
    },
    report_context: {
      ...base.report_context,
      ...(overrides.report_context ?? {}),
    },
    net_worth: {
      ...base.net_worth,
      ...(overrides.net_worth ?? {}),
    },
    cash_flow: {
      ...base.cash_flow,
      ...(overrides.cash_flow ?? {}),
    },
    debt_risk: {
      ...base.debt_risk,
      ...(overrides.debt_risk ?? {}),
    },
    long_term_contribution: {
      ...base.long_term_contribution,
      ...(overrides.long_term_contribution ?? {}),
    },
  };
}
