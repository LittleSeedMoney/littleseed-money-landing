import type {
  ReportReviewSample,
  SnapshotItem,
} from "@/data/report-review-sample";

import { provenanceLabels, ReviewSectionHeading } from "./shared";

export function InputsSection({
  snapshot,
}: {
  snapshot: ReportReviewSample["assetSnapshot"];
}) {
  return (
    <section
      id="inputs"
      aria-labelledby="inputs-heading"
      className="space-y-3"
    >
      <ReviewSectionHeading
        eyebrow="Inputs"
        title="Snapshot and uncertainty"
        description="The surface keeps known values, missing context, and unmeasured categories separate."
        id="inputs-heading"
      />

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          {snapshot.totals.map((metric) => (
            <article
              key={metric.id}
              className="rounded-lg border border-stone-200 bg-stone-50 p-4"
            >
              <h3 className="text-sm font-medium text-earth-700">
                {metric.label}
              </h3>
              <p className="mt-2 text-xl font-semibold text-seed-950">
                {metric.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-earth-700">
                {metric.detail}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <SnapshotTable title="Assets" items={snapshot.assets} />
          <SnapshotTable title="Liabilities" items={snapshot.liabilities} />
        </div>
      </div>
    </section>
  );
}

function SnapshotTable({
  title,
  items,
}: {
  title: string;
  items: SnapshotItem[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-seed-950">{title}</h3>
      <div className="mt-3 overflow-x-auto rounded-lg border border-stone-200">
        <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-[0.12em] text-earth-500">
            <tr>
              <th scope="col" className="px-3 py-3 font-semibold">
                Name
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Value
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Liquidity
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 bg-white">
            {items.map((item) => (
              <tr key={item.name}>
                <td className="px-3 py-3 align-top">
                  <div className="font-medium text-seed-950">{item.name}</div>
                  <div className="mt-1 text-xs text-earth-600">
                    {item.category}
                  </div>
                </td>
                <td className="px-3 py-3 align-top font-medium text-seed-950">
                  {item.value}
                </td>
                <td className="px-3 py-3 align-top text-earth-700">
                  {item.liquidity}
                </td>
                <td className="px-3 py-3 align-top text-earth-700">
                  {provenanceLabels[item.provenance]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
