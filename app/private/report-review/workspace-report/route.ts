import { NextResponse } from "next/server";

import {
  buildManualProfileRequest,
  type ManualProfileValues,
} from "@/lib/report-review/manual-profile";
import { getManualReportReviewData } from "@/lib/report-review/platform-report";

export const dynamic = "force-dynamic";

const FORM_FIELDS: Array<keyof ManualProfileValues> = [
  "age",
  "cash",
  "creditCardApr",
  "creditCardBalance",
  "creditCardMonthlyPayment",
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
    const values = parseManualProfileValues(await request.json());
    const manualRequest = buildManualProfileRequest(values);
    const report = await getManualReportReviewData({
      profile: manualRequest.profile,
      userTargetMonths: manualRequest.userTargetMonths,
      snapshotId: "landing-manual-workspace",
      reportId: "landing-manual-report",
    });

    return NextResponse.json({ report });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Manual report request could not be processed.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function parseManualProfileValues(value: unknown): ManualProfileValues {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Manual report request must be an object.");
  }

  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    FORM_FIELDS.map((field) => {
      const fieldValue = record[field];
      if (typeof fieldValue !== "string") {
        throw new Error(`${field} must be submitted as text.`);
      }
      return [field, fieldValue];
    }),
  ) as ManualProfileValues;
}
