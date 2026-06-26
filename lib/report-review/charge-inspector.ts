import type { DecimalValue } from "./platform-workspace-response";
import type {
  PlatformBankFeeCandidate,
  PlatformChargeInspectorReviewResponse,
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

export type ChargeInspectorReview = {
  dataMode: ChargeInspectorDataMode;
  sourceLabel: string;
  reviewedTransactionCount: number;
  spendingSummaryVersion: string;
  monthlySpendingSummary: ChargeInspectorMonthlySummary[];
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
  monthlySpendingSummary: [],
  findings: [],
  emptyState: chargeInspectorSampleReview.emptyState,
  limitations: chargeInspectorSampleReview.limitations,
};

export const chargeInspectorFallbackReview: ChargeInspectorReview = {
  dataMode: "fallback",
  sourceLabel: "Charge Inspector temporarily unavailable",
  reviewedTransactionCount: 0,
  spendingSummaryVersion: "not_available",
  monthlySpendingSummary: [],
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
    .sort((left, right) =>
      left.reviewWindowLabel.localeCompare(right.reviewWindowLabel),
    );
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
    monthlySpendingSummary: response.monthly_spending_summary.map(
      mapMonthlySpendingSummary,
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
): RecurringPaymentReviewItem {
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
