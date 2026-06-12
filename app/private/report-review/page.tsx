import type { Metadata } from "next";

import { AssetPortfolioSection } from "@/components/report-review/asset-portfolio-section";
import { EvidenceSection } from "@/components/report-review/evidence-section";
import { FindingsSection } from "@/components/report-review/findings-section";
import { InputsSection } from "@/components/report-review/inputs-section";
import { OverviewSection } from "@/components/report-review/overview-section";
import { ReportReviewHeader } from "@/components/report-review/report-review-header";
import { ReportReviewNav } from "@/components/report-review/report-review-nav";
import { ReportSections } from "@/components/report-review/report-sections";
import { ReviewRail } from "@/components/report-review/review-rail";
import { getReportReviewData } from "@/lib/report-review/platform-report";

export const metadata: Metadata = {
  title: "Report review | LittleSeed Money",
  description:
    "Private report review surface for validating financial health report structure, evidence, and uncertainty.",
};

export const dynamic = "force-dynamic";

export default async function ReportReviewPage() {
  const report = await getReportReviewData();
  const generatedAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(report.generatedAt));
  const sourceById = new Map(
    report.evidenceSources.map((source) => [source.id, source]),
  );

  return (
    <main className="min-h-screen bg-stone-50 text-earth-900">
      <ReportReviewHeader />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:px-8">
        <ReportReviewNav />

        {hasReportContent(report) ? (
          <div className="min-w-0 space-y-6">
            <OverviewSection generatedAt={generatedAt} report={report} />
            <ReportSections sections={report.sections} sourceById={sourceById} />
            <AssetPortfolioSection
              decisionReadiness={report.decisionReadiness}
              portfolio={report.assetPortfolio}
            />
            <FindingsSection findings={report.findings} />
            <EvidenceSection sources={report.evidenceSources} />
            <InputsSection dataCompleteness={report.dataCompleteness} />
          </div>
        ) : (
          <EmptyReportState />
        )}

        <ReviewRail report={report} />
      </div>
    </main>
  );
}

function hasReportContent(report: Awaited<ReturnType<typeof getReportReviewData>>) {
  return report.summaryMetrics.length > 0 || report.sections.length > 0;
}

function EmptyReportState() {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-seed-700">
        Review state
      </p>
      <h2 className="mt-2 text-xl font-semibold text-seed-950">
        No report data returned
      </h2>
      <p className="mt-3 text-sm leading-6 text-earth-700">
        The platform response did not include renderable report sections or
        summary metrics for this session.
      </p>
    </section>
  );
}
