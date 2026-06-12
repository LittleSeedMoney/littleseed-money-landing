import type { Metadata } from "next";

import { EvidenceSection } from "@/components/report-review/evidence-section";
import { FindingsSection } from "@/components/report-review/findings-section";
import { InputsSection } from "@/components/report-review/inputs-section";
import { OverviewSection } from "@/components/report-review/overview-section";
import { ReportReviewHeader } from "@/components/report-review/report-review-header";
import { ReportReviewNav } from "@/components/report-review/report-review-nav";
import { ReportSections } from "@/components/report-review/report-sections";
import { ReviewRail } from "@/components/report-review/review-rail";
import { reportReviewSample } from "@/data/report-review-sample";

export const metadata: Metadata = {
  title: "Report review | LittleSeed Money",
  description:
    "Private report review surface for validating financial health report structure, evidence, and uncertainty.",
};

const generatedAt = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
}).format(new Date(reportReviewSample.generatedAt));

const sourceById = new Map(
  reportReviewSample.evidenceSources.map((source) => [source.id, source]),
);

export default function ReportReviewPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-earth-900">
      <ReportReviewHeader />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:px-8">
        <ReportReviewNav />

        <div className="min-w-0 space-y-6">
          <OverviewSection
            generatedAt={generatedAt}
            report={reportReviewSample}
          />
          <ReportSections
            sections={reportReviewSample.sections}
            sourceById={sourceById}
          />
          <FindingsSection findings={reportReviewSample.findings} />
          <EvidenceSection sources={reportReviewSample.evidenceSources} />
          <InputsSection snapshot={reportReviewSample.assetSnapshot} />
        </div>

        <ReviewRail report={reportReviewSample} />
      </div>
    </main>
  );
}
