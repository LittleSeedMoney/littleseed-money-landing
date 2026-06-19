import {
  chargeInspectorFindingTypeLabels,
  type ChargeInspectorFinding,
  type ChargeInspectorSummary,
} from "@/lib/report-review/charge-inspector";

import { StatusPill } from "./shared";

export function ChargeInspectorFindingList({
  findings,
  onHide,
  summary,
}: {
  findings: ChargeInspectorFinding[];
  onHide: (findingId: string) => void;
  summary: ChargeInspectorSummary;
}) {
  return (
    <ul
      aria-label="Charge Inspector findings"
      className="divide-y divide-stone-200 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"
    >
      {findings.map((finding) => (
        <li data-testid="charge-inspector-finding" key={finding.id}>
          <ChargeInspectorFindingListItem
            finding={finding}
            onHide={onHide}
            summary={summary}
          />
        </li>
      ))}
    </ul>
  );
}

function ChargeInspectorFindingListItem({
  finding,
  onHide,
  summary,
}: {
  finding: ChargeInspectorFinding;
  onHide: (findingId: string) => void;
  summary: ChargeInspectorSummary;
}) {
  return (
    <article data-finding-id={finding.id}>
      <details className="group" open>
        <summary className="cursor-pointer list-none p-4 outline-none focus:ring-2 focus:ring-seed-500 [&::-webkit-details-marker]:hidden">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                <span
                  aria-hidden="true"
                  className="h-0 w-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-earth-700 transition-transform group-open:rotate-90"
                />
                <h3 className="text-base font-semibold text-seed-950">
                  {finding.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <StatusPill
                    label={chargeInspectorFindingTypeLabels[finding.type]}
                    tone={findingTone(finding.type)}
                  />
                  {finding.cadenceLabel ? (
                    <StatusPill label={finding.cadenceLabel} tone="stone" />
                  ) : null}
                </div>
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-earth-700">
                {finding.summary}
              </p>
            </div>

            <button
              className="min-h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-earth-800 shadow-sm hover:border-seed-300 hover:text-seed-900 focus:outline-none focus:ring-2 focus:ring-seed-500"
              data-testid={`charge-inspector-hide-${finding.id}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onHide(finding.id);
              }}
              type="button"
            >
              Hide
            </button>
          </div>
        </summary>

        <div className="grid gap-3 border-t border-stone-200 px-4 pb-4 pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,360px)] lg:items-start">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-seed-950">
              Evidence rows
            </h4>
            <ul className="mt-2 divide-y divide-stone-200 overflow-hidden rounded-md border border-stone-200 bg-white">
              {finding.evidenceRows.map((row) => (
                <li
                  className="grid gap-2 p-2.5 text-sm sm:grid-cols-[112px_minmax(0,1fr)_96px] sm:items-start"
                  key={row.id}
                >
                  <span className="font-medium tabular-nums text-earth-800">
                    {row.postedDate}
                  </span>
                  <span className="min-w-0 break-words text-earth-800">
                    {row.merchantName}
                    <span className="block text-earth-600">{row.detail}</span>
                  </span>
                  <span className="font-semibold tabular-nums text-seed-950 sm:text-right">
                    {row.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <FindingFactPanel finding={finding} summary={summary} />
            <FindingReviewNotes finding={finding} />
          </div>
        </div>
      </details>
    </article>
  );
}

function FindingFactPanel({
  finding,
  summary,
}: {
  finding: ChargeInspectorFinding;
  summary: ChargeInspectorSummary;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-2.5">
      <dl>
        <div>
          <dt className="text-xs font-medium text-earth-600">Amount</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-seed-950">
            {finding.amountLabel}
          </dd>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-stone-200 pt-2.5">
          <CompactFact
            label="Evidence rows"
            value={finding.evidenceRows.length.toLocaleString("en-US")}
          />
          <CompactFact
            label="Reviewed rows"
            value={summary.reviewedTransactionCount.toLocaleString("en-US")}
          />
          <CompactFact label="Prompt" value="Needs review" />
        </div>
      </dl>
    </div>
  );
}

function CompactFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-earth-600">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-earth-800">
        {value}
      </dd>
    </div>
  );
}

function FindingReviewNotes({
  finding,
}: {
  finding: ChargeInspectorFinding;
}) {
  return (
    <details className="rounded-md border border-stone-200 bg-stone-50 p-2.5">
      <summary className="cursor-pointer text-sm font-semibold text-seed-950 focus:outline-none focus:ring-2 focus:ring-seed-500">
        Review notes
      </summary>
      <div className="mt-3 space-y-3 text-sm leading-6 text-earth-700">
        <div>
          <h5 className="font-semibold text-seed-950">Why it appears</h5>
          <p className="mt-1">{finding.explanation}</p>
        </div>
        <FindingNoteList
          items={finding.suggestedReviewSteps}
          title="Review steps"
        />
        <FindingNoteList title="Limitations" items={finding.limitations} />
      </div>
    </details>
  );
}

function FindingNoteList({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  return (
    <div>
      <h5 className="font-semibold text-seed-950">{title}</h5>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li className="ml-4 list-disc" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function findingTone(type: ChargeInspectorFinding["type"]) {
  if (type === "duplicate_charge" || type === "price_increase") {
    return "earth";
  }

  if (type === "bank_fee") {
    return "stone";
  }

  return "seed";
}
