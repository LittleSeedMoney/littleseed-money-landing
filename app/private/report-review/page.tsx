import type { Metadata } from "next";

import { ReportReviewWorkspace } from "@/components/report-review/report-review-workspace";
import { getReportReviewData } from "@/lib/report-review/platform-report";

export const metadata: Metadata = {
  title: "Report review | LittleSeed Money",
  description:
    "Private report review surface for validating financial health report structure, evidence, and uncertainty.",
};

export const dynamic = "force-dynamic";

export default async function ReportReviewPage() {
  const report = await getReportReviewData();
  return <ReportReviewWorkspace initialReport={report} />;
}
