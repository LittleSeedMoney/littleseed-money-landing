import { ReportReviewHeader } from "@/components/report-review/report-review-header";
import { ReportReviewNav } from "@/components/report-review/report-review-nav";

export default function ReportReviewLoading() {
  return (
    <main className="min-h-screen bg-stone-50 text-earth-900">
      <ReportReviewHeader />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ReportReviewNav />
        <section className="mt-6 min-w-0 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-seed-700">
            Loading
          </p>
          <h2 className="mt-2 text-xl font-semibold text-seed-950">
            Preparing report review
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-lg border border-stone-200 bg-stone-100"
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
