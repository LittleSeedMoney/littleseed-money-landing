const assert = require("node:assert/strict");
const test = require("node:test");

require("sucrase/register/ts");

const {
  buildManualProfileRequest,
  defaultManualProfileValues,
  ManualProfileValidationError,
} = require("../lib/report-review/manual-profile.ts");
const {
  parseWorkspaceReportResponse,
} = require("../lib/report-review/platform-workspace-response.ts");
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

function workspacePayload(overrides = {}) {
  return {
    report: reportPayload(),
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
        assets: [],
        liabilities: [],
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

function reportPayload() {
  return {
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
}
