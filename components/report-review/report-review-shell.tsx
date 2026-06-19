import type { ReactNode } from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import type { ReportReviewScreenId } from "@/lib/report-review/report-review-screens";

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
  return (
    <main className="report-review-app min-h-screen bg-stone-50 text-earth-900">
      <ReportReviewHeader
        activeScreen={activeScreen}
        dataLabel={dataLabel}
        onScreenSelect={onScreenSelect}
      />

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
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

          <ReviewRail report={report} />
        </div>
      </div>
    </main>
  );
}
