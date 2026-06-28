import type { DecimalValue } from "./platform-workspace-response";
import type {
  PlatformBankFeeCandidate,
  PlatformChargeInspectorReviewResponse,
  PlatformTransactionCategoryMonthlyBudgetComparison,
  PlatformTransactionCategoryMonthlyTargetStatus,
  PlatformTransactionCategoryMonthlySummary,
  PlatformTransactionCategorySummary,
  PlatformTransactionCategoryEvidenceRow,
  PlatformMonthlySpendingSummary,
  PlatformDuplicateChargeCandidate,
  PlatformNormalizedTransaction,
  PlatformPriceIncreaseCandidate,
  PlatformRecurringChargeCandidate,
} from "./platform-charge-inspector-response";

export type ChargeInspectorFindingType =
  | "recurring_charge"
  | "duplicate_charge"
  | "bank_fee"
  | "price_increase";

export type ChargeInspectorDataMode =
  | "sample"
  | "platform-sample"
  | "user-csv"
  | "linked-account"
  | "mixed"
  | "empty"
  | "fallback";

export type ChargeInspectorEvidenceRow = {
  id: string;
  postedDate: string;
  merchantName: string;
  amount: string;
  detail: string;
};

export type ChargeInspectorFinding = {
  id: string;
  type: ChargeInspectorFindingType;
  title: string;
  summary: string;
  explanation: string;
  amountLabel: string;
  cadenceLabel?: string;
  evidenceRows: ChargeInspectorEvidenceRow[];
  limitations: string[];
  suggestedReviewSteps: string[];
};

export type ChargeInspectorEmptyState = {
  title: string;
  body: string;
  checks: string[];
};

export type ChargeInspectorMonthlySummary = {
  month: string;
  debitTotalLabel: string;
  creditTotalLabel: string;
  netCashFlowLabel: string;
  transactionCount: number;
  debitTransactionCount: number;
  creditTransactionCount: number;
};

export type ChargeInspectorCategoryReviewStatus =
  | "unreviewed"
  | "confirmed"
  | "needs-review";

export type ChargeInspectorCategoryEvidenceRow = {
  id: string;
  postedDate: string;
  merchantName: string;
  amountLabel: string;
  directionLabel: string;
  ruleId: string;
};

export type ChargeInspectorCategorySummary = {
  category: string;
  label: string;
  debitTotalCents: number;
  debitTotalLabel: string;
  creditTotalCents: number;
  creditTotalLabel: string;
  transactionCount: number;
  debitTransactionCount: number;
  creditTransactionCount: number;
  ruleIds: string[];
  evidenceRows: ChargeInspectorCategoryEvidenceRow[];
  limitations: string[];
};

export type ChargeInspectorCategoryMonthlySummary = {
  month: string;
  category: string;
  label: string;
  debitTotalCents: number;
  debitTotalLabel: string;
  creditTotalCents: number;
  creditTotalLabel: string;
  transactionCount: number;
  debitTransactionCount: number;
  creditTransactionCount: number;
  ruleIds: string[];
  limitations: string[];
};

export type ChargeInspectorCategoryMonthlyBudgetComparisonStatus =
  | "within-target"
  | "over-target"
  | "no-target";

export type ChargeInspectorCategoryMonthlyBudgetComparison = {
  month: string;
  category: string;
  label: string;
  actualDebitTotalCents: number;
  actualDebitTotalLabel: string;
  targetDebitTotalCents: number | null;
  targetDebitTotalLabel: string;
  varianceAmountCents: number | null;
  varianceAmountLabel: string;
  variancePercentLabel: string;
  status: ChargeInspectorCategoryMonthlyBudgetComparisonStatus;
  statusLabel: string;
  limitations: string[];
};

export type ChargeInspectorCategoryMonthlyTargetStatusValue =
  | "over-user-target"
  | "within-user-target"
  | "no-user-target";

export type ChargeInspectorCategoryMonthlyTargetStatus = {
  month: string;
  category: string;
  label: string;
  actualDebitTotalCents: number;
  actualDebitTotalLabel: string;
  targetDebitTotalCents: number | null;
  targetDebitTotalLabel: string;
  varianceAmountCents: number | null;
  varianceAmountLabel: string;
  evidenceRowCount: number;
  targetStatus: ChargeInspectorCategoryMonthlyTargetStatusValue;
  targetStatusLabel: string;
  sourceComparisonVersion: string;
  limitations: string[];
};

export type ChargeInspectorCategoryBudgetComparisonStatus =
  | "within-target"
  | "over-target";

export type ChargeInspectorCategoryBudgetComparison = {
  category: string;
  label: string;
  actualDebitTotalCents: number;
  actualDebitTotalLabel: string;
  targetDebitTotalCents: number;
  targetDebitTotalLabel: string;
  varianceAmountCents: number;
  varianceAmountLabel: string;
  variancePercentLabel: string;
  status: ChargeInspectorCategoryBudgetComparisonStatus;
  statusLabel: string;
  limitations: string[];
};

export type ChargeInspectorCategoryBudgetTargetInputResult = {
  amountCents: number | null;
  errorMessage: string | null;
};

export type ChargeInspectorReview = {
  dataMode: ChargeInspectorDataMode;
  sourceLabel: string;
  reviewedTransactionCount: number;
  spendingSummaryVersion: string;
  categorySummaryVersion: string;
  categoryMonthlySummaryVersion: string;
  categoryMonthlyBudgetComparisonVersion: string;
  categoryMonthlyTargetStatusVersion: string;
  monthlySpendingSummary: ChargeInspectorMonthlySummary[];
  categorySummary: ChargeInspectorCategorySummary[];
  categoryMonthlySummary: ChargeInspectorCategoryMonthlySummary[];
  categoryMonthlyBudgetComparison: ChargeInspectorCategoryMonthlyBudgetComparison[];
  categoryMonthlyTargetStatus: ChargeInspectorCategoryMonthlyTargetStatus[];
  findings: ChargeInspectorFinding[];
  emptyState: ChargeInspectorEmptyState;
  limitations: string[];
};

export type ChargeInspectorSummary = {
  totalFindings: number;
  reviewedTransactionCount: number;
  recurringCount: number;
  duplicateCount: number;
  bankFeeCount: number;
  priceIncreaseCount: number;
};

export type RecurringPaymentReviewItem = {
  id: string;
  merchantName: string;
  amountLabel: string;
  cadenceLabel: string;
  evidenceCountLabel: string;
  lastSeenLabel: string;
  reviewWindowLabel: string;
  limitations: string[];
};

export type ChargeInspectorCategoryBudgetTargetAmounts = Record<string, number>;

export const chargeInspectorCategoryOrder = [
  "income",
  "housing",
  "groceries",
  "utilities",
  "transportation",
  "health",
  "fees",
  "subscriptions",
  "fitness",
  "dining",
  "shopping",
  "uncategorized",
];

const chargeInspectorCategoryIndex = new Map(
  chargeInspectorCategoryOrder.map((category, index) => [category, index]),
);

function compareCategoryIds(left: string, right: string) {
  const orderComparison =
    categorySortIndex(left) - categorySortIndex(right);
  if (orderComparison !== 0) {
    return orderComparison;
  }

  return left.localeCompare(right);
}

function categorySortIndex(category: string) {
  return chargeInspectorCategoryIndex.get(category) ?? Number.MAX_SAFE_INTEGER;
}

type SortableRecurringPaymentReviewItem = RecurringPaymentReviewItem & {
  sortKey: string;
};

export const chargeInspectorFindingTypeLabels: Record<
  ChargeInspectorFindingType,
  string
> = {
  recurring_charge: "Recurring charge",
  duplicate_charge: "Possible duplicate",
  bank_fee: "Possible bank fee",
  price_increase: "Possible price increase",
};

export const chargeInspectorSampleReview: ChargeInspectorReview = {
  dataMode: "sample",
  sourceLabel: "Sample CSV review fixture",
  reviewedTransactionCount: 18,
  spendingSummaryVersion: "sample_fixture",
  categorySummaryVersion: "sample_fixture",
  categoryMonthlySummaryVersion: "sample_fixture",
  categoryMonthlyBudgetComparisonVersion: "sample_fixture",
  categoryMonthlyTargetStatusVersion: "sample_fixture",
  monthlySpendingSummary: [
    {
      month: "2026-03",
      debitTotalLabel: money("25.99"),
      creditTotalLabel: money("0"),
      netCashFlowLabel: cashFlowLabel("-25.99"),
      transactionCount: 2,
      debitTransactionCount: 2,
      creditTransactionCount: 0,
    },
    {
      month: "2026-04",
      debitTotalLabel: money("25.99"),
      creditTotalLabel: money("0"),
      netCashFlowLabel: cashFlowLabel("-25.99"),
      transactionCount: 2,
      debitTransactionCount: 2,
      creditTransactionCount: 0,
    },
    {
      month: "2026-05",
      debitTotalLabel: money("1889.90"),
      creditTotalLabel: money("6400.00"),
      netCashFlowLabel: cashFlowLabel("4510.10"),
      transactionCount: 14,
      debitTransactionCount: 12,
      creditTransactionCount: 2,
    },
  ],
  categorySummary: [
    categorySummary("income", "Income", "0", "6400.00", 2, 0, 2),
    categorySummary("housing", "Housing", "1500.00", "0", 1, 1, 0),
    categorySummary("groceries", "Groceries", "130.56", "0", 2, 2, 0, [
      categoryEvidenceRow(
        "sample-groceries-1",
        "2026-05-03",
        "Corner Grocer",
        "76.44",
        "debit",
        "category.groceries.grocer_text.v0",
      ),
      categoryEvidenceRow(
        "sample-groceries-2",
        "2026-05-18",
        "Corner Grocer",
        "54.12",
        "debit",
        "category.groceries.grocer_text.v0",
      ),
    ]),
    categorySummary("utilities", "Utilities", "118.20", "0", 1, 1, 0),
    categorySummary("transportation", "Transportation", "42.10", "0", 1, 1, 0),
    categorySummary("health", "Health", "23.15", "0", 1, 1, 0),
    categorySummary("fees", "Fees", "12.00", "0", 1, 1, 0, [
      categoryEvidenceRow(
        "sample-bank-fee-1",
        "2026-05-31",
        "Neighborhood Bank Monthly Service Fee",
        "12.00",
        "debit",
        "category.fees.bank_fee_text.v0",
      ),
    ]),
    categorySummary("subscriptions", "Subscriptions", "47.97", "0", 3, 3, 0, [
      categoryEvidenceRow(
        "sample-recurring-streaming-1",
        "2026-03-08",
        "Streamly Premium",
        "15.99",
        "debit",
        "category.subscriptions.recurring_media_text.v0",
      ),
      categoryEvidenceRow(
        "sample-recurring-streaming-2",
        "2026-04-08",
        "Streamly Premium",
        "15.99",
        "debit",
        "category.subscriptions.recurring_media_text.v0",
      ),
      categoryEvidenceRow(
        "sample-recurring-streaming-3",
        "2026-05-09",
        "Streamly Premium",
        "15.99",
        "debit",
        "category.subscriptions.recurring_media_text.v0",
      ),
    ]),
    categorySummary("fitness", "Fitness", "32.50", "0", 3, 3, 0, [
      categoryEvidenceRow(
        "sample-fitness-1",
        "2026-03-21",
        "FitPlan App",
        "10.00",
        "debit",
        "category.fitness.fitplan_text.v0",
      ),
      categoryEvidenceRow(
        "sample-fitness-2",
        "2026-04-21",
        "FitPlan App",
        "10.00",
        "debit",
        "category.fitness.fitplan_text.v0",
      ),
      categoryEvidenceRow(
        "sample-fitness-3",
        "2026-05-21",
        "FitPlan App",
        "12.50",
        "debit",
        "category.fitness.fitplan_text.v0",
      ),
    ]),
    categorySummary("dining", "Dining", "16.50", "0", 2, 2, 0, [
      categoryEvidenceRow(
        "sample-dining-1",
        "2026-05-14",
        "Market Street Coffee",
        "8.25",
        "debit",
        "category.dining.coffee_text.v0",
      ),
      categoryEvidenceRow(
        "sample-dining-2",
        "2026-05-14",
        "Market Street Coffee",
        "8.25",
        "debit",
        "category.dining.coffee_text.v0",
      ),
    ]),
    categorySummary("shopping", "Shopping", "18.90", "0", 1, 1, 0),
  ],
  categoryMonthlySummary: [
    categoryMonthlySummary(
      "2026-03",
      "subscriptions",
      "Subscriptions",
      "15.99",
      "0",
      1,
      1,
      0,
    ),
    categoryMonthlySummary("2026-03", "fitness", "Fitness", "10.00", "0", 1, 1, 0),
    categoryMonthlySummary(
      "2026-04",
      "subscriptions",
      "Subscriptions",
      "15.99",
      "0",
      1,
      1,
      0,
    ),
    categoryMonthlySummary("2026-04", "fitness", "Fitness", "10.00", "0", 1, 1, 0),
    categoryMonthlySummary("2026-05", "income", "Income", "0", "6400.00", 2, 0, 2),
    categoryMonthlySummary("2026-05", "housing", "Housing", "1500.00", "0", 1, 1, 0),
    categoryMonthlySummary("2026-05", "groceries", "Groceries", "130.56", "0", 2, 2, 0),
    categoryMonthlySummary("2026-05", "utilities", "Utilities", "118.20", "0", 1, 1, 0),
    categoryMonthlySummary(
      "2026-05",
      "transportation",
      "Transportation",
      "42.10",
      "0",
      1,
      1,
      0,
    ),
    categoryMonthlySummary("2026-05", "health", "Health", "23.15", "0", 1, 1, 0),
    categoryMonthlySummary("2026-05", "fees", "Fees", "12.00", "0", 1, 1, 0),
    categoryMonthlySummary(
      "2026-05",
      "subscriptions",
      "Subscriptions",
      "15.99",
      "0",
      1,
      1,
      0,
    ),
    categoryMonthlySummary("2026-05", "fitness", "Fitness", "12.50", "0", 1, 1, 0),
    categoryMonthlySummary("2026-05", "dining", "Dining", "16.50", "0", 2, 2, 0),
    categoryMonthlySummary("2026-05", "shopping", "Shopping", "18.90", "0", 1, 1, 0),
  ],
  categoryMonthlyBudgetComparison: [],
  categoryMonthlyTargetStatus: [],
  findings: [
    {
      id: "sample-recurring-streaming",
      type: "recurring_charge",
      title: "Streaming service pattern",
      summary:
        "This looks like a recurring charge because a similar merchant and amount appear across three monthly cycles.",
      explanation:
        "The detector matched merchant text, amount, and approximate monthly spacing. The sample keeps this as a review item because merchant names and posting dates can vary.",
      amountLabel: "$15.99",
      cadenceLabel: "Monthly pattern",
      evidenceRows: [
        {
          id: "sample-recurring-streaming-1",
          postedDate: "2026-03-08",
          merchantName: "Streamly Premium",
          amount: "$15.99",
          detail: "Matched merchant text and amount.",
        },
        {
          id: "sample-recurring-streaming-2",
          postedDate: "2026-04-08",
          merchantName: "Streamly Premium",
          amount: "$15.99",
          detail: "Next monthly cycle.",
        },
        {
          id: "sample-recurring-streaming-3",
          postedDate: "2026-05-09",
          merchantName: "Streamly Premium",
          amount: "$15.99",
          detail: "Similar spacing with one-day posting drift.",
        },
      ],
      limitations: [
        "A recurring pattern does not mean the charge is unwanted.",
        "The sample does not verify contract terms, household use, or merchant category.",
      ],
      suggestedReviewSteps: [
        "Compare the merchant name and dates against the statement.",
        "Decide whether this belongs in the household's recurring expense list.",
      ],
    },
    {
      id: "sample-duplicate-coffee",
      type: "duplicate_charge",
      title: "Same-day coffee shop match",
      summary:
        "Two same-day transactions share the same merchant and amount, so they are shown as a possible duplicate for review.",
      explanation:
        "The detector matched merchant text, amount, and posting date. This may also represent two separate purchases.",
      amountLabel: "$8.25",
      evidenceRows: [
        {
          id: "sample-duplicate-coffee-1",
          postedDate: "2026-05-14",
          merchantName: "Market Street Coffee",
          amount: "$8.25",
          detail: "First matching transaction.",
        },
        {
          id: "sample-duplicate-coffee-2",
          postedDate: "2026-05-14",
          merchantName: "Market Street Coffee",
          amount: "$8.25",
          detail: "Second matching transaction.",
        },
      ],
      limitations: [
        "The sample cannot distinguish two visits from a duplicate posting.",
        "Pending and posted statement rows may differ in real exports.",
      ],
      suggestedReviewSteps: [
        "Check whether two separate purchases occurred on that date.",
        "Keep both rows visible until statement context resolves the match.",
      ],
    },
    {
      id: "sample-bank-fee",
      type: "bank_fee",
      title: "Monthly service fee text",
      summary:
        "This row contains fee-like bank text and is listed separately from ordinary spending categories.",
      explanation:
        "The detector matched conservative bank-fee keywords in the merchant description. It does not infer the account policy behind the fee.",
      amountLabel: "$12.00",
      evidenceRows: [
        {
          id: "sample-bank-fee-1",
          postedDate: "2026-05-31",
          merchantName: "Neighborhood Bank Monthly Service Fee",
          amount: "$12.00",
          detail: "Fee-like description matched.",
        },
      ],
      limitations: [
        "Keyword matching can miss fees with unusual labels.",
        "The sample does not evaluate waiver rules or account eligibility.",
      ],
      suggestedReviewSteps: [
        "Compare the description with the bank statement fee schedule.",
        "Record whether this row should be tracked as a recurring account cost.",
      ],
    },
    {
      id: "sample-price-increase-fitness",
      type: "price_increase",
      title: "Fitness app amount changed",
      summary:
        "A subscription-like merchant moved from $10.00 to $12.50, so the change is shown as a possible price increase.",
      explanation:
        "The detector matched merchant text across billing cycles and found a later amount that differs from the earlier baseline.",
      amountLabel: "$2.50 increase",
      cadenceLabel: "Monthly pattern",
      evidenceRows: [
        {
          id: "sample-price-increase-fitness-1",
          postedDate: "2026-03-21",
          merchantName: "FitPlan App",
          amount: "$10.00",
          detail: "Earlier matched amount.",
        },
        {
          id: "sample-price-increase-fitness-2",
          postedDate: "2026-04-21",
          merchantName: "FitPlan App",
          amount: "$10.00",
          detail: "Baseline repeated.",
        },
        {
          id: "sample-price-increase-fitness-3",
          postedDate: "2026-05-21",
          merchantName: "FitPlan App",
          amount: "$12.50",
          detail: "Later amount differs from baseline.",
        },
      ],
      limitations: [
        "Taxes, plan changes, trials, and prorated charges can change amounts.",
        "The detector does not determine whether a price change was expected.",
      ],
      suggestedReviewSteps: [
        "Compare the changed amount with any notice or receipt.",
        "Keep the earlier amount visible for statement-level comparison.",
      ],
    },
  ],
  emptyState: {
    title: "No visible Charge Inspector findings",
    body: "The current review has no findings to display. No transaction upload, account connection, or stored transaction history is part of this slice.",
    checks: [
      "Recurring-charge, duplicate, fee, and price-change rows would appear here when present.",
      "The view only shows the current in-session review state.",
      "A no-finding state does not prove every transaction is correct.",
    ],
  },
  limitations: [
    "This sample uses static fixture rows, not a live CSV upload.",
    "Findings are review prompts, not ranked actions or financial advice.",
    "No account connection, continuous monitoring, or stored transaction history is introduced.",
  ],
};

export const chargeInspectorEmptyReview: ChargeInspectorReview = {
  dataMode: "empty",
  sourceLabel: "No transaction review source",
  reviewedTransactionCount: 0,
  spendingSummaryVersion: "not_applicable",
  categorySummaryVersion: "not_applicable",
  categoryMonthlySummaryVersion: "not_applicable",
  categoryMonthlyBudgetComparisonVersion: "not_applicable",
  categoryMonthlyTargetStatusVersion: "not_applicable",
  monthlySpendingSummary: [],
  categorySummary: [],
  categoryMonthlySummary: [],
  categoryMonthlyBudgetComparison: [],
  categoryMonthlyTargetStatus: [],
  findings: [],
  emptyState: chargeInspectorSampleReview.emptyState,
  limitations: chargeInspectorSampleReview.limitations,
};

export const chargeInspectorFallbackReview: ChargeInspectorReview = {
  dataMode: "fallback",
  sourceLabel: "Charge Inspector temporarily unavailable",
  reviewedTransactionCount: 0,
  spendingSummaryVersion: "not_available",
  categorySummaryVersion: "not_available",
  categoryMonthlySummaryVersion: "not_available",
  categoryMonthlyBudgetComparisonVersion: "not_available",
  categoryMonthlyTargetStatusVersion: "not_available",
  monthlySpendingSummary: [],
  categorySummary: [],
  categoryMonthlySummary: [],
  categoryMonthlyBudgetComparison: [],
  categoryMonthlyTargetStatus: [],
  findings: [],
  emptyState: {
    title: "Charge Inspector did not load",
    body: "The platform Charge Inspector review was unavailable for this session. The report stays visible and no transaction data is saved.",
    checks: [
      "No CSV upload, account connection, or stored transaction history is introduced.",
      "The view is showing a safe fallback state instead of sample transactions.",
      "A fallback state does not mean a transaction review found no issues.",
    ],
  },
  limitations: [
    "The Charge Inspector API request did not complete for this render.",
    "Findings are review prompts, not ranked actions or financial advice.",
    "No account connection, continuous monitoring, or stored transaction history is introduced.",
  ],
};

export function summarizeChargeInspectorReview(
  review: ChargeInspectorReview,
): ChargeInspectorSummary {
  return {
    totalFindings: review.findings.length,
    reviewedTransactionCount: review.reviewedTransactionCount,
    recurringCount: countFindings(review, "recurring_charge"),
    duplicateCount: countFindings(review, "duplicate_charge"),
    bankFeeCount: countFindings(review, "bank_fee"),
    priceIncreaseCount: countFindings(review, "price_increase"),
  };
}

export function isChargeInspectorEmpty(review: ChargeInspectorReview) {
  return review.findings.length === 0;
}

export function visibleChargeInspectorFindings(
  review: ChargeInspectorReview,
  dismissedFindingIds: Iterable<string>,
) {
  const dismissed = new Set(dismissedFindingIds);
  return review.findings.filter((finding) => !dismissed.has(finding.id));
}

export function recurringPaymentReviewItems(
  findings: Iterable<ChargeInspectorFinding>,
): RecurringPaymentReviewItem[] {
  return [...findings]
    .filter((finding) => finding.type === "recurring_charge")
    .map(recurringPaymentReviewItem)
    .sort((left, right) => left.sortKey.localeCompare(right.sortKey))
    .map(({ sortKey: _sortKey, ...item }) => item);
}

export function parseCategoryBudgetTargetInput(
  value: string,
): ChargeInspectorCategoryBudgetTargetInputResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { amountCents: null, errorMessage: null };
  }

  const normalized = trimmed.replace(/[$,\s]/g, "");
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) {
    return {
      amountCents: null,
      errorMessage: "Enter a dollar amount with up to 2 decimals.",
    };
  }

  const [dollars, centsPart = ""] = normalized.split(".");
  const amountCents =
    Number(dollars) * 100 + Number(centsPart.padEnd(2, "0"));

  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    return {
      amountCents: null,
      errorMessage: "Enter a positive target.",
    };
  }

  if (amountCents > 99_999_999) {
    return {
      amountCents: null,
      errorMessage: "Enter a target below $1,000,000.",
    };
  }

  return { amountCents, errorMessage: null };
}

export function categoryBudgetTargetsFromInputs(
  inputs: Record<string, string>,
): ChargeInspectorCategoryBudgetTargetAmounts {
  return Object.fromEntries(
    Object.entries(inputs)
      .map(([category, value]) => [
        category,
        parseCategoryBudgetTargetInput(value).amountCents,
      ] as const)
      .filter((entry): entry is [string, number] => entry[1] !== null),
  );
}

export function compareCategoryBudgetTargets(
  categories: ChargeInspectorCategorySummary[],
  targets: ChargeInspectorCategoryBudgetTargetAmounts,
): ChargeInspectorCategoryBudgetComparison[] {
  return categories
    .map((category) => {
      const targetDebitTotalCents = targets[category.category];
      if (targetDebitTotalCents === undefined) {
        return null;
      }

      return compareCategoryBudgetTarget(category, targetDebitTotalCents);
    })
    .filter(
      (comparison): comparison is ChargeInspectorCategoryBudgetComparison =>
        comparison !== null,
    );
}

export function compareCategoryBudgetTarget(
  category: ChargeInspectorCategorySummary,
  targetDebitTotalCents: number,
): ChargeInspectorCategoryBudgetComparison {
  const varianceAmountCents =
    category.debitTotalCents - targetDebitTotalCents;
  const variancePercent =
    targetDebitTotalCents > 0
      ? (varianceAmountCents / targetDebitTotalCents) * 100
      : 0;
  const status =
    varianceAmountCents > 0 ? "over-target" : "within-target";

  return {
    category: category.category,
    label: category.label,
    actualDebitTotalCents: category.debitTotalCents,
    actualDebitTotalLabel: category.debitTotalLabel,
    targetDebitTotalCents,
    targetDebitTotalLabel: moneyFromCents(targetDebitTotalCents),
    varianceAmountCents,
    varianceAmountLabel: categoryBudgetVarianceLabel(varianceAmountCents),
    variancePercentLabel: `${formatPercent(variancePercent)}% ${
      varianceAmountCents > 0 ? "over" : "within"
    }`,
    status,
    statusLabel: status === "over-target" ? "Over target" : "Within target",
    limitations: [
      "Comparison uses only the user-entered target and the current review-period category debit total.",
      "This is not a recommended budget, spending-quality judgment, or required action.",
    ],
  };
}

export function compareCategoryMonthlyBudgetTargets(
  rows: ChargeInspectorCategoryMonthlySummary[],
  targets: ChargeInspectorCategoryBudgetTargetAmounts,
): ChargeInspectorCategoryMonthlyBudgetComparison[] {
  const targetEntries = Object.entries(targets);
  if (targetEntries.length === 0) {
    return [];
  }

  const rowsByMonthCategory = new Map(
    rows.map((row) => [`${row.month}:${row.category}`, row] as const),
  );
  const observedMonths = [...new Set(rows.map((row) => row.month))].sort();
  const observedCategoriesByMonth = new Map<string, Set<string>>();

  for (const row of rows) {
    const categories = observedCategoriesByMonth.get(row.month) ?? new Set();
    categories.add(row.category);
    observedCategoriesByMonth.set(row.month, categories);
  }

  return observedMonths.flatMap((month) => {
    const categories = [
      ...new Set([
        ...targetEntries.map(([category]) => category),
        ...(observedCategoriesByMonth.get(month) ?? new Set<string>()),
      ]),
    ].sort(compareCategoryIds);

    return categories.map((category) =>
      compareCategoryMonthlyBudgetTarget({
        category,
        month,
        row: rowsByMonthCategory.get(`${month}:${category}`) ?? null,
        targetDebitTotalCents: targets[category] ?? null,
      }),
    );
  });
}

export function mergeCategoryMonthlyBudgetComparisons(
  platformComparisons: ChargeInspectorCategoryMonthlyBudgetComparison[],
  localComparisons: ChargeInspectorCategoryMonthlyBudgetComparison[],
): ChargeInspectorCategoryMonthlyBudgetComparison[] {
  if (localComparisons.length === 0) {
    return platformComparisons;
  }

  if (platformComparisons.length === 0) {
    return localComparisons;
  }

  const mergedByMonthCategory = new Map(
    platformComparisons.map((comparison) => [
      categoryMonthlyBudgetComparisonKey(comparison),
      comparison,
    ]),
  );

  for (const comparison of localComparisons) {
    const key = categoryMonthlyBudgetComparisonKey(comparison);
    if (
      comparison.targetDebitTotalCents !== null ||
      !mergedByMonthCategory.has(key)
    ) {
      mergedByMonthCategory.set(key, comparison);
    }
  }

  return [...mergedByMonthCategory.values()].sort(
    compareCategoryMonthlyBudgetComparisonRows,
  );
}

export function deriveCategoryMonthlyTargetStatuses(
  comparisons: ChargeInspectorCategoryMonthlyBudgetComparison[],
  rows: ChargeInspectorCategoryMonthlySummary[],
): ChargeInspectorCategoryMonthlyTargetStatus[] {
  const rowsByMonthCategory = new Map(
    rows.map((row) => [`${row.month}:${row.category}`, row]),
  );

  return comparisons.map((comparison) =>
    categoryMonthlyTargetStatus({
      comparison,
      row:
        rowsByMonthCategory.get(
          categoryMonthlyBudgetComparisonKey(comparison),
        ) ?? null,
    }),
  );
}

export function mergeCategoryMonthlyTargetStatuses(
  platformTargetStatuses: ChargeInspectorCategoryMonthlyTargetStatus[],
  localTargetStatuses: ChargeInspectorCategoryMonthlyTargetStatus[],
): ChargeInspectorCategoryMonthlyTargetStatus[] {
  if (localTargetStatuses.length === 0) {
    return platformTargetStatuses;
  }

  if (platformTargetStatuses.length === 0) {
    return localTargetStatuses;
  }

  const mergedByMonthCategory = new Map(
    platformTargetStatuses.map((targetStatus) => [
      categoryMonthlyTargetStatusKey(targetStatus),
      targetStatus,
    ]),
  );

  for (const targetStatus of localTargetStatuses) {
    const key = categoryMonthlyTargetStatusKey(targetStatus);
    if (
      targetStatus.targetDebitTotalCents !== null ||
      !mergedByMonthCategory.has(key)
    ) {
      mergedByMonthCategory.set(key, targetStatus);
    }
  }

  return [...mergedByMonthCategory.values()].sort(
    compareCategoryMonthlyTargetStatusRows,
  );
}

function categoryMonthlyTargetStatus({
  comparison,
  row,
}: {
  comparison: ChargeInspectorCategoryMonthlyBudgetComparison;
  row: ChargeInspectorCategoryMonthlySummary | null;
}): ChargeInspectorCategoryMonthlyTargetStatus {
  const targetStatus = categoryMonthlyTargetStatusValue(comparison.status);

  return {
    month: comparison.month,
    category: comparison.category,
    label: comparison.label,
    actualDebitTotalCents: comparison.actualDebitTotalCents,
    actualDebitTotalLabel: comparison.actualDebitTotalLabel,
    targetDebitTotalCents: comparison.targetDebitTotalCents,
    targetDebitTotalLabel: comparison.targetDebitTotalLabel,
    varianceAmountCents: comparison.varianceAmountCents,
    varianceAmountLabel: comparison.varianceAmountLabel,
    evidenceRowCount: row?.debitTransactionCount ?? 0,
    targetStatus,
    targetStatusLabel: categoryMonthlyTargetStatusLabel(targetStatus),
    sourceComparisonVersion: "transaction_category_monthly_budget_comparison_v0",
    limitations: [
      "Target status uses only already-calculated monthly target comparison facts.",
      "This is not spending advice, category ranking, merchant action, or an automation decision.",
    ],
  };
}

function categoryMonthlyTargetStatusValue(
  status: ChargeInspectorCategoryMonthlyBudgetComparisonStatus,
): ChargeInspectorCategoryMonthlyTargetStatusValue {
  if (status === "over-target") {
    return "over-user-target";
  }

  if (status === "within-target") {
    return "within-user-target";
  }

  return "no-user-target";
}

export function compareCategoryMonthlyBudgetTarget({
  category,
  month,
  row,
  targetDebitTotalCents,
}: {
  category: string;
  month: string;
  row: ChargeInspectorCategoryMonthlySummary | null;
  targetDebitTotalCents: number | null;
}): ChargeInspectorCategoryMonthlyBudgetComparison {
  const actualDebitTotalCents = row?.debitTotalCents ?? 0;
  const label = row?.label ?? titleCase(category);

  if (targetDebitTotalCents === null) {
    return {
      month,
      category,
      label,
      actualDebitTotalCents,
      actualDebitTotalLabel: moneyFromCents(actualDebitTotalCents),
      targetDebitTotalCents: null,
      targetDebitTotalLabel: "No target",
      varianceAmountCents: null,
      varianceAmountLabel: "No target",
      variancePercentLabel: "No target",
      status: "no-target",
      statusLabel: "No target",
      limitations: [
        "No user-entered monthly target was provided for this category.",
        "This is not a recommended budget, spending-quality judgment, or required action.",
      ],
    };
  }

  const varianceAmountCents =
    actualDebitTotalCents - targetDebitTotalCents;
  const variancePercent =
    targetDebitTotalCents > 0
      ? (varianceAmountCents / targetDebitTotalCents) * 100
      : 0;
  const status =
    varianceAmountCents > 0 ? "over-target" : "within-target";

  return {
    month,
    category,
    label,
    actualDebitTotalCents,
    actualDebitTotalLabel: moneyFromCents(actualDebitTotalCents),
    targetDebitTotalCents,
    targetDebitTotalLabel: moneyFromCents(targetDebitTotalCents),
    varianceAmountCents,
    varianceAmountLabel: categoryBudgetVarianceLabel(varianceAmountCents),
    variancePercentLabel: `${formatPercent(variancePercent)}% ${
      varianceAmountCents > 0 ? "over" : "within"
    }`,
    status,
    statusLabel: status === "over-target" ? "Over target" : "Within target",
    limitations: [
      "Comparison uses only the user-entered monthly target and the posted-date-month category debit total.",
      "This is not a recommended budget, spending-quality judgment, or required action.",
    ],
  };
}

function categoryMonthlyBudgetComparisonKey(
  comparison: ChargeInspectorCategoryMonthlyBudgetComparison,
) {
  return `${comparison.month}:${comparison.category}`;
}

function categoryMonthlyTargetStatusKey(
  targetStatus: ChargeInspectorCategoryMonthlyTargetStatus,
) {
  return `${targetStatus.month}:${targetStatus.category}`;
}

function compareCategoryMonthlyBudgetComparisonRows(
  left: ChargeInspectorCategoryMonthlyBudgetComparison,
  right: ChargeInspectorCategoryMonthlyBudgetComparison,
) {
  const monthComparison = left.month.localeCompare(right.month);
  if (monthComparison !== 0) {
    return monthComparison;
  }

  const categoryComparison = compareCategoryIds(left.category, right.category);
  if (categoryComparison !== 0) {
    return categoryComparison;
  }

  return left.label.localeCompare(right.label);
}

function compareCategoryMonthlyTargetStatusRows(
  left: ChargeInspectorCategoryMonthlyTargetStatus,
  right: ChargeInspectorCategoryMonthlyTargetStatus,
) {
  const monthComparison = left.month.localeCompare(right.month);
  if (monthComparison !== 0) {
    return monthComparison;
  }

  const categoryComparison = compareCategoryIds(left.category, right.category);
  if (categoryComparison !== 0) {
    return categoryComparison;
  }

  return left.label.localeCompare(right.label);
}

export function mapPlatformChargeInspectorReview(
  response: PlatformChargeInspectorReviewResponse,
): ChargeInspectorReview {
  const evidenceById = new Map(
    response.evidence_transactions.map((transaction) => [
      transaction.transaction_id,
      transaction,
    ]),
  );
  const parseLimitations =
    response.parse_error_count > 0
      ? [
          `${response.parse_error_count.toLocaleString("en-US")} CSV validation issue${
            response.parse_error_count === 1 ? "" : "s"
          } returned from the platform parser.`,
        ]
      : [];

  return {
    dataMode: mapPlatformChargeInspectorDataMode(response.source),
    sourceLabel: platformChargeInspectorSourceLabel(response.source),
    reviewedTransactionCount: response.reviewed_transaction_count,
    spendingSummaryVersion: response.spending_summary_version,
    categorySummaryVersion: response.category_summary_version,
    categoryMonthlySummaryVersion: response.category_monthly_summary_version,
    categoryMonthlyBudgetComparisonVersion:
      response.category_monthly_budget_comparison_version,
    categoryMonthlyTargetStatusVersion:
      response.category_monthly_target_status_version,
    monthlySpendingSummary: response.monthly_spending_summary.map(
      mapMonthlySpendingSummary,
    ),
    categorySummary: response.category_summary.map(mapCategorySummary),
    categoryMonthlySummary: response.category_monthly_summary.map(
      mapCategoryMonthlySummary,
    ),
    categoryMonthlyBudgetComparison:
      response.category_monthly_budget_comparison.map(
        mapCategoryMonthlyBudgetComparison,
      ),
    categoryMonthlyTargetStatus:
      response.category_monthly_target_status.map(
        mapCategoryMonthlyTargetStatus,
      ),
    findings: [
      ...response.findings.recurring_charges.map((candidate) =>
        mapRecurringCharge(candidate, evidenceById),
      ),
      ...response.findings.duplicate_charges.map((candidate) =>
        mapDuplicateCharge(candidate, evidenceById),
      ),
      ...response.findings.bank_fees.map((candidate) =>
        mapBankFee(candidate, evidenceById),
      ),
      ...response.findings.price_increases.map((candidate) =>
        mapPriceIncrease(candidate, evidenceById),
      ),
    ],
    emptyState: chargeInspectorSampleReview.emptyState,
    limitations: [
      ...response.limitations,
      ...parseLimitations,
      `Platform review schema: ${response.schema_version}.`,
    ],
  };
}

function mapCategoryMonthlySummary(
  summary: PlatformTransactionCategoryMonthlySummary,
): ChargeInspectorCategoryMonthlySummary {
  return {
    month: summary.month,
    category: summary.category,
    label: summary.label,
    debitTotalCents: cents(summary.debit_total),
    debitTotalLabel: money(summary.debit_total),
    creditTotalCents: cents(summary.credit_total),
    creditTotalLabel: money(summary.credit_total),
    transactionCount: summary.transaction_count,
    debitTransactionCount: summary.debit_transaction_count,
    creditTransactionCount: summary.credit_transaction_count,
    ruleIds: summary.rule_ids,
    limitations: summary.limitations,
  };
}

function mapCategoryMonthlyBudgetComparison(
  comparison: PlatformTransactionCategoryMonthlyBudgetComparison,
): ChargeInspectorCategoryMonthlyBudgetComparison {
  const targetDebitTotalCents =
    comparison.target_debit_total === null
      ? null
      : cents(comparison.target_debit_total);
  const varianceAmountCents =
    comparison.variance_amount === null ? null : cents(comparison.variance_amount);
  const variancePercent =
    comparison.variance_percent === null
      ? null
      : decimal(comparison.variance_percent);
  const status = mapCategoryMonthlyBudgetComparisonStatus(comparison.status);

  return {
    month: comparison.month,
    category: comparison.category,
    label: comparison.label,
    actualDebitTotalCents: cents(comparison.actual_debit_total),
    actualDebitTotalLabel: money(comparison.actual_debit_total),
    targetDebitTotalCents,
    targetDebitTotalLabel:
      targetDebitTotalCents === null
        ? "No target"
        : moneyFromCents(targetDebitTotalCents),
    varianceAmountCents,
    varianceAmountLabel:
      varianceAmountCents === null
        ? "No target"
        : categoryBudgetVarianceLabel(varianceAmountCents),
    variancePercentLabel:
      variancePercent === null
        ? "No target"
        : `${formatPercent(variancePercent)}% ${
            variancePercent > 0 ? "over" : "within"
          }`,
    status,
    statusLabel: categoryMonthlyBudgetComparisonStatusLabel(status),
    limitations: comparison.limitations,
  };
}

function mapCategoryMonthlyTargetStatus(
  targetStatus: PlatformTransactionCategoryMonthlyTargetStatus,
): ChargeInspectorCategoryMonthlyTargetStatus {
  const targetDebitTotalCents =
    targetStatus.target_debit_total === null
      ? null
      : cents(targetStatus.target_debit_total);
  const varianceAmountCents =
    targetStatus.variance_amount === null
      ? null
      : cents(targetStatus.variance_amount);
  const status = mapCategoryMonthlyTargetStatusValue(targetStatus.target_status);

  return {
    month: targetStatus.month,
    category: targetStatus.category,
    label: targetStatus.label,
    actualDebitTotalCents: cents(targetStatus.actual_debit_total),
    actualDebitTotalLabel: money(targetStatus.actual_debit_total),
    targetDebitTotalCents,
    targetDebitTotalLabel:
      targetDebitTotalCents === null
        ? "No target"
        : moneyFromCents(targetDebitTotalCents),
    varianceAmountCents,
    varianceAmountLabel:
      varianceAmountCents === null
        ? "No target"
        : categoryBudgetVarianceLabel(varianceAmountCents),
    evidenceRowCount: targetStatus.evidence_row_count,
    targetStatus: status,
    targetStatusLabel: categoryMonthlyTargetStatusLabel(status),
    sourceComparisonVersion: targetStatus.source_comparison_version,
    limitations: targetStatus.limitations,
  };
}

function mapCategoryMonthlyBudgetComparisonStatus(
  status: string,
): ChargeInspectorCategoryMonthlyBudgetComparisonStatus {
  if (status === "within_target") {
    return "within-target";
  }

  if (status === "over_target") {
    return "over-target";
  }

  return "no-target";
}

function mapCategoryMonthlyTargetStatusValue(
  status: string,
): ChargeInspectorCategoryMonthlyTargetStatusValue {
  if (status === "over_user_target") {
    return "over-user-target";
  }

  if (status === "within_user_target") {
    return "within-user-target";
  }

  if (status === "no_user_target") {
    return "no-user-target";
  }

  throw new Error(`Unsupported monthly target status: ${status}`);
}

function categoryMonthlyBudgetComparisonStatusLabel(
  status: ChargeInspectorCategoryMonthlyBudgetComparisonStatus,
) {
  if (status === "over-target") {
    return "Over target";
  }

  if (status === "within-target") {
    return "Within target";
  }

  return "No target";
}

function categoryMonthlyTargetStatusLabel(
  status: ChargeInspectorCategoryMonthlyTargetStatusValue,
) {
  if (status === "over-user-target") {
    return "Over user target";
  }

  if (status === "within-user-target") {
    return "Within user target";
  }

  return "No user target";
}

function mapCategorySummary(
  summary: PlatformTransactionCategorySummary,
): ChargeInspectorCategorySummary {
  return {
    category: summary.category,
    label: summary.label,
    debitTotalCents: cents(summary.debit_total),
    debitTotalLabel: money(summary.debit_total),
    creditTotalCents: cents(summary.credit_total),
    creditTotalLabel: money(summary.credit_total),
    transactionCount: summary.transaction_count,
    debitTransactionCount: summary.debit_transaction_count,
    creditTransactionCount: summary.credit_transaction_count,
    ruleIds: summary.rule_ids,
    evidenceRows: summary.evidence_rows.map(mapCategoryEvidenceRow),
    limitations: summary.limitations,
  };
}

function mapCategoryEvidenceRow(
  row: PlatformTransactionCategoryEvidenceRow,
): ChargeInspectorCategoryEvidenceRow {
  return {
    id: row.evidence_id,
    postedDate: row.posted_date,
    merchantName: row.merchant_name,
    amountLabel: money(row.amount),
    directionLabel: titleCase(row.direction),
    ruleId: row.rule_id,
  };
}

function mapMonthlySpendingSummary(
  summary: PlatformMonthlySpendingSummary,
): ChargeInspectorMonthlySummary {
  return {
    month: summary.month,
    debitTotalLabel: money(summary.debit_total),
    creditTotalLabel: money(summary.credit_total),
    netCashFlowLabel: cashFlowLabel(summary.net_cash_flow),
    transactionCount: summary.transaction_count,
    debitTransactionCount: summary.debit_transaction_count,
    creditTransactionCount: summary.credit_transaction_count,
  };
}

function mapPlatformChargeInspectorDataMode(
  source: string,
): ChargeInspectorDataMode {
  if (source === "sample_csv") {
    return "platform-sample";
  }

  if (source === "linked_account") {
    return "linked-account";
  }

  if (source === "mixed") {
    return "mixed";
  }

  return "user-csv";
}

function platformChargeInspectorSourceLabel(source: string) {
  if (source === "sample_csv") {
    return "Platform sample CSV review";
  }

  if (source === "linked_account") {
    return "Platform linked transaction review";
  }

  if (source === "mixed") {
    return "Platform mixed transaction review";
  }

  return "Platform CSV review";
}

function categorySummary(
  category: string,
  label: string,
  debitTotal: DecimalValue,
  creditTotal: DecimalValue,
  transactionCount: number,
  debitTransactionCount: number,
  creditTransactionCount: number,
  evidenceRows: ChargeInspectorCategoryEvidenceRow[] = [],
): ChargeInspectorCategorySummary {
  return {
    category,
    label,
    debitTotalCents: cents(debitTotal),
    debitTotalLabel: money(debitTotal),
    creditTotalCents: cents(creditTotal),
    creditTotalLabel: money(creditTotal),
    transactionCount,
    debitTransactionCount,
    creditTransactionCount,
    ruleIds: ["sample_fixture"],
    evidenceRows,
    limitations: [
      "Category mapping uses deterministic merchant and transaction-type text rules only.",
    ],
  };
}

function categoryMonthlySummary(
  month: string,
  category: string,
  label: string,
  debitTotal: DecimalValue,
  creditTotal: DecimalValue,
  transactionCount: number,
  debitTransactionCount: number,
  creditTransactionCount: number,
): ChargeInspectorCategoryMonthlySummary {
  return {
    month,
    category,
    label,
    debitTotalCents: cents(debitTotal),
    debitTotalLabel: money(debitTotal),
    creditTotalCents: cents(creditTotal),
    creditTotalLabel: money(creditTotal),
    transactionCount,
    debitTransactionCount,
    creditTransactionCount,
    ruleIds: ["sample_fixture"],
    limitations: [
      "Category monthly summary groups deterministic category totals by posted-date month.",
    ],
  };
}

function categoryEvidenceRow(
  id: string,
  postedDate: string,
  merchantName: string,
  amount: DecimalValue,
  direction: string,
  ruleId: string,
): ChargeInspectorCategoryEvidenceRow {
  return {
    id,
    postedDate,
    merchantName,
    amountLabel: money(amount),
    directionLabel: titleCase(direction),
    ruleId,
  };
}

function countFindings(
  review: ChargeInspectorReview,
  type: ChargeInspectorFindingType,
) {
  return review.findings.filter((finding) => finding.type === type).length;
}

function mapRecurringCharge(
  candidate: PlatformRecurringChargeCandidate,
  evidenceById: Map<string, PlatformNormalizedTransaction>,
): ChargeInspectorFinding {
  const cadenceText = titleCase(candidate.cadence).toLowerCase();

  return {
    id: candidate.finding_id,
    type: "recurring_charge",
    title: `${candidate.merchant_name} recurring pattern`,
    summary: candidate.explanation,
    explanation:
      "The platform recurring detector matched " +
      `${candidate.occurrence_count.toLocaleString("en-US")} ${cadenceText} rows from ` +
      `${candidate.first_seen_date} to ${candidate.last_seen_date}.`,
    amountLabel: money(candidate.typical_amount),
    cadenceLabel: titleCase(candidate.cadence),
    evidenceRows: evidenceRows(candidate.evidence_transaction_ids, evidenceById),
    limitations: candidate.limitations,
    suggestedReviewSteps: [
      "Compare the merchant name and dates against the source statement.",
      "Decide whether this belongs in the household's recurring expense list.",
    ],
  };
}

function recurringPaymentReviewItem(
  finding: ChargeInspectorFinding,
): SortableRecurringPaymentReviewItem {
  const latestRow = latestEvidenceRow(finding.evidenceRows);
  const latestDate = latestRow ? parseIsoDate(latestRow.postedDate) : null;
  const cadenceLabel = finding.cadenceLabel ?? "Pattern needs review";

  return {
    id: finding.id,
    merchantName: latestRow?.merchantName ?? finding.title,
    amountLabel: finding.amountLabel,
    cadenceLabel,
    evidenceCountLabel: `${finding.evidenceRows.length.toLocaleString(
      "en-US",
    )} matched row${finding.evidenceRows.length === 1 ? "" : "s"}`,
    lastSeenLabel: latestDate ? formatDate(latestDate) : "Missing",
    reviewWindowLabel: nextReviewWindowLabel(cadenceLabel, latestDate),
    sortKey: latestDate ? latestDate.toISOString() : "9999-12-31T00:00:00.000Z",
    limitations: finding.limitations,
  };
}

function latestEvidenceRow(rows: ChargeInspectorEvidenceRow[]) {
  return rows.reduce<ChargeInspectorEvidenceRow | null>((latest, row) => {
    const rowDate = parseIsoDate(row.postedDate);
    if (!rowDate) {
      return latest;
    }

    const latestDate = latest ? parseIsoDate(latest.postedDate) : null;
    if (!latestDate || rowDate.getTime() > latestDate.getTime()) {
      return row;
    }

    return latest;
  }, null);
}

function nextReviewWindowLabel(cadenceLabel: string, latestDate: Date | null) {
  if (!latestDate) {
    return "Needs statement review";
  }

  if (cadenceLabel.toLowerCase().includes("monthly")) {
    return `Around ${formatDate(addUtcMonths(latestDate, 1))}`;
  }

  return "Cadence needs review";
}

function mapDuplicateCharge(
  candidate: PlatformDuplicateChargeCandidate,
  evidenceById: Map<string, PlatformNormalizedTransaction>,
): ChargeInspectorFinding {
  return {
    id: candidate.finding_id,
    type: "duplicate_charge",
    title: `${candidate.merchant_name} same-day match`,
    summary: candidate.explanation,
    explanation:
      "The platform duplicate detector matched debit rows with the same merchant, date, and amount.",
    amountLabel: money(candidate.amount),
    evidenceRows: evidenceRows(candidate.evidence_transaction_ids, evidenceById),
    limitations: candidate.limitations,
    suggestedReviewSteps: [
      "Check whether separate purchases occurred on that date.",
      "Keep both rows visible until statement context resolves the match.",
    ],
  };
}

function mapBankFee(
  candidate: PlatformBankFeeCandidate,
  evidenceById: Map<string, PlatformNormalizedTransaction>,
): ChargeInspectorFinding {
  return {
    id: candidate.finding_id,
    type: "bank_fee",
    title: `${titleCase(candidate.fee_type)} text`,
    summary: candidate.explanation,
    explanation:
      "The platform bank-fee detector matched conservative fee language in the transaction description.",
    amountLabel: money(candidate.amount),
    evidenceRows: evidenceRows(candidate.evidence_transaction_ids, evidenceById),
    limitations: candidate.limitations,
    suggestedReviewSteps: [
      "Compare the description with the source statement fee schedule.",
      "Record whether this row should be tracked as an account cost.",
    ],
  };
}

function mapPriceIncrease(
  candidate: PlatformPriceIncreaseCandidate,
  evidenceById: Map<string, PlatformNormalizedTransaction>,
): ChargeInspectorFinding {
  return {
    id: candidate.finding_id,
    type: "price_increase",
    title: `${candidate.merchant_name} amount changed`,
    summary: candidate.explanation,
    explanation:
      `The platform price-increase detector compared a ${money(
        candidate.previous_amount,
      )} row with a later ${money(candidate.increased_amount)} row.`,
    amountLabel: `${money(candidate.increase_amount)} increase`,
    cadenceLabel: titleCase(candidate.cadence),
    evidenceRows: evidenceRows(candidate.evidence_transaction_ids, evidenceById),
    limitations: candidate.limitations,
    suggestedReviewSteps: [
      "Compare the changed amount with receipts or notices.",
      "Keep the earlier and later rows visible for statement-level comparison.",
    ],
  };
}

function evidenceRows(
  evidenceTransactionIds: string[],
  evidenceById: Map<string, PlatformNormalizedTransaction>,
): ChargeInspectorEvidenceRow[] {
  return evidenceTransactionIds.map((transactionId) => {
    const transaction = evidenceById.get(transactionId);
    if (!transaction) {
      return {
        id: transactionId,
        postedDate: "Missing",
        merchantName: "Missing evidence row",
        amount: "Missing",
        detail: "The platform finding referenced an evidence row that was not returned.",
      };
    }

    return {
      id: transaction.transaction_id,
      postedDate: transaction.posted_date,
      merchantName: transaction.merchant_name,
      amount: money(transaction.amount),
      detail: `Source row ${transaction.source_row_number.toLocaleString("en-US")}.`,
    };
  });
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );
}

function addUtcMonths(date: Date, months: number) {
  const targetYear = date.getUTCFullYear();
  const targetMonth = date.getUTCMonth() + months;
  const targetDay = date.getUTCDate();
  const daysInTargetMonth = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      Math.min(targetDay, daysInTargetMonth),
    ),
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function money(value: DecimalValue): string {
  const amount = decimal(value);
  if (amount === null) {
    return "Missing";
  }
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(amount);
}

function moneyFromCents(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value / 100);
}

function cents(value: DecimalValue): number {
  const amount = decimal(value);
  return amount === null ? 0 : Math.round(amount * 100);
}

function categoryBudgetVarianceLabel(value: number) {
  const amount = moneyFromCents(Math.abs(value));
  if (value > 0) {
    return `${amount} over`;
  }
  if (value < 0) {
    return `${amount} within`;
  }
  return "$0.00 difference";
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Math.abs(value));
}

function cashFlowLabel(value: DecimalValue): string {
  const amount = decimal(value);
  if (amount === null) {
    return "Missing";
  }
  if (amount < 0) {
    return `${money(Math.abs(amount))} outflow`;
  }
  if (amount === 0) {
    return `${money(amount)} net`;
  }
  return `${money(amount)} net inflow`;
}

function decimal(value: DecimalValue): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function titleCase(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
