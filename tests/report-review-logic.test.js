const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildManualProfileRequest,
  defaultManualProfileValues,
  ManualProfileValidationError,
} = require("../lib/report-review/manual-profile.ts");
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

test("manual profile omits blank user target months", () => {
  const values = defaultManualProfileValues();

  const request = buildManualProfileRequest(values);

  assert.equal(request.userTargetMonths, undefined);
  assert.equal(request.profile.monthly_take_home_income, "5200.00");
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
  assert.equal(parsed.workspace_snapshot.eft_result.guidance_rule_version, "");
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
