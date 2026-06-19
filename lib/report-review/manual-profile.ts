import { sampleFinancialProfile } from "./sample-profile";

export const MANUAL_ASSET_CATEGORIES = [
  "cash",
  "retirement",
  "brokerage",
  "other",
] as const;

export const MANUAL_DEBT_TYPES = [
  "credit_card",
  "student_loan",
  "auto_loan",
  "personal_loan",
  "medical_debt",
  "other",
] as const;

export type ManualAssetCategory = (typeof MANUAL_ASSET_CATEGORIES)[number];

export type ManualDebtType = (typeof MANUAL_DEBT_TYPES)[number];

export type ManualAssetValue = {
  id: string;
  name: string;
  category: ManualAssetCategory;
  balance: string;
};

export type ManualDebtValue = {
  id: string;
  name: string;
  debtType: ManualDebtType;
  balance: string;
  annualInterestRate: string;
  monthlyPayment: string;
  interestTaxAdvantaged: boolean;
};

export type ManualProfileValues = {
  age: string;
  assets: ManualAssetValue[];
  debts: ManualDebtValue[];
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

export type ManualProfileScalarField = Exclude<
  keyof ManualProfileValues,
  "assets" | "debts"
>;

export type ManualProfileFieldRequirement = "required" | "optional";

export const MANUAL_PROFILE_PRESETS = [
  {
    id: "sample",
    label: "Sample household",
    description: "Current sample values for baseline report review.",
  },
  {
    id: "low_cash_guidance",
    label: "Low cash coverage",
    description: "Cash below one month of required outflows.",
  },
  {
    id: "three_month_boundary",
    label: "Three-month boundary",
    description: "Cash equals exactly three months of required outflows.",
  },
  {
    id: "required_only",
    label: "Minimum request",
    description: "Extra income, dependents, debts, and target removed.",
  },
] as const;

export type ManualProfilePresetId =
  (typeof MANUAL_PROFILE_PRESETS)[number]["id"];

export class ManualProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManualProfileValidationError";
  }
}

export const REQUIRED_DECIMAL_FIELDS: ManualProfileScalarField[] = [
  "monthlyTakeHomeIncome",
  "monthlyHousingCost",
  "monthlyNonHousingEssentialExpenses",
  "monthlyDiscretionaryExpenses",
  "monthlyInvestmentContribution",
];

export const OPTIONAL_DECIMAL_FIELDS: ManualProfileScalarField[] = [
  "grossAnnualIncome",
];

export const OPTIONAL_POSITIVE_DECIMAL_FIELDS: ManualProfileScalarField[] = [
  "userTargetMonths",
];

export const REQUIRED_INTEGER_FIELDS: ManualProfileScalarField[] = [
  "age",
  "expectedYearsInCurrentLocation",
];

export const OPTIONAL_INTEGER_FIELDS: ManualProfileScalarField[] = [
  "dependents",
];

export const REQUIRED_SELECT_FIELDS: ManualProfileScalarField[] = [
  "incomePattern",
  "jobStability",
  "riskTolerance",
];

export const MANUAL_PROFILE_FIELD_REQUIREMENTS =
  buildManualProfileFieldRequirements();

function buildManualProfileFieldRequirements(): Record<
  ManualProfileScalarField,
  ManualProfileFieldRequirement
> {
  const requirements = {} as Record<
    ManualProfileScalarField,
    ManualProfileFieldRequirement
  >;

  for (const field of [
    ...REQUIRED_DECIMAL_FIELDS,
    ...REQUIRED_INTEGER_FIELDS,
    ...REQUIRED_SELECT_FIELDS,
  ]) {
    requirements[field] = "required";
  }

  for (const field of [
    ...OPTIONAL_DECIMAL_FIELDS,
    ...OPTIONAL_POSITIVE_DECIMAL_FIELDS,
    ...OPTIONAL_INTEGER_FIELDS,
  ]) {
    requirements[field] = "optional";
  }

  return requirements;
}

export function defaultManualProfileValues(): ManualProfileValues {
  return manualProfilePresetValues("sample");
}

export function manualProfilePresetValues(
  presetId: ManualProfilePresetId,
): ManualProfileValues {
  const values = sampleManualProfileValues();

  if (presetId === "low_cash_guidance") {
    values.assets = values.assets.map((asset) =>
      asset.category === "cash" ? { ...asset, balance: "1500.00" } : asset,
    );
    values.userTargetMonths = "3";
    return values;
  }

  if (presetId === "three_month_boundary") {
    const cashBalance = targetMonthsCashBalance(values, 3);
    values.assets = values.assets.map((asset) =>
      asset.category === "cash" ? { ...asset, balance: cashBalance } : asset,
    );
    values.userTargetMonths = "3";
    return values;
  }

  if (presetId === "required_only") {
    values.debts = [];
    values.dependents = "";
    values.grossAnnualIncome = "";
    values.userTargetMonths = "";
    return values;
  }

  return values;
}

function sampleManualProfileValues(): ManualProfileValues {
  return {
    age: String(sampleFinancialProfile.age),
    assets: [
      {
        id: "asset-cash",
        name: "Cash and cash equivalents",
        category: "cash",
        balance: String(sampleFinancialProfile.assets.cash),
      },
      {
        id: "asset-retirement",
        name: "Retirement accounts",
        category: "retirement",
        balance: String(sampleFinancialProfile.assets.retirement),
      },
      {
        id: "asset-brokerage",
        name: "Taxable brokerage",
        category: "brokerage",
        balance: String(sampleFinancialProfile.assets.brokerage),
      },
      {
        id: "asset-other",
        name: "Other assets",
        category: "other",
        balance: String(sampleFinancialProfile.assets.other),
      },
    ],
    debts: sampleFinancialProfile.debts.map((debt, index) => ({
      id: `debt-${index}`,
      name: debt.name,
      debtType: debt.debt_type as ManualDebtType,
      balance: String(debt.balance),
      annualInterestRate: String(debt.annual_interest_rate),
      monthlyPayment: String(debt.monthly_payment),
      interestTaxAdvantaged: debt.interest_tax_advantaged,
    })),
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

function targetMonthsCashBalance(
  values: ManualProfileValues,
  targetMonths: number,
): string {
  const monthlyDebtPayments = values.debts.reduce(
    (total, debt) => total + decimalNumber(debt.monthlyPayment),
    0,
  );
  const monthlyRequiredOutflows =
    decimalNumber(values.monthlyHousingCost) +
    decimalNumber(values.monthlyNonHousingEssentialExpenses) +
    monthlyDebtPayments;

  return decimalString(monthlyRequiredOutflows * targetMonths);
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
    assets: buildAssets(normalized.assets),
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

function buildAssets(
  assets: ManualAssetValue[],
): Record<ManualAssetCategory, string> {
  const totals = Object.fromEntries(
    MANUAL_ASSET_CATEGORIES.map((category) => [category, 0]),
  ) as Record<ManualAssetCategory, number>;

  for (const asset of assets) {
    totals[asset.category] += decimalNumber(asset.balance);
  }

  return Object.fromEntries(
    MANUAL_ASSET_CATEGORIES.map((category) => [
      category,
      decimalString(totals[category]),
    ]),
  ) as Record<ManualAssetCategory, string>;
}

function buildDebts(values: ManualProfileValues): Array<Record<string, unknown>> {
  return values.debts.flatMap((debt) => {
    const balance = decimalNumber(debt.balance);

    if (balance === 0) {
      return [];
    }

    return [
      {
        name: debt.name,
        debt_type: debt.debtType,
        balance: debt.balance,
        annual_interest_rate: debt.annualInterestRate,
        monthly_payment: debt.monthlyPayment,
        interest_tax_advantaged: debt.interestTaxAdvantaged,
      },
    ];
  });
}

function normalizeValues(values: ManualProfileValues): ManualProfileValues {
  return {
    ...values,
    age: values.age.trim(),
    assets: Array.isArray(values.assets)
      ? values.assets.map((asset) => ({
          ...asset,
          id: asset.id.trim(),
          name: asset.name.trim(),
          category: asset.category,
          balance: asset.balance.trim(),
        }))
      : [],
    debts: Array.isArray(values.debts)
      ? values.debts.map((debt) => ({
          ...debt,
          id: debt.id.trim(),
          name: debt.name.trim(),
          debtType: debt.debtType,
          balance: debt.balance.trim(),
          annualInterestRate: debt.annualInterestRate.trim(),
          monthlyPayment: debt.monthlyPayment.trim(),
        }))
      : [],
    dependents: values.dependents.trim(),
    expectedYearsInCurrentLocation:
      values.expectedYearsInCurrentLocation.trim(),
    grossAnnualIncome: values.grossAnnualIncome.trim(),
    incomePattern: values.incomePattern.trim(),
    jobStability: values.jobStability.trim(),
    monthlyDiscretionaryExpenses:
      values.monthlyDiscretionaryExpenses.trim(),
    monthlyHousingCost: values.monthlyHousingCost.trim(),
    monthlyInvestmentContribution:
      values.monthlyInvestmentContribution.trim(),
    monthlyNonHousingEssentialExpenses:
      values.monthlyNonHousingEssentialExpenses.trim(),
    monthlyTakeHomeIncome: values.monthlyTakeHomeIncome.trim(),
    riskTolerance: values.riskTolerance.trim(),
    userTargetMonths: values.userTargetMonths.trim(),
  };
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
  validateAssets(values.assets);
  validateDebts(values.debts);
}

function validateAssets(assets: ManualAssetValue[]): void {
  if (assets.length === 0) {
    throw new ManualProfileValidationError("At least one asset row is required.");
  }

  assets.forEach((asset, index) => {
    const label = `Asset ${index + 1}`;
    requireText(asset.name, `${label} name`);
    requireAssetCategory(asset.category, `${label} category`);
    requireDecimalWithLabel(asset.balance, `${label} balance`);
  });
}

function validateDebts(debts: ManualDebtValue[]): void {
  debts.forEach((debt, index) => {
    const label = `Liability ${index + 1}`;
    requireDebtType(debt.debtType, `${label} type`);
    requireDecimalWithLabel(debt.balance, `${label} balance`);
    requireDecimalWithLabel(debt.annualInterestRate, `${label} APR`);
    requireDecimalWithLabel(debt.monthlyPayment, `${label} monthly payment`);

    const balance = decimalNumber(debt.balance);
    const annualInterestRate = decimalNumber(debt.annualInterestRate);
    const monthlyPayment = decimalNumber(debt.monthlyPayment);

    if (balance === 0) {
      if (annualInterestRate !== 0 || monthlyPayment !== 0) {
        throw new ManualProfileValidationError(
          `When ${debt.name || "a liability"} balance is 0, APR and monthly payment must also be 0.`,
        );
      }
    }

    if (balance > 0) {
      requireText(debt.name, `${label} name`);
    }
  });
}

function requireDecimal(value: string, field: ManualProfileScalarField): void {
  if (!value) {
    throw new ManualProfileValidationError(`${labelField(field)} is required.`);
  }

  requireDecimalWithLabel(value, labelField(field));
}

function requireDecimalWithLabel(value: string, label: string): void {
  if (!value) {
    throw new ManualProfileValidationError(`${label} is required.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ManualProfileValidationError(
      `${label} must be a non-negative number.`,
    );
  }
}

function requirePositiveDecimal(
  value: string,
  field: ManualProfileScalarField,
): void {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ManualProfileValidationError(
      `${labelField(field)} must be greater than 0.`,
    );
  }
}

function requireInteger(value: string, field: ManualProfileScalarField): void {
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

function decimalString(value: number): string {
  return value.toFixed(2);
}

function requireText(value: string, label: string): void {
  if (!value) {
    throw new ManualProfileValidationError(`${label} is required.`);
  }
}

function requireAssetCategory(value: string, label: string): void {
  if (!MANUAL_ASSET_CATEGORIES.includes(value as ManualAssetCategory)) {
    throw new ManualProfileValidationError(`${label} is not supported.`);
  }
}

function requireDebtType(value: string, label: string): void {
  if (!MANUAL_DEBT_TYPES.includes(value as ManualDebtType)) {
    throw new ManualProfileValidationError(`${label} is not supported.`);
  }
}

function labelField(field: ManualProfileScalarField): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}
