import { NextResponse } from "next/server";

import { getChargeInspectorReviewData } from "@/lib/report-review/platform-report";

export const dynamic = "force-dynamic";

const CSV_REVIEW_REQUEST_ERROR =
  "Charge Inspector CSV request could not be processed.";
const PLATFORM_CHARGE_INSPECTOR_ERROR =
  "The platform Charge Inspector service could not be reached. Please try again in a moment.";
const MAX_CSV_TEXT_LENGTH = 250_000;

class ChargeInspectorRouteError extends Error {}

export async function POST(request: Request) {
  try {
    const csvText = parseCsvText(await jsonBody(request));
    const review = await getChargeInspectorReviewData({ csvText });

    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof ChargeInspectorRouteError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Charge Inspector CSV request failed", error);
    return NextResponse.json(
      { error: PLATFORM_CHARGE_INSPECTOR_ERROR },
      { status: 502 },
    );
  }
}

async function jsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ChargeInspectorRouteError(CSV_REVIEW_REQUEST_ERROR);
  }
}

function parseCsvText(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ChargeInspectorRouteError(
      "Charge Inspector CSV request must be an object.",
    );
  }

  const csvText = (value as Record<string, unknown>).csvText;
  if (typeof csvText !== "string") {
    throw new ChargeInspectorRouteError("csvText must be submitted as text.");
  }

  if (csvText.trim().length === 0) {
    throw new ChargeInspectorRouteError("csvText must not be blank.");
  }

  if (csvText.length > MAX_CSV_TEXT_LENGTH) {
    throw new ChargeInspectorRouteError(
      "csvText must be 250,000 characters or fewer.",
    );
  }

  return csvText;
}
