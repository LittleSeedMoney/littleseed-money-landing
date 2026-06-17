import { sampleFinancialProfile } from "./sample-profile";

export type ManualProfileValues = {
  age: string;
  cash: string;
  creditCardApr: string;
  creditCardBalance: string;
  creditCardMonthlyPayment: string;
  dependents: string;
  expectedYearsInCurrentLocation: string;
  grossAnnualIncome: string;
  incomePattern: string;
  jobStability: string;
  monthlyDiscretionaryExpenses: string;
  monthlyHousingCost: string;
  monthlyInvestmentContribution: string;
  monthlyNonHousingEssentialExpenses: string;
  monthlyTakeHomeIncome: string;
  riskTolerance: string;
  userTargetMonths: string;
};

export type ManualProfileRequest = {
  profile: Record<string, unknown>;
  userTargetMonths?: string;
};

export class ManualProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManualProfileValidationError";
  }
}

const REQUIRED_DECIMAL_FIELDS: Array<keyof ManualProfileValues> = [
  "monthlyTakeHomeIncome",
  "monthlyHousingCost",
  "monthlyNonHousingEssentialExpenses",
  "monthlyDiscretionaryExpenses",
  "cash",
  "monthlyInvestmentContribution",
  "creditCardBalance",
  "creditCardApr",
  "creditCardMonthlyPayment",
];

const OPTIONAL_DECIMAL_FIELDS: Array<keyof ManualProfileValues> = [
  "grossAnnualIncome",
];

const OPTIONAL_POSITIVE_DECIMAL_FIELDS: Array<keyof ManualProfileValues> = [
  "userTargetMonths",
];

const REQUIRED_INTEGER_FIELDS: Array<keyof ManualProfileValues> = [
  "age",
  "expectedYearsInCurrentLocation",
];

const OPTIONAL_INTEGER_FIELDS: Array<keyof ManualProfileValues> = ["dependents"];

export function defaultManualProfileValues(): ManualProfileValues {
  return {
    age: String(sampleFinancialProfile.age),
    cash: String(sampleFinancialProfile.assets.cash),
    creditCardApr: "22.90",
    creditCardBalance: "2000.00",
    creditCardMonthlyPayment: "100.00",
    dependents: String(sampleFinancialProfile.dependents ?? ""),
    expectedYearsInCurrentLocation: String(
      sampleFinancialProfile.expected_years_in_current_location,
    ),
    grossAnnualIncome: String(sampleFinancialProfile.gross_annual_income ?? ""),
    incomePattern: sampleFinancialProfile.income_pattern,
    jobStability: sampleFinancialProfile.job_stability,
    monthlyDiscretionaryExpenses: String(
      sampleFinancialProfile.monthly_discretionary_expenses,
    ),
    monthlyHousingCost: String(sampleFinancialProfile.monthly_housing_cost),
    monthlyInvestmentContribution: String(
      sampleFinancialProfile.monthly_investment_contribution,
    ),
    monthlyNonHousingEssentialExpenses: String(
      sampleFinancialProfile.monthly_non_housing_essential_expenses,
    ),
    monthlyTakeHomeIncome: String(sampleFinancialProfile.monthly_take_home_income),
    riskTolerance: sampleFinancialProfile.risk_tolerance,
    userTargetMonths: "",
  };
}

export function buildManualProfileRequest(
  values: ManualProfileValues,
): ManualProfileRequest {
  const normalized = normalizeValues(values);
  validateManualProfileValues(normalized);

  const profile: Record<string, unknown> = {
    age: toInteger(normalized.age),
    monthly_take_home_income: normalized.monthlyTakeHomeIncome,
    income_pattern: normalized.incomePattern,
    monthly_housing_cost: normalized.monthlyHousingCost,
    monthly_non_housing_essential_expenses:
      normalized.monthlyNonHousingEssentialExpenses,
    monthly_discretionary_expenses: normalized.monthlyDiscretionaryExpenses,
    assets: {
      cash: normalized.cash,
    },
    debts: buildDebts(normalized),
    risk_tolerance: normalized.riskTolerance,
    job_stability: normalized.jobStability,
    expected_years_in_current_location: toInteger(
      normalized.expectedYearsInCurrentLocation,
    ),
    financial_goals: [],
    relevant_insurance_coverage: [],
    known_major_upcoming_expenses: [],
  };

  if (normalized.grossAnnualIncome) {
    profile.gross_annual_income = normalized.grossAnnualIncome;
  }

  if (normalized.monthlyInvestmentContribution) {
    profile.monthly_investment_contribution =
      normalized.monthlyInvestmentContribution;
  }

  if (normalized.dependents) {
    profile.dependents = toInteger(normalized.dependents);
  }

  return {
    profile,
    userTargetMonths: normalized.userTargetMonths || undefined,
  };
}

function buildDebts(values: ManualProfileValues): Array<Record<string, unknown>> {
  const balance = decimalNumber(values.creditCardBalance);
  const annualInterestRate = decimalNumber(values.creditCardApr);
  const monthlyPayment = decimalNumber(values.creditCardMonthlyPayment);

  if (balance === 0) {
    if (annualInterestRate !== 0 || monthlyPayment !== 0) {
      throw new ManualProfileValidationError(
        "When credit-card balance is 0, APR and monthly payment must also be 0.",
      );
    }
    return [];
  }

  return [
    {
      name: "Credit card",
      debt_type: "credit_card",
      balance: values.creditCardBalance,
      annual_interest_rate: values.creditCardApr,
      monthly_payment: values.creditCardMonthlyPayment,
      interest_tax_advantaged: false,
    },
  ];
}

function normalizeValues(values: ManualProfileValues): ManualProfileValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim()]),
  ) as ManualProfileValues;
}

function validateManualProfileValues(values: ManualProfileValues): void {
  for (const field of REQUIRED_DECIMAL_FIELDS) {
    requireDecimal(values[field], field);
  }
  for (const field of OPTIONAL_DECIMAL_FIELDS) {
    if (values[field]) {
      requireDecimal(values[field], field);
    }
  }
  for (const field of OPTIONAL_POSITIVE_DECIMAL_FIELDS) {
    if (values[field]) {
      requirePositiveDecimal(values[field], field);
    }
  }
  for (const field of REQUIRED_INTEGER_FIELDS) {
    requireInteger(values[field], field);
  }
  for (const field of OPTIONAL_INTEGER_FIELDS) {
    if (values[field]) {
      requireInteger(values[field], field);
    }
  }
}

function requireDecimal(value: string, field: keyof ManualProfileValues): void {
  if (!value) {
    throw new ManualProfileValidationError(`${labelField(field)} is required.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ManualProfileValidationError(
      `${labelField(field)} must be a non-negative number.`,
    );
  }
}

function requirePositiveDecimal(
  value: string,
  field: keyof ManualProfileValues,
): void {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ManualProfileValidationError(
      `${labelField(field)} must be greater than 0.`,
    );
  }
}

function requireInteger(value: string, field: keyof ManualProfileValues): void {
  if (!value) {
    throw new ManualProfileValidationError(`${labelField(field)} is required.`);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ManualProfileValidationError(
      `${labelField(field)} must be a non-negative whole number.`,
    );
  }
}

function toInteger(value: string): number {
  return Number.parseInt(value, 10);
}

function decimalNumber(value: string): number {
  return Number.parseFloat(value);
}

function labelField(field: keyof ManualProfileValues): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}
