"use client";

import { useEffect } from "react";

import { ReportReviewHeader } from "@/components/report-review/report-review-header";
import { ReportReviewNav } from "@/components/report-review/report-review-nav";

export default function ReportReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-stone-50 text-earth-900">
      <ReportReviewHeader />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:px-8">
        <ReportReviewNav />
        <section className="min-w-0 rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-red-700">
            Review unavailable
          </p>
          <h2 className="mt-2 text-xl font-semibold text-seed-950">
            Report review could not load
          </h2>
          <p className="mt-3 text-sm leading-6 text-earth-700">
            The review surface hit an unexpected rendering error. No report was
            saved by this page.
          </p>
          <button
            className="mt-5 rounded-lg border border-seed-700 px-4 py-2 text-sm font-semibold text-seed-800 hover:bg-seed-50 focus:outline-none focus:ring-2 focus:ring-seed-500"
            onClick={reset}
            type="button"
          >
            Retry
          </button>
        </section>
      </div>
    </main>
  );
}
