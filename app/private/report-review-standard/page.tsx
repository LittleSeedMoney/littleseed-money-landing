import type { Metadata } from "next";

import { TunedReportReview } from "@/components/report-review-tuned/tuned-report-review";

export const metadata: Metadata = {
  title: "Report review tuned | LittleSeed Money",
  description:
    "Visual tuning preview for the private financial health report review surface.",
};

export default function ReportReviewStandardPage() {
  return <TunedReportReview />;
}
