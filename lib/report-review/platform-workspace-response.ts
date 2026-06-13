export type DecimalValue = string | number | null | undefined;

export type PlatformWorkspaceReportResponse = {
  report: PlatformReport;
  workspace_snapshot: PlatformWorkspaceSnapshot;
};

export type PlatformReport = {
  report_schema_version: string;
  report_status: string;
  calculated_at: string;
  disclaimer: { text: string };
  sections: PlatformReportSection[];
  findings: PlatformFinding[];
  evidence_sources: PlatformEvidenceSource[];
  data_completeness: {
    status: string;
    explanation: string;
    missing_context: string[];
    potentially_unmeasured_categories: string[];
  };
  report_context: {
    uncertainty: string[];
  };
  net_worth: {
    gross_assets: DecimalValue;
    total_liabilities: DecimalValue;
    net_worth: DecimalValue;
    liquid_net_worth: DecimalValue;
  };
  cash_flow: {
    monthly_required_outflows: DecimalValue;
    monthly_surplus_after_investing: DecimalValue;
  };
  debt_risk: {
    total_debt_balance: DecimalValue;
    confirmed_high_interest_balance: DecimalValue;
  };
  long_term_contribution: {
    known_monthly_total_contribution: DecimalValue;
  };
};

export type PlatformReportSection = {
  section_id: string;
  question: string;
  answer: string;
  evidence_level: string;
  evidence_source_ids: string[];
  limitations: string[];
};

export type PlatformFinding = {
  finding_id: string;
  title: string;
  summary: string;
  why_it_matters: string;
  options: string[];
  limitations: string[];
  education_topics: string[];
  evidence_source_ids: string[];
};

export type PlatformEvidenceSource = {
  source_id: string;
  publisher: string;
  title: string;
  url: string;
  reviewed_on: string;
  supports: string;
  limitations: string[];
};

export type PlatformWorkspaceSnapshot = {
  inputs: {
    emergency_fund_target: {
      monthly_essential_expenses: DecimalValue;
      cash_liquid_balance: DecimalValue;
      income_pattern: string | null;
      dependents: number | null;
      job_stability: string | null;
    };
    assets: PlatformWorkspaceAsset[];
    liabilities: PlatformWorkspaceLiability[];
  };
  eft_result: {
    applicability: string;
    target_months_range: {
      min_months: DecimalValue;
      max_months: DecimalValue;
    } | null;
    target_amount_range: {
      min_amount: DecimalValue;
      max_amount: DecimalValue;
    } | null;
    current_months_covered: DecimalValue;
    gap_amount_range: {
      min_amount: DecimalValue;
      max_amount: DecimalValue;
    } | null;
    missing_context: string[];
    assumptions: string[];
    limitations: string[];
  };
};

export type PlatformWorkspaceAsset = {
  asset_id: string;
  name: string;
  category: string;
  balance: DecimalValue;
  liquidity: string;
  provenance: string;
  emergency_fund_eligible: boolean;
};

export type PlatformWorkspaceLiability = {
  liability_id: string;
  name: string;
  category: string;
  balance: DecimalValue;
  provenance: string;
};

export function parseWorkspaceReportResponse(
  value: unknown,
): PlatformWorkspaceReportResponse {
  const response = expectRecord(value, "workspace-report response");

  return {
    report: parsePlatformReport(response.report, "workspace-report response.report"),
    workspace_snapshot: parsePlatformWorkspaceSnapshot(
      response.workspace_snapshot,
      "workspace-report response.workspace_snapshot",
    ),
  };
}

function parsePlatformReport(value: unknown, path: string): PlatformReport {
  const report = expectRecord(value, path);
  const disclaimer = expectRecord(report.disclaimer, `${path}.disclaimer`);
  const dataCompleteness = expectRecord(
    report.data_completeness,
    `${path}.data_completeness`,
  );
  const reportContext = expectRecord(
    report.report_context,
    `${path}.report_context`,
  );
  const netWorth = expectRecord(report.net_worth, `${path}.net_worth`);
  const cashFlow = expectRecord(report.cash_flow, `${path}.cash_flow`);
  const debtRisk = expectRecord(report.debt_risk, `${path}.debt_risk`);
  const longTermContribution = expectRecord(
    report.long_term_contribution,
    `${path}.long_term_contribution`,
  );

  return {
    report_schema_version: expectString(
      report.report_schema_version,
      `${path}.report_schema_version`,
    ),
    report_status: expectString(report.report_status, `${path}.report_status`),
    calculated_at: expectString(report.calculated_at, `${path}.calculated_at`),
    disclaimer: {
      text: expectString(disclaimer.text, `${path}.disclaimer.text`),
    },
    sections: parseArray(report.sections, `${path}.sections`, parseReportSection),
    findings: parseArray(report.findings, `${path}.findings`, parseFinding),
    evidence_sources: parseArray(
      report.evidence_sources,
      `${path}.evidence_sources`,
      parseEvidenceSource,
    ),
    data_completeness: {
      status: expectString(
        dataCompleteness.status,
        `${path}.data_completeness.status`,
      ),
      explanation: expectString(
        dataCompleteness.explanation,
        `${path}.data_completeness.explanation`,
      ),
      missing_context: parseStringArray(
        dataCompleteness.missing_context,
        `${path}.data_completeness.missing_context`,
      ),
      potentially_unmeasured_categories: parseStringArray(
        dataCompleteness.potentially_unmeasured_categories,
        `${path}.data_completeness.potentially_unmeasured_categories`,
      ),
    },
    report_context: {
      uncertainty: parseStringArray(
        reportContext.uncertainty,
        `${path}.report_context.uncertainty`,
      ),
    },
    net_worth: {
      gross_assets: expectDecimalValue(
        netWorth.gross_assets,
        `${path}.net_worth.gross_assets`,
      ),
      total_liabilities: expectDecimalValue(
        netWorth.total_liabilities,
        `${path}.net_worth.total_liabilities`,
      ),
      net_worth: expectDecimalValue(
        netWorth.net_worth,
        `${path}.net_worth.net_worth`,
      ),
      liquid_net_worth: expectDecimalValue(
        netWorth.liquid_net_worth,
        `${path}.net_worth.liquid_net_worth`,
      ),
    },
    cash_flow: {
      monthly_required_outflows: expectDecimalValue(
        cashFlow.monthly_required_outflows,
        `${path}.cash_flow.monthly_required_outflows`,
      ),
      monthly_surplus_after_investing: expectDecimalValue(
        cashFlow.monthly_surplus_after_investing,
        `${path}.cash_flow.monthly_surplus_after_investing`,
      ),
    },
    debt_risk: {
      total_debt_balance: expectDecimalValue(
        debtRisk.total_debt_balance,
        `${path}.debt_risk.total_debt_balance`,
      ),
      confirmed_high_interest_balance: expectDecimalValue(
        debtRisk.confirmed_high_interest_balance,
        `${path}.debt_risk.confirmed_high_interest_balance`,
      ),
    },
    long_term_contribution: {
      known_monthly_total_contribution: expectDecimalValue(
        longTermContribution.known_monthly_total_contribution,
        `${path}.long_term_contribution.known_monthly_total_contribution`,
      ),
    },
  };
}

function parseReportSection(
  value: unknown,
  path: string,
): PlatformReportSection {
  const section = expectRecord(value, path);

  return {
    section_id: expectString(section.section_id, `${path}.section_id`),
    question: expectString(section.question, `${path}.question`),
    answer: expectString(section.answer, `${path}.answer`),
    evidence_level: expectString(section.evidence_level, `${path}.evidence_level`),
    evidence_source_ids: parseStringArray(
      section.evidence_source_ids,
      `${path}.evidence_source_ids`,
    ),
    limitations: parseStringArray(section.limitations, `${path}.limitations`),
  };
}

function parseFinding(value: unknown, path: string): PlatformFinding {
  const finding = expectRecord(value, path);

  return {
    finding_id: expectString(finding.finding_id, `${path}.finding_id`),
    title: expectString(finding.title, `${path}.title`),
    summary: expectString(finding.summary, `${path}.summary`),
    why_it_matters: expectString(
      finding.why_it_matters,
      `${path}.why_it_matters`,
    ),
    options: parseStringArray(finding.options, `${path}.options`),
    limitations: parseStringArray(finding.limitations, `${path}.limitations`),
    education_topics: parseStringArray(
      finding.education_topics,
      `${path}.education_topics`,
    ),
    evidence_source_ids: parseStringArray(
      finding.evidence_source_ids,
      `${path}.evidence_source_ids`,
    ),
  };
}

function parseEvidenceSource(
  value: unknown,
  path: string,
): PlatformEvidenceSource {
  const source = expectRecord(value, path);

  return {
    source_id: expectString(source.source_id, `${path}.source_id`),
    publisher: expectString(source.publisher, `${path}.publisher`),
    title: expectString(source.title, `${path}.title`),
    url: expectString(source.url, `${path}.url`),
    reviewed_on: expectString(source.reviewed_on, `${path}.reviewed_on`),
    supports: expectString(source.supports, `${path}.supports`),
    limitations: parseStringArray(source.limitations, `${path}.limitations`),
  };
}

function parsePlatformWorkspaceSnapshot(
  value: unknown,
  path: string,
): PlatformWorkspaceSnapshot {
  const snapshot = expectRecord(value, path);
  const inputs = expectRecord(snapshot.inputs, `${path}.inputs`);
  const emergencyFundTarget = expectRecord(
    inputs.emergency_fund_target,
    `${path}.inputs.emergency_fund_target`,
  );
  const eftResult = expectRecord(snapshot.eft_result, `${path}.eft_result`);

  return {
    inputs: {
      emergency_fund_target: {
        monthly_essential_expenses: expectDecimalValue(
          emergencyFundTarget.monthly_essential_expenses,
          `${path}.inputs.emergency_fund_target.monthly_essential_expenses`,
        ),
        cash_liquid_balance: expectDecimalValue(
          emergencyFundTarget.cash_liquid_balance,
          `${path}.inputs.emergency_fund_target.cash_liquid_balance`,
        ),
        income_pattern: expectNullableString(
          emergencyFundTarget.income_pattern,
          `${path}.inputs.emergency_fund_target.income_pattern`,
        ),
        dependents: expectNullableNumber(
          emergencyFundTarget.dependents,
          `${path}.inputs.emergency_fund_target.dependents`,
        ),
        job_stability: expectNullableString(
          emergencyFundTarget.job_stability,
          `${path}.inputs.emergency_fund_target.job_stability`,
        ),
      },
      assets: parseArray(
        inputs.assets,
        `${path}.inputs.assets`,
        parseWorkspaceAsset,
      ),
      liabilities: parseArray(
        inputs.liabilities,
        `${path}.inputs.liabilities`,
        parseWorkspaceLiability,
      ),
    },
    eft_result: {
      applicability: expectString(
        eftResult.applicability,
        `${path}.eft_result.applicability`,
      ),
      target_months_range: parseNullableMonthsRange(
        eftResult.target_months_range,
        `${path}.eft_result.target_months_range`,
      ),
      target_amount_range: parseNullableAmountRange(
        eftResult.target_amount_range,
        `${path}.eft_result.target_amount_range`,
      ),
      current_months_covered: expectDecimalValue(
        eftResult.current_months_covered,
        `${path}.eft_result.current_months_covered`,
      ),
      gap_amount_range: parseNullableAmountRange(
        eftResult.gap_amount_range,
        `${path}.eft_result.gap_amount_range`,
      ),
      missing_context: parseStringArray(
        eftResult.missing_context,
        `${path}.eft_result.missing_context`,
      ),
      assumptions: parseStringArray(
        eftResult.assumptions,
        `${path}.eft_result.assumptions`,
      ),
      limitations: parseStringArray(
        eftResult.limitations,
        `${path}.eft_result.limitations`,
      ),
    },
  };
}

function parseWorkspaceAsset(
  value: unknown,
  path: string,
): PlatformWorkspaceAsset {
  const asset = expectRecord(value, path);

  return {
    asset_id: expectString(asset.asset_id, `${path}.asset_id`),
    name: expectString(asset.name, `${path}.name`),
    category: expectString(asset.category, `${path}.category`),
    balance: expectDecimalValue(asset.balance, `${path}.balance`),
    liquidity: expectString(asset.liquidity, `${path}.liquidity`),
    provenance: expectString(asset.provenance, `${path}.provenance`),
    emergency_fund_eligible: expectBoolean(
      asset.emergency_fund_eligible,
      `${path}.emergency_fund_eligible`,
    ),
  };
}

function parseWorkspaceLiability(
  value: unknown,
  path: string,
): PlatformWorkspaceLiability {
  const liability = expectRecord(value, path);

  return {
    liability_id: expectString(liability.liability_id, `${path}.liability_id`),
    name: expectString(liability.name, `${path}.name`),
    category: expectString(liability.category, `${path}.category`),
    balance: expectDecimalValue(liability.balance, `${path}.balance`),
    provenance: expectString(liability.provenance, `${path}.provenance`),
  };
}

function parseNullableMonthsRange(
  value: unknown,
  path: string,
): { min_months: DecimalValue; max_months: DecimalValue } | null {
  if (value === null) {
    return null;
  }

  const range = expectRecord(value, path);
  return {
    min_months: expectDecimalValue(range.min_months, `${path}.min_months`),
    max_months: expectDecimalValue(range.max_months, `${path}.max_months`),
  };
}

function parseNullableAmountRange(
  value: unknown,
  path: string,
): { min_amount: DecimalValue; max_amount: DecimalValue } | null {
  if (value === null) {
    return null;
  }

  const range = expectRecord(value, path);
  return {
    min_amount: expectDecimalValue(range.min_amount, `${path}.min_amount`),
    max_amount: expectDecimalValue(range.max_amount, `${path}.max_amount`),
  };
}

function parseArray<T>(
  value: unknown,
  path: string,
  parseItem: (item: unknown, path: string) => T,
): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid platform response: ${path} must be an array.`);
  }

  return value.map((item, index) => parseItem(item, `${path}[${index}]`));
}

function parseStringArray(value: unknown, path: string): string[] {
  return parseArray(value, path, expectString);
}

function expectRecord(
  value: unknown,
  path: string,
): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  throw new Error(`Invalid platform response: ${path} must be an object.`);
}

function expectString(value: unknown, path: string): string {
  if (typeof value === "string") {
    return value;
  }

  throw new Error(`Invalid platform response: ${path} must be a string.`);
}

function expectNullableString(value: unknown, path: string): string | null {
  if (typeof value === "string" || value === null) {
    return value;
  }

  throw new Error(
    `Invalid platform response: ${path} must be a string or null.`,
  );
}

function expectBoolean(value: unknown, path: string): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  throw new Error(`Invalid platform response: ${path} must be a boolean.`);
}

function expectNullableNumber(value: unknown, path: string): number | null {
  if ((typeof value === "number" && Number.isFinite(value)) || value === null) {
    return value;
  }

  throw new Error(`Invalid platform response: ${path} must be a number or null.`);
}

function expectDecimalValue(value: unknown, path: string): DecimalValue {
  if (typeof value === "string" || value === null) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  throw new Error(
    `Invalid platform response: ${path} must be a string, number, or null.`,
  );
}
