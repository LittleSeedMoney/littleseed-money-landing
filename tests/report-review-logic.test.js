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
  chargeInspectorFindingTypeLabels,
  chargeInspectorSampleReview,
  isChargeInspectorEmpty,
  summarizeChargeInspectorReview,
  visibleChargeInspectorFindings,
} = require("../lib/report-review/charge-inspector.ts");
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

test("manual profile omits blank user target months", () => {
  const values = defaultManualProfileValues();

  const request = buildManualProfileRequest(values);

  assert.equal(request.userTargetMonths, undefined);
  assert.equal(request.profile.monthly_take_home_income, "5200.00");
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

test("charge inspector sample covers every current finding type", () => {
  const summary = summarizeChargeInspectorReview(chargeInspectorSampleReview);

  assert.equal(summary.reviewedTransactionCount, 18);
  assert.equal(summary.totalFindings, 4);
  assert.equal(summary.recurringCount, 1);
  assert.equal(summary.duplicateCount, 1);
  assert.equal(summary.bankFeeCount, 1);
  assert.equal(summary.priceIncreaseCount, 1);
  assert.deepEqual(
    chargeInspectorSampleReview.findings.map((finding) => finding.type).sort(),
    Object.keys(chargeInspectorFindingTypeLabels).sort(),
  );
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

test("charge inspector empty review keeps a safe no-finding state", () => {
  assert.equal(isChargeInspectorEmpty(chargeInspectorEmptyReview), true);
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

test("charge inspector copy stays inside review-only boundaries", () => {
  const copy = [
    chargeInspectorSampleReview.sourceLabel,
    ...chargeInspectorSampleReview.limitations,
    chargeInspectorSampleReview.emptyState.title,
    chargeInspectorSampleReview.emptyState.body,
    ...chargeInspectorSampleReview.emptyState.checks,
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

test("report review sample exposes charge inspector review data", () => {
  assert.equal(
    reportReviewSample.chargeInspector.sourceLabel,
    "Sample CSV review fixture",
  );
  assert.equal(reportReviewSample.chargeInspector.findings.length, 4);
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
