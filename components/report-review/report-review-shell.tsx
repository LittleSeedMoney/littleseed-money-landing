import type { ReactNode } from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import type { ReportReviewScreenId } from "@/lib/report-review/report-review-screens";

import { AtAGlanceSection } from "./at-a-glance-section";
import { MoneySectionNav } from "./money-section-nav";
import { ReportReviewHeader } from "./report-review-header";
import { ReviewRail } from "./review-rail";

export function ReportReviewShell({
  activeScreen,
  children,
  dataLabel,
  onScreenSelect,
  report,
}: {
  activeScreen: ReportReviewScreenId;
  children: ReactNode;
  dataLabel: string;
  onScreenSelect: (screen: ReportReviewScreenId) => void;
  report: ReportReviewSample;
}) {
  // The left "on this page" navigator and the right-rail at-a-glance answers are
  // Money-screen wayfinding; Goals/Learn keep the simpler two-column layout.
  const isMoney = activeScreen === "money";

  return (
    <main className="report-review-app min-h-screen bg-stone-50 text-earth-900">
      <ReportReviewHeader
        activeScreen={activeScreen}
        dataLabel={dataLabel}
        onScreenSelect={onScreenSelect}
      />

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div
          className={`grid gap-4 ${
            isMoney
              ? "lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[152px_minmax(0,1fr)_300px]"
              : "lg:grid-cols-[minmax(0,1fr)_280px]"
          }`}
        >
          {isMoney ? <MoneySectionNav className="hidden xl:block" /> : null}

          <section
            aria-labelledby={`report-review-tab-${activeScreen}`}
            className="min-w-0 space-y-4"
            id={`report-review-screen-${activeScreen}`}
            role="tabpanel"
          >
            <h2 className="sr-only">
              {activeScreen.replace("-", " ")} screen
            </h2>
            {children}
          </section>

          {isMoney ? (
            <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
              {/* Desktop-only: on mobile the answers render in the Money
                  narrative (before the disclosures) via the screen panel, so the
                  question-first order holds; this rail copy is hidden below lg. */}
              <AtAGlanceSection
                className="hidden lg:block"
                summaryMetrics={report.summaryMetrics}
              />
              <ReviewRail report={report} />
            </div>
          ) : (
            <ReviewRail report={report} />
          )}
        </div>
      </div>
    </main>
  );
}
