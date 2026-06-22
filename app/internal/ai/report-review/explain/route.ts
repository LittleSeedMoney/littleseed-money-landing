import { NextResponse } from "next/server";

import {
  explainReportReviewFinding,
  parseReportReviewAiRequest,
  ReportReviewAiRequestError,
} from "@/lib/report-review/ai/report-review-ai";

export const dynamic = "force-dynamic";

const AI_DISABLED_ERROR =
  "Report-review AI explanation is available only when the private/dev flag is enabled.";

export async function POST(request: Request) {
  if (!isReportReviewAiEnabled()) {
    return NextResponse.json({ error: AI_DISABLED_ERROR }, { status: 403 });
  }

  try {
    const aiRequest = parseReportReviewAiRequest(await jsonBody(request));
    const answer = await explainReportReviewFinding(aiRequest);

    return NextResponse.json(answer);
  } catch (error) {
    if (error instanceof ReportReviewAiRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Report-review AI explanation request failed", error);
    return NextResponse.json(
      { error: "Report-review AI explanation could not be processed." },
      { status: 502 },
    );
  }
}

async function jsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ReportReviewAiRequestError(
      "AI explanation request must be valid JSON.",
    );
  }
}

function isReportReviewAiEnabled() {
  return (
    process.env.LITTLESEED_REPORT_REVIEW_AI_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_LITTLESEED_REPORT_REVIEW_AI_ENABLED === "true"
  );
}
