"use client";

import { revealAnchor } from "@/lib/report-review/reveal-anchor";

/**
 * Left "on this page" navigator for the long Money narrative. Each item opens
 * its section (via the shared revealAnchor, so collapsed disclosures open) and
 * scrolls to it. Wayfinding only — no data, no state.
 */
const MONEY_SECTIONS: { id: string; label: string }[] = [
  { id: "net-worth", label: "Net worth" },
  { id: "breakdown", label: "What you own and owe" },
  { id: "things-to-look-at", label: "Things to look at" },
  { id: "spending-detail", label: "This month's spending" },
  { id: "charge-inspector", label: "Charge Inspector" },
  { id: "report-findings-details", label: "Report & findings" },
  { id: "portfolio", label: "Balance details" },
  { id: "review-support", label: "Review support" },
];

export function MoneySectionNav({ className }: { className?: string }) {
  return (
    <nav aria-label="On this page" className={className}>
      <div className="lg:sticky lg:top-4">
        <p className="px-2 text-[10.5px] font-bold uppercase tracking-[0.13em] text-earth-600">
          On this page
        </p>
        <ul className="mt-2 space-y-0.5">
          {MONEY_SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-earth-700 outline-none hover:bg-seed-50 hover:text-seed-900 focus:ring-2 focus:ring-seed-500"
                onClick={() => revealAnchor(section.id)}
                type="button"
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
