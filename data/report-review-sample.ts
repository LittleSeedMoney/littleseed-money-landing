export type Provenance =
  | "sample"
  | "user-entered"
  | "calculated"
  | "source-backed"
  | "missing";

export type SummaryMetric = {
  label: string;
  value: string;
  detail: string;
  provenance: Provenance;
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
  name: string;
  category: string;
  value: string;
  liquidity: string;
  provenance: Provenance;
  emergencyEligible: boolean;
};

export type ReportReviewSample = {
  profileName: string;
  reportStatus: string;
  generatedAt: string;
  schemaVersion: string;
  disclaimer: string;
  dataMode: "sample";
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
  assetSnapshot: {
    totals: SummaryMetric[];
    assets: SnapshotItem[];
    liabilities: SnapshotItem[];
  };
};

export const reportReviewSample: ReportReviewSample = {
  profileName: "Sample household profile",
  reportStatus: "Complete",
  generatedAt: "2026-06-12T03:12:55Z",
  schemaVersion: "financial_health_report_v0_3",
  dataMode: "sample",
  disclaimer:
    "This review surface is educational and uses sample data. It is not individualized legal, tax, or investment advice.",
  summaryMetrics: [
    {
      label: "Monthly cash flow",
      value: "$1,280 left",
      detail: "After living expenses, debt payments, and contributions.",
      provenance: "calculated",
    },
    {
      label: "Emergency coverage",
      value: "3.46 months",
      detail: "Reported cash divided by required monthly outflows.",
      provenance: "calculated",
    },
    {
      label: "Debt pressure",
      value: "$35,000 debt",
      detail: "$2,000 meets the high-interest review rule.",
      provenance: "calculated",
    },
    {
      label: "Net worth",
      value: "$33,000",
      detail: "$68,000 assets minus $35,000 liabilities.",
      provenance: "calculated",
    },
    {
      label: "Known contributions",
      value: "$700 / month",
      detail: "Employee and employer contributions reported.",
      provenance: "user-entered",
    },
    {
      label: "Data completeness",
      value: "Partial",
      detail: "Some recurring obligations may be hidden in aggregate inputs.",
      provenance: "missing",
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
  assetSnapshot: {
    totals: [
      {
        label: "Total assets",
        value: "$68,000",
        detail: "Cash, retirement, brokerage, and other assets.",
        provenance: "user-entered",
      },
      {
        label: "Emergency-eligible cash",
        value: "$12,000",
        detail: "Cash currently counted for interruption coverage.",
        provenance: "user-entered",
      },
      {
        label: "Total liabilities",
        value: "$35,000",
        detail: "Student loan, auto loan, and credit-card debt.",
        provenance: "user-entered",
      },
      {
        label: "Liquid net worth",
        value: "-$15,000",
        detail: "Cash plus brokerage minus total liabilities.",
        provenance: "calculated",
      },
    ],
    assets: [
      {
        name: "Checking and savings",
        category: "Cash",
        value: "$12,000",
        liquidity: "cash",
        provenance: "sample",
        emergencyEligible: true,
      },
      {
        name: "Retirement accounts",
        category: "Retirement",
        value: "$45,000",
        liquidity: "invested",
        provenance: "sample",
        emergencyEligible: false,
      },
      {
        name: "Brokerage account",
        category: "Brokerage",
        value: "$8,000",
        liquidity: "invested",
        provenance: "sample",
        emergencyEligible: false,
      },
      {
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
        name: "Student loan",
        category: "Student loan",
        value: "$18,000",
        liquidity: "debt",
        provenance: "sample",
        emergencyEligible: false,
      },
      {
        name: "Auto loan",
        category: "Auto loan",
        value: "$15,000",
        liquidity: "debt",
        provenance: "sample",
        emergencyEligible: false,
      },
      {
        name: "Credit card",
        category: "Credit card",
        value: "$2,000",
        liquidity: "debt",
        provenance: "sample",
        emergencyEligible: false,
      },
    ],
  },
};
