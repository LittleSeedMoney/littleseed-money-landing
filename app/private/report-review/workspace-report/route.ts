import { NextResponse } from "next/server";

import {
  buildManualProfileRequest,
  ManualProfileValidationError,
  type ManualProfileValues,
} from "@/lib/report-review/manual-profile";
import { getManualReportReviewData } from "@/lib/report-review/platform-report";

export const dynamic = "force-dynamic";

const MANUAL_REPORT_REQUEST_ERROR =
  "Manual report request could not be processed.";
const PLATFORM_REPORT_ERROR =
  "The platform report service could not be reached. Please try again in a moment.";

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
  return Object.fromEntries(
    FORM_FIELDS.map((field) => {
      const fieldValue = record[field];
      if (typeof fieldValue !== "string") {
        throw new ManualProfileValidationError(
          `${field} must be submitted as text.`,
        );
      }
      return [field, fieldValue];
    }),
  ) as ManualProfileValues;
}
