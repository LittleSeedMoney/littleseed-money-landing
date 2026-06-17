import { NextResponse } from "next/server";

import {
  buildManualProfileRequest,
  ManualProfileValidationError,
  type ManualAssetCategory,
  type ManualAssetValue,
  type ManualDebtType,
  type ManualDebtValue,
  type ManualProfileScalarField,
  type ManualProfileValues,
} from "@/lib/report-review/manual-profile";
import { getManualReportReviewData } from "@/lib/report-review/platform-report";

export const dynamic = "force-dynamic";

const MANUAL_REPORT_REQUEST_ERROR =
  "Manual report request could not be processed.";
const PLATFORM_REPORT_ERROR =
  "The platform report service could not be reached. Please try again in a moment.";

const FORM_FIELDS: ManualProfileScalarField[] = [
  "age",
  "dependents",
  "expectedYearsInCurrentLocation",
  "grossAnnualIncome",
  "incomePattern",
  "jobStability",
  "monthlyDiscretionaryExpenses",
  "monthlyHousingCost",
  "monthlyInvestmentContribution",
  "monthlyNonHousingEssentialExpenses",
  "monthlyTakeHomeIncome",
  "riskTolerance",
  "userTargetMonths",
];

export async function POST(request: Request) {
  try {
    const values = parseManualProfileValues(await jsonBody(request));
    const manualRequest = buildManualProfileRequest(values);
    const report = await getManualReportReviewData({
      profile: manualRequest.profile,
      userTargetMonths: manualRequest.userTargetMonths,
      snapshotId: "landing-manual-workspace",
      reportId: "landing-manual-report",
    });

    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof ManualProfileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Manual report-review request failed", error);
    return NextResponse.json({ error: PLATFORM_REPORT_ERROR }, { status: 502 });
  }
}

async function jsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ManualProfileValidationError(MANUAL_REPORT_REQUEST_ERROR);
  }
}

function parseManualProfileValues(value: unknown): ManualProfileValues {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ManualProfileValidationError(
      "Manual report request must be an object.",
    );
  }

  const record = value as Record<string, unknown>;
  const scalarValues = Object.fromEntries(
    FORM_FIELDS.map((field) => {
      const fieldValue = record[field];
      if (typeof fieldValue !== "string") {
        throw new ManualProfileValidationError(
          `${field} must be submitted as text.`,
        );
      }
      return [field, fieldValue];
    }),
  ) as Record<ManualProfileScalarField, string>;

  return {
    ...scalarValues,
    assets: parseAssets(record.assets),
    debts: parseDebts(record.debts),
  };
}

function parseAssets(value: unknown): ManualAssetValue[] {
  if (!Array.isArray(value)) {
    throw new ManualProfileValidationError(
      "assets must be submitted as an array.",
    );
  }

  return value.map((asset, index) => {
    const record = expectRecord(asset, `assets[${index}]`);
    return {
      id: readString(record, "id", `assets[${index}]`),
      name: readString(record, "name", `assets[${index}]`),
      category: readString(
        record,
        "category",
        `assets[${index}]`,
      ) as ManualAssetCategory,
      balance: readString(record, "balance", `assets[${index}]`),
    };
  });
}

function parseDebts(value: unknown): ManualDebtValue[] {
  if (!Array.isArray(value)) {
    throw new ManualProfileValidationError(
      "debts must be submitted as an array.",
    );
  }

  return value.map((debt, index) => {
    const record = expectRecord(debt, `debts[${index}]`);
    return {
      id: readString(record, "id", `debts[${index}]`),
      name: readString(record, "name", `debts[${index}]`),
      debtType: readString(
        record,
        "debtType",
        `debts[${index}]`,
      ) as ManualDebtType,
      balance: readString(record, "balance", `debts[${index}]`),
      annualInterestRate: readString(
        record,
        "annualInterestRate",
        `debts[${index}]`,
      ),
      monthlyPayment: readString(record, "monthlyPayment", `debts[${index}]`),
      interestTaxAdvantaged: readBoolean(
        record,
        "interestTaxAdvantaged",
        `debts[${index}]`,
      ),
    };
  });
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ManualProfileValidationError(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function readString(
  record: Record<string, unknown>,
  field: string,
  label: string,
): string {
  const value = record[field];
  if (typeof value !== "string") {
    throw new ManualProfileValidationError(
      `${label}.${field} must be submitted as text.`,
    );
  }

  return value;
}

function readBoolean(
  record: Record<string, unknown>,
  field: string,
  label: string,
): boolean {
  const value = record[field];
  if (typeof value !== "boolean") {
    throw new ManualProfileValidationError(
      `${label}.${field} must be submitted as true or false.`,
    );
  }

  return value;
}
