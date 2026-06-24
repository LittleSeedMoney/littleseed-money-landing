import type { DecimalValue } from "./platform-workspace-response";

export type PlatformChargeInspectorReviewResponse = {
  schema_version: string;
  review_id: string;
  csv_format: string;
  source: string;
  parser_schema_version: string;
  detector_versions: {
    recurring_charge: string;
    duplicate_charge: string;
    bank_fee: string;
    price_increase: string;
  };
  spending_summary_version: string;
  reviewed_transaction_count: number;
  parse_error_count: number;
  findings: {
    recurring_charges: PlatformRecurringChargeCandidate[];
    duplicate_charges: PlatformDuplicateChargeCandidate[];
    bank_fees: PlatformBankFeeCandidate[];
    price_increases: PlatformPriceIncreaseCandidate[];
  };
  monthly_spending_summary: PlatformMonthlySpendingSummary[];
  evidence_transactions: PlatformNormalizedTransaction[];
  parse_errors: PlatformCsvTransactionValidationError[];
  limitations: string[];
};

export type PlatformMonthlySpendingSummary = {
  schema_version: string;
  month: string;
  currency: string;
  debit_total: DecimalValue;
  credit_total: DecimalValue;
  net_cash_flow: DecimalValue;
  transaction_count: number;
  debit_transaction_count: number;
  credit_transaction_count: number;
};

export type PlatformNormalizedTransaction = {
  transaction_id: string;
  source: string;
  source_row_number: number;
  posted_date: string;
  merchant_name: string;
  original_description: string;
  amount: DecimalValue;
  direction: string;
  currency: string;
  transaction_type: string | null;
};

export type PlatformCsvTransactionValidationError = {
  source_row_number: number;
  field_name: string;
  error_code: string;
  message: string;
};

export type PlatformRecurringChargeCandidate = {
  finding_id: string;
  merchant_name: string;
  currency: string;
  typical_amount: DecimalValue;
  min_amount: DecimalValue;
  max_amount: DecimalValue;
  occurrence_count: number;
  first_seen_date: string;
  last_seen_date: string;
  cadence: string;
  evidence_transaction_ids: string[];
  evidence_source_row_numbers: number[];
  explanation: string;
  limitations: string[];
};

export type PlatformDuplicateChargeCandidate = {
  finding_id: string;
  merchant_name: string;
  currency: string;
  amount: DecimalValue;
  occurrence_count: number;
  posted_date: string;
  evidence_transaction_ids: string[];
  evidence_source_row_numbers: number[];
  explanation: string;
  limitations: string[];
};

export type PlatformBankFeeCandidate = {
  finding_id: string;
  fee_type: string;
  merchant_name: string;
  currency: string;
  amount: DecimalValue;
  occurrence_count: number;
  posted_date: string;
  evidence_transaction_ids: string[];
  evidence_source_row_numbers: number[];
  explanation: string;
  limitations: string[];
};

export type PlatformPriceIncreaseCandidate = {
  finding_id: string;
  merchant_name: string;
  currency: string;
  previous_amount: DecimalValue;
  increased_amount: DecimalValue;
  increase_amount: DecimalValue;
  increase_percent: DecimalValue;
  previous_posted_date: string;
  increased_posted_date: string;
  cadence: string;
  occurrence_count: number;
  evidence_transaction_ids: string[];
  evidence_source_row_numbers: number[];
  explanation: string;
  limitations: string[];
};

export function parseChargeInspectorReviewResponse(
  value: unknown,
): PlatformChargeInspectorReviewResponse {
  const response = expectRecord(value, "charge-inspector response");
  const detectorVersions = expectRecord(
    response.detector_versions,
    "charge-inspector response.detector_versions",
  );
  const findings = expectRecord(
    response.findings,
    "charge-inspector response.findings",
  );

  return {
    schema_version: expectString(
      response.schema_version,
      "charge-inspector response.schema_version",
    ),
    review_id: expectString(
      response.review_id,
      "charge-inspector response.review_id",
    ),
    csv_format: expectString(
      response.csv_format,
      "charge-inspector response.csv_format",
    ),
    source: expectString(response.source, "charge-inspector response.source"),
    parser_schema_version: expectString(
      response.parser_schema_version,
      "charge-inspector response.parser_schema_version",
    ),
    detector_versions: {
      recurring_charge: expectString(
        detectorVersions.recurring_charge,
        "charge-inspector response.detector_versions.recurring_charge",
      ),
      duplicate_charge: expectString(
        detectorVersions.duplicate_charge,
        "charge-inspector response.detector_versions.duplicate_charge",
      ),
      bank_fee: expectString(
        detectorVersions.bank_fee,
        "charge-inspector response.detector_versions.bank_fee",
      ),
      price_increase: expectString(
        detectorVersions.price_increase,
        "charge-inspector response.detector_versions.price_increase",
      ),
    },
    spending_summary_version:
      response.spending_summary_version == null
        ? "not_returned"
        : expectString(
            response.spending_summary_version,
            "charge-inspector response.spending_summary_version",
          ),
    reviewed_transaction_count: expectNumber(
      response.reviewed_transaction_count,
      "charge-inspector response.reviewed_transaction_count",
    ),
    parse_error_count: expectNumber(
      response.parse_error_count,
      "charge-inspector response.parse_error_count",
    ),
    findings: {
      recurring_charges: parseArray(
        findings.recurring_charges,
        "charge-inspector response.findings.recurring_charges",
        parseRecurringChargeCandidate,
      ),
      duplicate_charges: parseArray(
        findings.duplicate_charges,
        "charge-inspector response.findings.duplicate_charges",
        parseDuplicateChargeCandidate,
      ),
      bank_fees: parseArray(
        findings.bank_fees,
        "charge-inspector response.findings.bank_fees",
        parseBankFeeCandidate,
      ),
      price_increases: parseArray(
        findings.price_increases,
        "charge-inspector response.findings.price_increases",
        parsePriceIncreaseCandidate,
      ),
    },
    monthly_spending_summary:
      response.monthly_spending_summary == null
        ? []
        : parseArray(
            response.monthly_spending_summary,
            "charge-inspector response.monthly_spending_summary",
            parseMonthlySpendingSummary,
          ),
    evidence_transactions: parseArray(
      response.evidence_transactions,
      "charge-inspector response.evidence_transactions",
      parseNormalizedTransaction,
    ),
    parse_errors: parseArray(
      response.parse_errors,
      "charge-inspector response.parse_errors",
      parseCsvTransactionValidationError,
    ),
    limitations: parseStringArray(
      response.limitations,
      "charge-inspector response.limitations",
    ),
  };
}

function parseMonthlySpendingSummary(
  value: unknown,
  path: string,
): PlatformMonthlySpendingSummary {
  const summary = expectRecord(value, path);
  return {
    schema_version: expectString(summary.schema_version, `${path}.schema_version`),
    month: expectString(summary.month, `${path}.month`),
    currency: expectString(summary.currency, `${path}.currency`),
    debit_total: expectDecimalValue(summary.debit_total, `${path}.debit_total`),
    credit_total: expectDecimalValue(summary.credit_total, `${path}.credit_total`),
    net_cash_flow: expectDecimalValue(
      summary.net_cash_flow,
      `${path}.net_cash_flow`,
    ),
    transaction_count: expectNumber(
      summary.transaction_count,
      `${path}.transaction_count`,
    ),
    debit_transaction_count: expectNumber(
      summary.debit_transaction_count,
      `${path}.debit_transaction_count`,
    ),
    credit_transaction_count: expectNumber(
      summary.credit_transaction_count,
      `${path}.credit_transaction_count`,
    ),
  };
}

function parseRecurringChargeCandidate(
  value: unknown,
  path: string,
): PlatformRecurringChargeCandidate {
  const candidate = expectRecord(value, path);
  return {
    finding_id: expectString(candidate.finding_id, `${path}.finding_id`),
    merchant_name: expectString(candidate.merchant_name, `${path}.merchant_name`),
    currency: expectString(candidate.currency, `${path}.currency`),
    typical_amount: expectDecimalValue(
      candidate.typical_amount,
      `${path}.typical_amount`,
    ),
    min_amount: expectDecimalValue(candidate.min_amount, `${path}.min_amount`),
    max_amount: expectDecimalValue(candidate.max_amount, `${path}.max_amount`),
    occurrence_count: expectNumber(
      candidate.occurrence_count,
      `${path}.occurrence_count`,
    ),
    first_seen_date: expectString(
      candidate.first_seen_date,
      `${path}.first_seen_date`,
    ),
    last_seen_date: expectString(
      candidate.last_seen_date,
      `${path}.last_seen_date`,
    ),
    cadence: expectString(candidate.cadence, `${path}.cadence`),
    evidence_transaction_ids: parseStringArray(
      candidate.evidence_transaction_ids,
      `${path}.evidence_transaction_ids`,
    ),
    evidence_source_row_numbers: parseNumberArray(
      candidate.evidence_source_row_numbers,
      `${path}.evidence_source_row_numbers`,
    ),
    explanation: expectString(candidate.explanation, `${path}.explanation`),
    limitations: parseStringArray(candidate.limitations, `${path}.limitations`),
  };
}

function parseDuplicateChargeCandidate(
  value: unknown,
  path: string,
): PlatformDuplicateChargeCandidate {
  const candidate = expectRecord(value, path);
  return {
    finding_id: expectString(candidate.finding_id, `${path}.finding_id`),
    merchant_name: expectString(candidate.merchant_name, `${path}.merchant_name`),
    currency: expectString(candidate.currency, `${path}.currency`),
    amount: expectDecimalValue(candidate.amount, `${path}.amount`),
    occurrence_count: expectNumber(
      candidate.occurrence_count,
      `${path}.occurrence_count`,
    ),
    posted_date: expectString(candidate.posted_date, `${path}.posted_date`),
    evidence_transaction_ids: parseStringArray(
      candidate.evidence_transaction_ids,
      `${path}.evidence_transaction_ids`,
    ),
    evidence_source_row_numbers: parseNumberArray(
      candidate.evidence_source_row_numbers,
      `${path}.evidence_source_row_numbers`,
    ),
    explanation: expectString(candidate.explanation, `${path}.explanation`),
    limitations: parseStringArray(candidate.limitations, `${path}.limitations`),
  };
}

function parseBankFeeCandidate(
  value: unknown,
  path: string,
): PlatformBankFeeCandidate {
  const candidate = expectRecord(value, path);
  return {
    finding_id: expectString(candidate.finding_id, `${path}.finding_id`),
    fee_type: expectString(candidate.fee_type, `${path}.fee_type`),
    merchant_name: expectString(candidate.merchant_name, `${path}.merchant_name`),
    currency: expectString(candidate.currency, `${path}.currency`),
    amount: expectDecimalValue(candidate.amount, `${path}.amount`),
    occurrence_count: expectNumber(
      candidate.occurrence_count,
      `${path}.occurrence_count`,
    ),
    posted_date: expectString(candidate.posted_date, `${path}.posted_date`),
    evidence_transaction_ids: parseStringArray(
      candidate.evidence_transaction_ids,
      `${path}.evidence_transaction_ids`,
    ),
    evidence_source_row_numbers: parseNumberArray(
      candidate.evidence_source_row_numbers,
      `${path}.evidence_source_row_numbers`,
    ),
    explanation: expectString(candidate.explanation, `${path}.explanation`),
    limitations: parseStringArray(candidate.limitations, `${path}.limitations`),
  };
}

function parsePriceIncreaseCandidate(
  value: unknown,
  path: string,
): PlatformPriceIncreaseCandidate {
  const candidate = expectRecord(value, path);
  return {
    finding_id: expectString(candidate.finding_id, `${path}.finding_id`),
    merchant_name: expectString(candidate.merchant_name, `${path}.merchant_name`),
    currency: expectString(candidate.currency, `${path}.currency`),
    previous_amount: expectDecimalValue(
      candidate.previous_amount,
      `${path}.previous_amount`,
    ),
    increased_amount: expectDecimalValue(
      candidate.increased_amount,
      `${path}.increased_amount`,
    ),
    increase_amount: expectDecimalValue(
      candidate.increase_amount,
      `${path}.increase_amount`,
    ),
    increase_percent: expectDecimalValue(
      candidate.increase_percent,
      `${path}.increase_percent`,
    ),
    previous_posted_date: expectString(
      candidate.previous_posted_date,
      `${path}.previous_posted_date`,
    ),
    increased_posted_date: expectString(
      candidate.increased_posted_date,
      `${path}.increased_posted_date`,
    ),
    cadence: expectString(candidate.cadence, `${path}.cadence`),
    occurrence_count: expectNumber(
      candidate.occurrence_count,
      `${path}.occurrence_count`,
    ),
    evidence_transaction_ids: parseStringArray(
      candidate.evidence_transaction_ids,
      `${path}.evidence_transaction_ids`,
    ),
    evidence_source_row_numbers: parseNumberArray(
      candidate.evidence_source_row_numbers,
      `${path}.evidence_source_row_numbers`,
    ),
    explanation: expectString(candidate.explanation, `${path}.explanation`),
    limitations: parseStringArray(candidate.limitations, `${path}.limitations`),
  };
}

function parseNormalizedTransaction(
  value: unknown,
  path: string,
): PlatformNormalizedTransaction {
  const transaction = expectRecord(value, path);
  return {
    transaction_id: expectString(transaction.transaction_id, `${path}.transaction_id`),
    source: expectString(transaction.source, `${path}.source`),
    source_row_number: expectNumber(
      transaction.source_row_number,
      `${path}.source_row_number`,
    ),
    posted_date: expectString(transaction.posted_date, `${path}.posted_date`),
    merchant_name: expectString(transaction.merchant_name, `${path}.merchant_name`),
    original_description: expectString(
      transaction.original_description,
      `${path}.original_description`,
    ),
    amount: expectDecimalValue(transaction.amount, `${path}.amount`),
    direction: expectString(transaction.direction, `${path}.direction`),
    currency: expectString(transaction.currency, `${path}.currency`),
    transaction_type:
      transaction.transaction_type == null
        ? null
        : expectString(transaction.transaction_type, `${path}.transaction_type`),
  };
}

function parseCsvTransactionValidationError(
  value: unknown,
  path: string,
): PlatformCsvTransactionValidationError {
  const error = expectRecord(value, path);
  return {
    source_row_number: expectNumber(error.source_row_number, `${path}.source_row_number`),
    field_name: expectString(error.field_name, `${path}.field_name`),
    error_code: expectString(error.error_code, `${path}.error_code`),
    message: expectString(error.message, `${path}.message`),
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

function parseNumberArray(value: unknown, path: string): number[] {
  return parseArray(value, path, expectNumber);
}

function expectRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid platform response: ${path} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid platform response: ${path} must be a string.`);
  }
  return value;
}

function expectNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid platform response: ${path} must be a finite number.`);
  }
  return value;
}

function expectDecimalValue(value: unknown, path: string): DecimalValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    value === null ||
    value === undefined
  ) {
    return value;
  }
  throw new Error(
    `Invalid platform response: ${path} must be a string, number, or null.`,
  );
}
