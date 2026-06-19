import Link from "next/link";

import { SeedMark } from "@/components/seed-mark";
import type { ReportReviewScreenId } from "@/lib/report-review/report-review-screens";

import { ReportReviewNav } from "./report-review-nav";
import { StatusPill } from "./shared";

export function ReportReviewHeader({
  activeScreen,
  dataLabel = "Sample data",
  onScreenSelect,
}: {
  activeScreen?: ReportReviewScreenId;
  dataLabel?: string;
  onScreenSelect?: (screen: ReportReviewScreenId) => void;
}) {
  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur lg:sticky lg:top-0 lg:z-30">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link
          href="/"
          className="flex w-fit items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-seed-500 focus:ring-offset-2"
          aria-label="LittleSeed Money home"
        >
          <SeedMark className="h-8 w-8 text-seed-600" />
          <div>
            <p className="text-xs font-semibold text-seed-700">
              LittleSeed Money
            </p>
            <h1 className="text-lg font-semibold text-earth-900">
              Report review
            </h1>
          </div>
        </Link>

        <div className="flex min-w-0 flex-col gap-3 lg:items-end xl:flex-row-reverse xl:items-center xl:justify-end">
          <div className="flex flex-wrap items-center gap-2 text-sm lg:justify-end">
            <StatusPill label="Private review" tone="earth" />
            <StatusPill label="In-session only" tone="seed" />
            <StatusPill label={dataLabel} tone="stone" />
          </div>
          {activeScreen && onScreenSelect ? (
            <ReportReviewNav
              activeScreen={activeScreen}
              onScreenSelect={onScreenSelect}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
