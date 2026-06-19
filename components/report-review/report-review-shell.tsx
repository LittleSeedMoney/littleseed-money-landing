import type { ReactNode } from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import type { ReportReviewScreenId } from "@/lib/report-review/report-review-screens";

import { ReportReviewHeader } from "./report-review-header";
import { ReportReviewNav } from "./report-review-nav";
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
  return (
    <main className="report-review-app min-h-screen bg-stone-50 text-earth-900">
      <ReportReviewHeader dataLabel={dataLabel} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ReportReviewNav
          activeScreen={activeScreen}
          onScreenSelect={onScreenSelect}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section
            aria-labelledby={`report-review-tab-${activeScreen}`}
            className="min-w-0 space-y-6"
            id={`report-review-screen-${activeScreen}`}
            role="tabpanel"
          >
            <h2 className="sr-only">
              {activeScreen.replace("-", " ")} screen
            </h2>
            {children}
          </section>

          <ReviewRail report={report} />
        </div>
      </div>
    </main>
  );
}
