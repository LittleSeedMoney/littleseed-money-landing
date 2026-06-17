export type Provenance =
  | "sample"
  | "user-entered"
  | "calculated"
  | "estimated"
  | "source-backed"
  | "missing";

export type MetricDisclosure = {
  measures: string;
  calculation: string;
  assumptions: string[];
  limitations: string[];
};

export type SummaryMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  provenance: Provenance;
  disclosure?: MetricDisclosure;
};

export type ReportSection = {
  id: string;
  question: string;
  answer: string;
  evidenceLevel: string;
  evidenceSourceIds: string[];
  limitations: string[];
};

export type Finding = {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  options: string[];
  limitations: string[];
  educationTopics: string[];
  evidenceSourceIds: string[];
};

export type EvidenceSource = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  reviewedOn: string;
  supports: string;
  limitations: string[];
};

export type SnapshotItem = {
  id: string;
  name: string;
  category: string;
  value: string;
  liquidity: string;
  provenance: Provenance;
  emergencyEligible: boolean;
};

export type PortfolioNote = {
  id: string;
  title: string;
  body: string;
};

export type DecisionReadinessInput = {
  id: string;
  label: string;
  value: string;
  provenance: Provenance;
  detail?: string;
};

export type DecisionReadinessMissingInput = {
  id: string;
  label: string;
  whyItMatters: string;
};

export type DecisionReadinessUserTarget = {
  targetMonths: string;
  targetAmount: string;
  gapAmount: string;
  alignmentLabel: string;
  alignmentDetail: string;
};

export type GuidanceRuleTrace = {
  id: string;
  allowedPhrasing: string;
  trigger: string;
  evidenceSourceIds: string[];
  requiredGuards: string[];
  ruleVersion: string;
};

export type DecisionReadiness = {
  id: string;
  title: string;
  status: string;
  explanation: string;
  availableInputs: DecisionReadinessInput[];
  resultMetrics: DecisionReadinessInput[];
  userSelectedTarget: DecisionReadinessUserTarget | null;
  missingInputs: DecisionReadinessMissingInput[];
  assumptions: string[];
  limitations: string[];
  educationTopics: string[];
  evidenceSourceIds: string[];
  guidanceRules: GuidanceRuleTrace[];
  guidanceRuleVersion: string;
  modelVersion: string;
};

export type ReportReviewSample = {
  profileName: string;
  reportStatus: string;
  generatedAt: string;
  schemaVersion: string;
  disclaimer: string;
  dataMode: string;
  connectionNotice: {
    tone: "amber" | "red" | "seed";
    message: string;
  };
  summaryMetrics: SummaryMetric[];
  sections: ReportSection[];
  findings: Finding[];
  evidenceSources: EvidenceSource[];
  dataCompleteness: {
    status: string;
    explanation: string;
    uncertainty: string[];
    missingContext: string[];
    potentiallyUnmeasuredCategories: string[];
  };
  assetPortfolio: {
    totals: SummaryMetric[];
    assets: SnapshotItem[];
    liabilities: SnapshotItem[];
    notes: PortfolioNote[];
  };
  decisionReadiness: DecisionReadiness;
};

export const reportReviewSample: ReportReviewSample = {
  profileName: "Sample household profile",
  reportStatus: "Complete",
  generatedAt: "2026-06-12T03:12:55Z",
  schemaVersion: "financial_health_report_v0_3",
  dataMode: "Sample",
  connectionNotice: {
    tone: "amber",
    message:
      "Platform API connector is not configured in this environment. Showing sample report data for layout review. No user data was sent or saved.",
  },
  disclaimer:
    "This review surface is educational and uses sample data. It is not individualized legal, tax, or investment advice.",
  summaryMetrics: [
    {
      id: "monthly_cash_flow",
      label: "Monthly cash flow",
      value: "$1,280 left",
      detail: "After living expenses, debt payments, and contributions.",
      provenance: "calculated",
      disclosure: {
        measures:
          "Money left after reported monthly outflows and known contributions.",
        calculation:
          "Reported take-home income minus living expenses, debt payments, and contributions.",
        assumptions: [
          "The monthly take-home income value was provided by the user.",
          "Irregular income and expenses are not normalized in this preview.",
        ],
        limitations: [
          "This is not a recommendation about what to do with remaining cash.",
        ],
      },
    },
    {
      id: "emergency_coverage",
      label: "Emergency coverage",
      value: "3.46 months",
      detail: "Reported cash divided by required monthly outflows.",
      provenance: "calculated",
      disclosure: {
        measures:
          "How many months reported emergency-eligible cash could cover required monthly outflows.",
        calculation:
          "Emergency-eligible cash divided by required monthly outflows.",
        assumptions: [
          "Retirement and brokerage assets are excluded from emergency cash.",
          "Required outflows use the obligations included in the sample report.",
        ],
        limitations: [
          "This preview does not set a personalized emergency-fund target.",
        ],
      },
    },
    {
      id: "debt_pressure",
      label: "Debt pressure",
      value: "$35,000 debt",
      detail: "$2,000 meets the high-interest review rule.",
      provenance: "calculated",
      disclosure: {
        measures:
          "Total reported debt and debts that triggered an evidence-linked review finding.",
        calculation: "Reported liability balances grouped by debt type.",
        assumptions: [
          "Debt balances and payment amounts are user-entered sample values.",
        ],
        limitations: [
          "This is not a repayment priority or underwriting ratio.",
        ],
      },
    },
    {
      id: "net_worth",
      label: "Net worth",
      value: "$33,000",
      detail: "$68,000 assets minus $35,000 liabilities.",
      provenance: "calculated",
      disclosure: {
        measures: "Reported assets minus reported liabilities.",
        calculation: "Total assets minus total liabilities.",
        assumptions: [
          "Asset values are sample user-entered balances, not live market data.",
        ],
        limitations: [
          "Taxes, selling costs, penalties, and market movement are excluded.",
        ],
      },
    },
    {
      id: "known_contributions",
      label: "Known contributions",
      value: "$700 / month",
      detail: "Employee and employer contributions reported.",
      provenance: "user-entered",
      disclosure: {
        measures:
          "Known monthly employee and employer contributions in the sample profile.",
        calculation:
          "Monthly employee contribution plus monthly employer contribution.",
        assumptions: [
          "The sample treats the contribution amount as already known.",
        ],
        limitations: [
          "Eligibility, limits, vesting, and tax treatment are not validated.",
        ],
      },
    },
    {
      id: "data_completeness",
      label: "Data completeness",
      value: "Partial",
      detail: "Some recurring obligations may be hidden in aggregate inputs.",
      provenance: "missing",
      disclosure: {
        measures:
          "Whether unknown or aggregated inputs limit report interpretation.",
        calculation:
          "Known missing fields and possibly unmeasured categories reviewed together.",
        assumptions: [
          "Missing optional values are preserved as missing, not converted to zero.",
        ],
        limitations: [
          "A partial data state can still support calculations while limiting interpretation.",
        ],
      },
    },
  ],
  sections: [
    {
      id: "monthly_cash_flow",
      question: "Is money left at the end of the month?",
      answer:
        "Based on what was entered, this sample household has $1,280 left each month after living expenses, debt payments, and contributions.",
      evidenceLevel: "calculation",
      evidenceSourceIds: [
        "cfpb_prioritizing_bills",
        "federal_reserve_financial_obligations_ratio",
      ],
      limitations: [
        "Irregular income and expenses are not converted to monthly amounts.",
        "The result reflects user-provided monthly amounts and payment obligations.",
      ],
    },
    {
      id: "emergency_resilience",
      question: "How long could the household handle an income interruption?",
      answer:
        "If income stopped, reported cash could cover about 3.46 months of required household costs under these assumptions.",
      evidenceLevel: "calculation",
      evidenceSourceIds: [],
      limitations: [
        "Brokerage and retirement assets are excluded from emergency cash.",
        "The model does not set a target number of emergency months.",
      ],
    },
    {
      id: "debt_pressure",
      question: "How much pressure is debt creating?",
      answer:
        "The sample profile includes $35,000 in total debt and $770 in monthly payments. One credit-card balance meets the evidence-backed high-interest review rule.",
      evidenceLevel: "calculation",
      evidenceSourceIds: ["sec_investor_gov_high_interest_debt"],
      limitations: [
        "Payment ratios are calculations, not health thresholds or underwriting ratios.",
        "A high-interest finding does not establish repayment priority.",
      ],
    },
    {
      id: "net_worth",
      question: "What does the household own and owe?",
      answer:
        "The sample profile includes $68,000 in assets and $35,000 in debt, for a current net worth of $33,000.",
      evidenceLevel: "calculation",
      evidenceSourceIds: [],
      limitations: [
        "The model does not estimate taxes, selling costs, or early-withdrawal penalties.",
        "Asset liquidity and market-price uncertainty are not modeled.",
      ],
    },
    {
      id: "long_term_contribution",
      question: "How is the household preparing for the future?",
      answer:
        "The sample profile includes known employee and employer contributions of $700 per month, or $8,400 per year.",
      evidenceLevel: "calculation",
      evidenceSourceIds: ["irs_roth_comparison_chart", "irs_publication_969_hsa"],
      limitations: [
        "The model does not validate account eligibility, vesting, or contribution limits.",
        "Contribution percentages are facts, not readiness ratings or recommendations.",
      ],
    },
    {
      id: "areas_to_review",
      question: "Which areas may deserve closer review?",
      answer:
        "One evidence-linked finding was generated: a high-interest debt area to review.",
      evidenceLevel: "official guidance",
      evidenceSourceIds: ["sec_investor_gov_high_interest_debt"],
      limitations: [
        "Findings identify areas to review and are not a ranked action plan.",
      ],
    },
  ],
  findings: [
    {
      id: "high_interest_debt_detected",
      title: "High-interest debt was identified",
      summary:
        "The sample credit-card debt meets the current high-interest review rule.",
      whyItMatters:
        "Higher interest costs can make balances more expensive to carry over time.",
      options: [
        "Review the APR, minimum payment, and repayment terms.",
        "Compare repayment options without assuming a universal priority.",
      ],
      limitations: [
        "This finding is educational and does not establish repayment priority.",
        "Tax treatment, fees, promotional terms, and variable rates may change the interpretation.",
      ],
      educationTopics: ["debt.interest_cost", "debt.repayment_methods"],
      evidenceSourceIds: ["sec_investor_gov_high_interest_debt"],
    },
  ],
  evidenceSources: [
    {
      id: "sec_investor_gov_high_interest_debt",
      publisher: "U.S. Securities and Exchange Commission",
      title: "Pay Off Credit Cards or Other High Interest Debt",
      url: "https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/pay-credit-cards-or-other-high-interest",
      reviewedOn: "2026-06-10",
      supports:
        "Investor.gov describes other high-interest debt as about 8% or above when it offers no tax advantage.",
      limitations: [
        "This is educational guidance, not a statutory or universal definition.",
        "The source does not determine whether a specific debt is tax deductible.",
      ],
    },
    {
      id: "cfpb_prioritizing_bills",
      publisher: "Consumer Financial Protection Bureau",
      title: "Prioritizing bills",
      url: "https://files.consumerfinance.gov/f/documents/cfpb_your-money-your-goals_prioritizing-bills_tool.pdf",
      reviewedOn: "2026-06-10",
      supports:
        "The CFPB organizes bills around consequences of nonpayment and includes housing, utilities, insurance, transportation, debt, and court-ordered obligations.",
      limitations: [
        "The source is an educational prioritization tool, not a universal expense taxonomy.",
      ],
    },
    {
      id: "federal_reserve_financial_obligations_ratio",
      publisher: "Board of Governors of the Federal Reserve System",
      title: "Household Debt Service and Financial Obligations Ratios",
      url: "https://www.federalreserve.gov/releases/housedebt/about.htm",
      reviewedOn: "2026-06-10",
      supports:
        "The Financial Obligations Ratio broadens required payments beyond debt service.",
      limitations: [
        "The published ratio is an aggregate economic measure, not an individual household affordability threshold.",
      ],
    },
    {
      id: "cfpb_emergency_fund_guide",
      publisher: "Consumer Financial Protection Bureau",
      title: "An essential guide to building an emergency fund",
      url: "https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/",
      reviewedOn: "2026-06-12",
      supports:
        "The CFPB describes emergency funds as cash reserves for unplanned expenses or financial emergencies and frames the needed amount as situation-dependent.",
      limitations: [
        "The source does not establish a fixed universal months-of-expenses target.",
        "It is educational guidance, not individualized financial advice.",
      ],
    },
    {
      id: "fdic_money_smart_your_savings",
      publisher: "Federal Deposit Insurance Corporation",
      title: "Money Smart for Adults, Module 5: Your Savings",
      url: "https://www.fdic.gov/consumer-resource-center/money-smart-adults",
      reviewedOn: "2026-06-12",
      supports:
        "FDIC Money Smart for Adults includes a savings module focused on saving for expenses, goals, and emergencies.",
      limitations: [
        "The curriculum is education material and does not define a household-specific target formula.",
        "Module files may change independently from the landing catalog page.",
      ],
    },
    {
      id: "sec_investor_gov_rainy_day",
      publisher: "U.S. Securities and Exchange Commission",
      title: "Save for a Rainy Day",
      url: "https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/save-rainy-day",
      reviewedOn: "2026-06-12",
      supports:
        "Investor.gov frames emergency savings as safe, accessible money and describes a potential upper context of six months of income.",
      limitations: [
        "The source discusses income-based savings context, not the LittleSeed essential-expense target calculation.",
        "It is supplemental education rather than a deterministic rule.",
      ],
    },
    {
      id: "federal_reserve_shed_2025",
      publisher: "Board of Governors of the Federal Reserve System",
      title: "Report on the Economic Well-Being of U.S. Households in 2025",
      url: "https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-executive-summary.htm",
      reviewedOn: "2026-06-12",
      supports:
        "The SHED report provides descriptive emergency-expense and rainy-day-fund resilience benchmarks for U.S. households.",
      limitations: [
        "SHED is population-level descriptive evidence, not personalized advice.",
        "The report does not define an individual household emergency-fund target.",
      ],
    },
    {
      id: "irs_roth_comparison_chart",
      publisher: "Internal Revenue Service",
      title: "Roth comparison chart",
      url: "https://www.irs.gov/retirement-plans/roth-comparison-chart",
      reviewedOn: "2026-06-10",
      supports:
        "The IRS describes designated Roth 401(k) contributions as after-tax and traditional elective contributions as before-tax.",
      limitations: [
        "The source does not determine an individual's eligibility or contribution limit.",
      ],
    },
    {
      id: "irs_publication_969_hsa",
      publisher: "Internal Revenue Service",
      title: "Publication 969: Health Savings Accounts and Other Tax-Favored Health Plans",
      url: "https://www.irs.gov/publications/p969",
      reviewedOn: "2026-06-10",
      supports:
        "The IRS describes federal tax treatment for eligible HSA contributions.",
      limitations: [
        "HSA treatment depends on eligibility and how the contribution is made.",
      ],
    },
  ],
  dataCompleteness: {
    status: "Partial",
    explanation:
      "The report uses the sample values provided, but some optional context or detailed obligation categories remain unknown.",
    uncertainty: [
      "Known required obligations are a minimum based on reported housing and non-mortgage debt payments.",
      "Other recurring obligations may be included in the aggregate non-housing essential expense amount.",
    ],
    missingContext: [],
    potentiallyUnmeasuredCategories: [
      "essential utilities",
      "insurance premiums",
      "childcare obligations",
      "work transportation obligations",
      "court-ordered obligations",
      "property taxes or HOA not in housing cost",
    ],
  },
  assetPortfolio: {
    totals: [
      {
        id: "total_assets",
        label: "Total assets",
        value: "$68,000",
        detail: "Cash, retirement, brokerage, and other assets.",
        provenance: "user-entered",
        disclosure: {
          measures: "Total sample asset balances entered for the household.",
          calculation:
            "Checking and savings plus retirement accounts plus brokerage plus other assets.",
          assumptions: [
            "Balances are sample values and are not refreshed from linked accounts.",
          ],
          limitations: [
            "The total does not model liquidity, taxes, penalties, or sale costs.",
          ],
        },
      },
      {
        id: "emergency_eligible_cash",
        label: "Emergency-eligible cash",
        value: "$12,000",
        detail: "Cash currently counted for interruption coverage.",
        provenance: "user-entered",
        disclosure: {
          measures:
            "Cash-like balances currently counted in emergency coverage calculations.",
          calculation: "Sum of asset rows marked emergency eligible.",
          assumptions: [
            "Only checking and savings are marked emergency eligible in this sample.",
          ],
          limitations: [
            "Eligibility can change with access restrictions, holds, or household context.",
          ],
        },
      },
      {
        id: "total_liabilities",
        label: "Total liabilities",
        value: "$35,000",
        detail: "Student loan, auto loan, and credit-card debt.",
        provenance: "user-entered",
        disclosure: {
          measures: "Total sample liability balances entered for the household.",
          calculation: "Student loan plus auto loan plus credit-card debt.",
          assumptions: [
            "Balances are sample values and are not refreshed from linked accounts.",
          ],
          limitations: [
            "The total does not include accrued interest, fees, or payoff quotes.",
          ],
        },
      },
      {
        id: "liquid_net_worth",
        label: "Liquid net worth",
        value: "-$15,000",
        detail: "Cash plus brokerage minus total liabilities.",
        provenance: "calculated",
        disclosure: {
          measures:
            "A narrower net worth view using cash and brokerage before retirement assets.",
          calculation:
            "Emergency-eligible cash plus brokerage balance minus total liabilities.",
          assumptions: [
            "Retirement assets are excluded from this liquidity-oriented view.",
          ],
          limitations: [
            "This is a review metric, not a liquidation recommendation.",
          ],
        },
      },
    ],
    assets: [
      {
        id: "checking_savings",
        name: "Checking and savings",
        category: "Cash",
        value: "$12,000",
        liquidity: "cash",
        provenance: "sample",
        emergencyEligible: true,
      },
      {
        id: "retirement_accounts",
        name: "Retirement accounts",
        category: "Retirement",
        value: "$45,000",
        liquidity: "invested",
        provenance: "sample",
        emergencyEligible: false,
      },
      {
        id: "brokerage_account",
        name: "Brokerage account",
        category: "Brokerage",
        value: "$8,000",
        liquidity: "invested",
        provenance: "sample",
        emergencyEligible: false,
      },
      {
        id: "other_assets",
        name: "Other assets",
        category: "Other",
        value: "$3,000",
        liquidity: "illiquid",
        provenance: "sample",
        emergencyEligible: false,
      },
    ],
    liabilities: [
      {
        id: "student_loan",
        name: "Student loan",
        category: "Student loan",
        value: "$18,000",
        liquidity: "debt",
        provenance: "sample",
        emergencyEligible: false,
      },
      {
        id: "auto_loan",
        name: "Auto loan",
        category: "Auto loan",
        value: "$15,000",
        liquidity: "debt",
        provenance: "sample",
        emergencyEligible: false,
      },
      {
        id: "credit_card",
        name: "Credit card",
        category: "Credit card",
        value: "$2,000",
        liquidity: "debt",
        provenance: "sample",
        emergencyEligible: false,
      },
    ],
    notes: [
      {
        id: "manual_snapshot",
        title: "Manual snapshot",
        body: "These balances are sample values for a review session. No account history or saved portfolio record exists in this slice.",
      },
      {
        id: "liquidity_boundary",
        title: "Liquidity boundary",
        body: "Emergency coverage uses cash-like balances only. Invested or restricted assets remain visible but are not treated as emergency cash.",
      },
    ],
  },
  decisionReadiness: {
    id: "emergency_fund_target_v0",
    title: "Emergency Fund Target v0",
    status: "Applicable",
    explanation:
      "This preview shows an educational target range, the assumptions behind it, and the registry version that governs any guidance language.",
    availableInputs: [
      {
        id: "emergency_eligible_cash",
        label: "Emergency-eligible cash",
        value: "$12,000",
        provenance: "user-entered",
      },
      {
        id: "required_monthly_outflows",
        label: "Required monthly outflows",
        value: "$3,470",
        provenance: "calculated",
      },
      {
        id: "income_pattern",
        label: "Income pattern",
        value: "Mostly stable",
        provenance: "sample",
      },
      {
        id: "target_range",
        label: "Target range",
        value: "$10,410 to $20,820",
        provenance: "calculated",
        detail: "Three to six months of reported essential expenses.",
      },
    ],
    resultMetrics: [
      {
        id: "current_months_covered",
        label: "Current coverage",
        value: "3.46 months",
        provenance: "calculated",
        detail: "Reported liquid cash divided by required monthly outflows.",
      },
      {
        id: "target_months_range",
        label: "Baseline months",
        value: "3 to 6 months",
        provenance: "source-backed",
        detail: "Educational range; not a single required number.",
      },
      {
        id: "gap_amount_range",
        label: "Gap range",
        value: "$0 to $8,820",
        provenance: "calculated",
        detail: "Target amount range minus reported liquid cash, floored at zero.",
      },
    ],
    userSelectedTarget: null,
    missingInputs: [
      {
        id: "dependents",
        label: "Dependents",
        whyItMatters:
          "Household dependents may change the appropriate interpretation of cash resilience.",
      },
      {
        id: "job_stability",
        label: "Job stability",
        whyItMatters:
          "Job stability affects whether the target explanation should emphasize income-interruption risk.",
      },
    ],
    assumptions: [
      "The range uses reported essential monthly expenses and reported liquid cash.",
      "The base v0 target range is three to six months of essential expenses.",
      "Retirement, restricted, and illiquid assets are excluded from liquid emergency cash.",
    ],
    limitations: [
      "Emergency Fund Target v0 is educational and does not rank emergency savings above other household priorities.",
      "The model does not use regional or demographic expense benchmarks.",
      "The model does not verify whether assets outside reported liquid cash can be converted immediately without market loss, tax, or penalty.",
    ],
    educationTopics: ["emergency_fund.target_range"],
    evidenceSourceIds: [
      "cfpb_emergency_fund_guide",
      "fdic_money_smart_your_savings",
      "sec_investor_gov_rainy_day",
      "federal_reserve_shed_2025",
    ],
    guidanceRules: [],
    guidanceRuleVersion: "guidance_rule_registry_v0",
    modelVersion: "emergency_fund_target_v0",
  },
};
