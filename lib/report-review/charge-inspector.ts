export type ChargeInspectorFindingType =
  | "recurring_charge"
  | "duplicate_charge"
  | "bank_fee"
  | "price_increase";

export type ChargeInspectorDataMode = "sample" | "empty";

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

export type ChargeInspectorReview = {
  dataMode: ChargeInspectorDataMode;
  sourceLabel: string;
  reviewedTransactionCount: number;
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
  sourceLabel: "Empty review fixture",
  reviewedTransactionCount: 0,
  findings: [],
  emptyState: chargeInspectorSampleReview.emptyState,
  limitations: chargeInspectorSampleReview.limitations,
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

function countFindings(
  review: ChargeInspectorReview,
  type: ChargeInspectorFindingType,
) {
  return review.findings.filter((finding) => finding.type === type).length;
}
