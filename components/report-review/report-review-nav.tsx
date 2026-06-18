"use client";

import {
  reportReviewScreens,
  type ReportReviewScreenId,
} from "@/lib/report-review/report-review-screens";

export function ReportReviewNav({
  activeScreen = "report",
  onScreenSelect,
}: {
  activeScreen?: ReportReviewScreenId;
  onScreenSelect?: (screen: ReportReviewScreenId) => void;
}) {
  return (
    <nav
      aria-label="Report review screens"
      className="rounded-lg border border-stone-200 bg-white p-2 shadow-sm"
    >
      <div
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
        role="tablist"
        aria-orientation="horizontal"
      >
        {reportReviewScreens.map((screen) => {
          const isActive = screen.id === activeScreen;
          return (
            <button
              aria-controls={`report-review-screen-${screen.id}`}
              aria-selected={isActive}
              className={screenTabClass(isActive)}
              data-screen-id={screen.id}
              key={screen.id}
              onClick={() => onScreenSelect?.(screen.id)}
              role="tab"
              type="button"
            >
              <span className="block text-sm font-semibold">{screen.label}</span>
              <span className="mt-1 block text-xs leading-5">
                {screen.description}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function screenTabClass(isActive: boolean) {
  const base =
    "min-h-20 rounded-lg border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-seed-500";
  if (isActive) {
    return `${base} border-seed-300 bg-seed-50 text-seed-950 shadow-sm`;
  }
  return `${base} border-transparent bg-white text-earth-700 hover:border-stone-200 hover:bg-stone-50 hover:text-seed-950`;
}
