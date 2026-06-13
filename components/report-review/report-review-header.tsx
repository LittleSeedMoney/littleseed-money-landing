import Link from "next/link";

import { SeedMark } from "@/components/seed-mark";

import { StatusPill } from "./shared";

export function ReportReviewHeader({
  dataLabel = "Sample data",
}: {
  dataLabel?: string;
}) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link
          href="/"
          className="flex w-fit items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-seed-500 focus:ring-offset-2"
          aria-label="LittleSeed Money home"
        >
          <SeedMark className="h-9 w-9 text-seed-600" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-seed-700">
              LittleSeed Money
            </p>
            <h1 className="text-xl font-semibold text-earth-900">
              Report review
            </h1>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <StatusPill label="Private review" tone="earth" />
          <StatusPill label="In-session only" tone="seed" />
          <StatusPill label={dataLabel} tone="stone" />
        </div>
      </div>
    </header>
  );
}
