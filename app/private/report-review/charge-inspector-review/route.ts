import { NextResponse } from "next/server";

import {
  ChargeInspectorCsvRequestError,
  chargeInspectorCsvRequestBodyExceedsLimit,
  parseChargeInspectorCsvRequestBody,
} from "@/lib/report-review/charge-inspector-upload";
import { getChargeInspectorReviewData } from "@/lib/report-review/platform-report";

export const dynamic = "force-dynamic";

const CSV_REVIEW_REQUEST_ERROR =
  "Charge Inspector CSV request could not be processed.";
const PLATFORM_CHARGE_INSPECTOR_ERROR =
  "The platform Charge Inspector service could not be reached. Please try again in a moment.";
const CSV_REVIEW_REQUEST_TOO_LARGE =
  "Charge Inspector CSV request body is too large.";

export async function POST(request: Request) {
  try {
    assertRequestBodyLength(request);
    const csvText = parseChargeInspectorCsvRequestBody(await jsonBody(request));
    const review = await getChargeInspectorReviewData({ csvText });

    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof ChargeInspectorCsvRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Charge Inspector CSV request failed", error);
    return NextResponse.json(
      { error: PLATFORM_CHARGE_INSPECTOR_ERROR },
      { status: 502 },
    );
  }
}

function assertRequestBodyLength(request: Request) {
  if (
    chargeInspectorCsvRequestBodyExceedsLimit(
      request.headers.get("content-length"),
    )
  ) {
    throw new ChargeInspectorCsvRequestError(CSV_REVIEW_REQUEST_TOO_LARGE);
  }
}

async function jsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ChargeInspectorCsvRequestError(CSV_REVIEW_REQUEST_ERROR);
  }
}
