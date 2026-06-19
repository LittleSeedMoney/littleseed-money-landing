import type { SnapshotItem } from "@/data/report-review-sample";

import { ProvenanceTag, StatusPill } from "./shared";

export function PortfolioSnapshotList({
  description,
  descriptionId,
  items,
  title,
}: {
  description: string;
  descriptionId: string;
  items: SnapshotItem[];
  title: string;
}) {
  return (
    <section
      aria-describedby={descriptionId}
      className="min-w-0 rounded-lg border border-stone-200 bg-stone-50 p-3"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-seed-950">{title}</h3>
          <p
            id={descriptionId}
            className="mt-0.5 text-sm leading-6 text-earth-700"
          >
            {description}
          </p>
        </div>
        <StatusPill
          label={`${items.length.toLocaleString("en-US")} ${
            items.length === 1 ? "item" : "items"
          }`}
          tone="stone"
        />
      </div>

      <div
        aria-hidden="true"
        className="mt-3 hidden rounded-t-md border border-b-0 border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-earth-500 md:grid md:grid-cols-[minmax(0,1.4fr)_112px_96px_136px_128px] md:gap-3"
      >
        <span>Name</span>
        <span className="text-right">Value</span>
        <span>Liquidity</span>
        <span>Emergency reserve</span>
        <span>Source</span>
      </div>
      <ul className="divide-y divide-stone-200 overflow-hidden rounded-md border border-stone-200 bg-white md:rounded-t-none">
        {items.map((item) => (
          <PortfolioSnapshotItem item={item} key={item.id} />
        ))}
      </ul>
    </section>
  );
}

function PortfolioSnapshotItem({ item }: { item: SnapshotItem }) {
  return (
    <li className="p-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_112px_96px_136px_128px] md:items-start">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-seed-950">
            {item.name}
          </p>
          <p className="mt-1 text-xs leading-5 text-earth-600">
            {item.category}
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 md:contents">
          <SnapshotDetail
            align="end"
            emphasized
            label="Value"
            value={item.value}
          />
          <SnapshotDetail label="Liquidity" value={item.liquidity} />
          <SnapshotDetail
            label="Emergency reserve"
            value={item.emergencyEligible ? "Counts" : "Excluded"}
          />
        </dl>
        <dl className="min-w-0">
          <dt className="text-xs font-medium text-earth-600 md:sr-only">
            Source
          </dt>
          <dd className="mt-1 inline-flex md:mt-0">
            <ProvenanceTag provenance={item.provenance} />
          </dd>
        </dl>
      </div>
    </li>
  );
}

function SnapshotDetail({
  align = "start",
  emphasized = false,
  label,
  value,
}: {
  align?: "end" | "start";
  emphasized?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className={`min-w-0 ${align === "end" ? "md:text-right" : ""}`}>
      <dt className="text-xs font-medium text-earth-600 md:sr-only">
        {label}
      </dt>
      <dd
        className={`mt-1 break-words md:mt-0 ${
          emphasized
            ? "text-sm font-semibold tabular-nums text-seed-950"
            : "text-sm font-medium text-earth-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
