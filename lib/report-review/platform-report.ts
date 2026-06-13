import {
  reportReviewSample,
  type DecisionReadinessMissingInput,
  type EvidenceSource,
  type Finding,
  type Provenance,
  type ReportReviewSample,
  type ReportSection,
  type SnapshotItem,
  type SummaryMetric,
} from "@/data/report-review-sample";

import { sampleFinancialProfile } from "./sample-profile";

type DecimalValue = string | number | null | undefined;

type PlatformWorkspaceReportResponse = {
  report: PlatformReport;
  workspace_snapshot: PlatformWorkspaceSnapshot;
};

type PlatformReport = {
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

type PlatformReportSection = {
  section_id: string;
  question: string;
  answer: string;
  evidence_level: string;
  evidence_source_ids: string[];
  limitations: string[];
};

type PlatformFinding = {
  finding_id: string;
  title: string;
  summary: string;
  why_it_matters: string;
  options: string[];
  limitations: string[];
  education_topics: string[];
  evidence_source_ids: string[];
};

type PlatformEvidenceSource = {
  source_id: string;
  publisher: string;
  title: string;
  url: string;
  reviewed_on: string;
  supports: string;
  limitations: string[];
};

type PlatformWorkspaceSnapshot = {
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

type PlatformWorkspaceAsset = {
  asset_id: string;
  name: string;
  category: string;
  balance: DecimalValue;
  liquidity: string;
  provenance: string;
  emergency_fund_eligible: boolean;
};

type PlatformWorkspaceLiability = {
  liability_id: string;
  name: string;
  category: string;
  balance: DecimalValue;
  provenance: string;
};

const PLATFORM_API_URL = process.env.LITTLESEED_PLATFORM_API_URL?.trim();
const PLATFORM_REQUEST_TIMEOUT_MS = 4_000;

export async function getReportReviewData(): Promise<ReportReviewSample> {
  if (!PLATFORM_API_URL) {
    return reportReviewSample;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    PLATFORM_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(
      `${PLATFORM_API_URL.replace(/\/$/, "")}/v1/phase3/workspace-report`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile: sampleFinancialProfile,
          snapshot_id: "landing-review-sample-workspace",
          report_id: "landing-review-sample-report",
        }),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Platform API returned ${response.status}`);
    }

    const payload =
      (await response.json()) as PlatformWorkspaceReportResponse;
    return mapPlatformReport(payload);
  } catch (error) {
    return fallbackReport(error);
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackReport(error: unknown): ReportReviewSample {
  console.error("Platform report-review API request failed", error);

  return {
    ...reportReviewSample,
    dataMode: "Sample fallback",
    connectionNotice: {
      tone: "red",
      message:
        `Platform API request failed. Showing sample report data for review. ` +
        "No user data was saved.",
    },
  };
}

function mapPlatformReport(
  payload: PlatformWorkspaceReportResponse,
): ReportReviewSample {
  const { report, workspace_snapshot: snapshot } = payload;

  return {
    profileName: "Platform sample profile",
    reportStatus: titleCase(report.report_status),
    generatedAt: report.calculated_at,
    schemaVersion: report.report_schema_version,
    disclaimer: report.disclaimer.text,
    dataMode: "Platform API",
    connectionNotice: {
      tone: "seed",
      message:
        "Loaded from the platform workspace-report API using the sample review profile. The route is in-session only and does not save the profile, report, or snapshot.",
    },
    summaryMetrics: buildSummaryMetrics(report, snapshot),
    sections: report.sections.map(mapSection),
    findings: report.findings.map(mapFinding),
    evidenceSources: report.evidence_sources.map(mapEvidenceSource),
    dataCompleteness: {
      status: titleCase(report.data_completeness.status),
      explanation: report.data_completeness.explanation,
      uncertainty: report.report_context.uncertainty,
      missingContext: labelList(report.data_completeness.missing_context),
      potentiallyUnmeasuredCategories: labelList(
        report.data_completeness.potentially_unmeasured_categories,
      ),
    },
    assetPortfolio: {
      totals: buildPortfolioTotals(report, snapshot),
      assets: snapshot.inputs.assets.map(mapAsset),
      liabilities: snapshot.inputs.liabilities.map(mapLiability),
      notes: [
        {
          id: "api_snapshot",
          title: "Platform snapshot",
          body: "This view is built from a platform API response for the current review session. The initial route does not persist a report history.",
        },
        {
          id: "liquidity_boundary",
          title: "Liquidity boundary",
          body: "Emergency Fund Target v0 counts reported liquid cash separately from retirement, brokerage, and other assets.",
        },
      ],
    },
    decisionReadiness: buildDecisionReadiness(snapshot),
  };
}

function buildSummaryMetrics(
  report: PlatformReport,
  snapshot: PlatformWorkspaceSnapshot,
): SummaryMetric[] {
  const monthlySurplus = decimal(
    report.cash_flow.monthly_surplus_after_investing,
  );
  const coverage = decimal(snapshot.eft_result.current_months_covered);

  return [
    {
      id: "monthly_cash_flow",
      label: "Monthly cash flow",
      value: monthlySurplusText(monthlySurplus),
      detail: "After living expenses, debt payments, and contributions.",
      provenance: "calculated",
      disclosure: {
        measures: "Money left after reported monthly outflows and contributions.",
        calculation: "Generated by the platform cash-flow model.",
        assumptions: [
          "The value uses the sample profile sent to the platform API.",
        ],
        limitations: [
          "This is not a recommendation about what to do with remaining cash.",
        ],
      },
    },
    {
      id: "emergency_coverage",
      label: "Emergency coverage",
      value: coverage === null ? "Missing" : `${coverage.toFixed(2)} months`,
      detail: "Reported cash divided by required monthly outflows.",
      provenance: coverage === null ? "missing" : "calculated",
      disclosure: {
        measures: "How many months reported liquid cash could cover outflows.",
        calculation: "Generated by Emergency Fund Target v0.",
        assumptions: snapshot.eft_result.assumptions,
        limitations: snapshot.eft_result.limitations,
      },
    },
    {
      id: "debt_pressure",
      label: "Debt pressure",
      value: `${money(report.debt_risk.total_debt_balance)} debt`,
      detail:
        `${money(report.debt_risk.confirmed_high_interest_balance)} meets ` +
        "the high-interest review rule.",
      provenance: "calculated",
      disclosure: {
        measures:
          "Total reported debt and the portion that met the high-interest review rule.",
        calculation:
          "Generated by the platform debt-risk model from reported liability balances, interest rates, and tax-advantage flags.",
        assumptions: [
          "The value uses debt balances and terms in the sample profile sent to the platform API.",
        ],
        limitations: [
          "This is not a repayment priority, underwriting ratio, or creditworthiness assessment.",
          "Fees, promotional terms, variable rates, and tax treatment can change the interpretation.",
        ],
      },
    },
    {
      id: "net_worth",
      label: "Net worth",
      value: money(report.net_worth.net_worth),
      detail:
        `${money(report.net_worth.gross_assets)} assets minus ` +
        `${money(report.net_worth.total_liabilities)} liabilities.`,
      provenance: "calculated",
      disclosure: {
        measures: "Reported assets minus reported liabilities.",
        calculation:
          "Generated by the platform net-worth model from the profile submitted to the API.",
        assumptions: [
          "Asset and liability values are reported balances, not live market data.",
        ],
        limitations: [
          "Taxes, selling costs, penalties, liquidity constraints, and market movement are excluded.",
        ],
      },
    },
    {
      id: "known_contributions",
      label: "Known contributions",
      value: `${money(report.long_term_contribution.known_monthly_total_contribution)} / month`,
      detail: "Employee and employer contributions reported.",
      provenance: "user-entered",
      disclosure: {
        measures:
          "Known monthly employee and employer contributions included in the submitted profile.",
        calculation:
          "Generated by the platform contribution model from reported monthly contribution fields.",
        assumptions: [
          "The submitted contribution amounts are already monthly values.",
        ],
        limitations: [
          "Eligibility, contribution limits, vesting, payroll timing, and tax treatment are not validated in this review surface.",
        ],
      },
    },
    {
      id: "data_completeness",
      label: "Data completeness",
      value: titleCase(report.data_completeness.status),
      detail: report.data_completeness.explanation,
      provenance:
        report.data_completeness.status === "complete" ? "calculated" : "missing",
      disclosure: {
        measures:
          "Whether unknown or aggregated inputs limit report interpretation.",
        calculation:
          "Generated by the platform completeness assessment from missing context and potentially unmeasured categories.",
        assumptions: [
          "Missing optional values are preserved as missing instead of being converted to zero.",
        ],
        limitations: [
          "A partial data state can still support calculations while limiting interpretation.",
        ],
      },
    },
  ];
}

function buildPortfolioTotals(
  report: PlatformReport,
  snapshot: PlatformWorkspaceSnapshot,
): SummaryMetric[] {
  const emergencyCash = snapshot.inputs.assets
    .filter((asset) => asset.emergency_fund_eligible)
    .reduce((total, asset) => total + (decimal(asset.balance) ?? 0), 0);

  return [
    {
      id: "total_assets",
      label: "Total assets",
      value: money(report.net_worth.gross_assets),
      detail: "Reported asset balances from the platform snapshot.",
      provenance: "user-entered",
    },
    {
      id: "emergency_eligible_cash",
      label: "Emergency-eligible cash",
      value: formatMoney(emergencyCash),
      detail: "Cash currently counted by Emergency Fund Target v0.",
      provenance: "user-entered",
    },
    {
      id: "total_liabilities",
      label: "Total liabilities",
      value: money(report.net_worth.total_liabilities),
      detail: "Reported liability balances from the platform snapshot.",
      provenance: "user-entered",
    },
    {
      id: "liquid_net_worth",
      label: "Liquid net worth",
      value: money(report.net_worth.liquid_net_worth),
      detail: "Cash plus brokerage minus total liabilities.",
      provenance: "calculated",
    },
  ];
}

function buildDecisionReadiness(
  snapshot: PlatformWorkspaceSnapshot,
): ReportReviewSample["decisionReadiness"] {
  const eft = snapshot.eft_result;
  const input = snapshot.inputs.emergency_fund_target;
  const range = eft.target_amount_range;
  const targetDetail = range
    ? `${money(range.min_amount)} to ${money(range.max_amount)}`
    : "Missing";

  return {
    id: "emergency_fund_target_v0",
    title: "Emergency Fund Target v0",
    status: titleCase(eft.applicability),
    explanation:
      `The platform returned an evidence-backed target range of ${targetDetail}. ` +
      "The result is educational and does not create a ranked action plan.",
    availableInputs: [
      inputItem(
        "emergency_eligible_cash",
        "Emergency-eligible cash",
        input.cash_liquid_balance,
      ),
      inputItem(
        "required_monthly_outflows",
        "Required monthly outflows",
        input.monthly_essential_expenses,
        "calculated",
      ),
      {
        id: "income_pattern",
        label: "Income pattern",
        value: input.income_pattern ? labelValue(input.income_pattern) : "Missing",
        provenance: input.income_pattern ? "user-entered" : "missing",
      },
      {
        id: "target_range",
        label: "Target range",
        value: targetDetail,
        provenance: range ? "calculated" : "missing",
      },
    ],
    missingInputs: missingInputs(eft.missing_context),
    limitations: eft.limitations,
  };
}

function inputItem(
  id: string,
  label: string,
  value: DecimalValue,
  provenance: Provenance = "user-entered",
): { id: string; label: string; value: string; provenance: Provenance } {
  return {
    id,
    label,
    value: value === null || value === undefined ? "Missing" : money(value),
    provenance: value === null || value === undefined ? "missing" : provenance,
  };
}

function missingInputs(values: string[]): DecisionReadinessMissingInput[] {
  return values.map((value) => ({
    id: value,
    label: labelValue(value),
    whyItMatters: missingInputReason(value),
  }));
}

function missingInputReason(value: string): string {
  const reasons: Record<string, string> = {
    cash_liquid_balance:
      "Emergency-eligible cash is needed before the model can compare current reserves with a target.",
    dependents:
      "Dependents can change how much uncertainty the emergency-fund interpretation should disclose.",
    income_pattern:
      "Income stability affects how the emergency-fund range should be explained.",
    job_stability:
      "Job stability affects whether the target explanation should emphasize income-interruption risk.",
    monthly_essential_expenses:
      "Required monthly outflows are needed to translate target months into dollars.",
    target_months:
      "A user-selected target month value is needed before the display can show a single personalized target.",
    user_target_months:
      "A user-selected target month value is needed before the display can show a single personalized target.",
  };
  return (
    reasons[value] ??
    "This context is preserved as missing instead of being converted into a zero-dollar assumption."
  );
}

function mapSection(section: PlatformReportSection): ReportSection {
  return {
    id: section.section_id,
    question: section.question,
    answer: section.answer,
    evidenceLevel: section.evidence_level,
    evidenceSourceIds: section.evidence_source_ids,
    limitations: section.limitations,
  };
}

function mapFinding(finding: PlatformFinding): Finding {
  return {
    id: finding.finding_id,
    title: finding.title,
    summary: finding.summary,
    whyItMatters: finding.why_it_matters,
    options: finding.options,
    limitations: finding.limitations,
    educationTopics: finding.education_topics,
    evidenceSourceIds: finding.evidence_source_ids,
  };
}

function mapEvidenceSource(source: PlatformEvidenceSource): EvidenceSource {
  return {
    id: source.source_id,
    publisher: source.publisher,
    title: source.title,
    url: source.url,
    reviewedOn: source.reviewed_on,
    supports: source.supports,
    limitations: source.limitations,
  };
}

function mapAsset(asset: PlatformWorkspaceAsset): SnapshotItem {
  return {
    id: asset.asset_id,
    name: asset.name,
    category: labelValue(asset.category),
    value: money(asset.balance),
    liquidity: labelValue(asset.liquidity),
    provenance: mapProvenance(asset.provenance),
    emergencyEligible: asset.emergency_fund_eligible,
  };
}

function mapLiability(liability: PlatformWorkspaceLiability): SnapshotItem {
  return {
    id: liability.liability_id,
    name: liability.name,
    category: labelValue(liability.category),
    value: money(liability.balance),
    liquidity: "Debt",
    provenance: mapProvenance(liability.provenance),
    emergencyEligible: false,
  };
}

function mapProvenance(value: string): Provenance {
  const provenanceMap: Record<string, Provenance> = {
    calculated: "calculated",
    estimated: "estimated",
    missing: "missing",
    reference_data: "source-backed",
    user_entered: "user-entered",
  };
  const provenance = provenanceMap[value];
  if (provenance) {
    return provenance;
  }

  console.warn("Unknown platform provenance value", { provenance: value });
  return "missing";
}

function money(value: DecimalValue): string {
  const amount = decimal(value);
  if (amount === null) {
    return "Missing";
  }
  return formatMoney(amount);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function decimal(value: DecimalValue): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function monthlySurplusText(value: number | null): string {
  if (value === null) {
    return "Missing";
  }
  if (value < 0) {
    return `${formatMoney(Math.abs(value))} short`;
  }
  return `${formatMoney(value)} left`;
}

function titleCase(value: string): string {
  return labelValue(value);
}

function labelValue(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function labelList(values: string[]): string[] {
  return values.map(labelValue);
}
