import type { ReactNode } from "react";

import type {
  Provenance,
  ReviewDataSourceStatus,
} from "@/data/report-review-sample";
import {
  educationTopicAnchor,
  resolveEducationTopic,
} from "@/lib/report-review/education-topics";

import { joinClasses } from "./class-names";

export { joinClasses } from "./class-names";

export const provenanceLabels: Record<Provenance, string> = {
  sample: "Sample",
  "user-entered": "User-entered",
  "csv-imported": "CSV import",
  "linked-account": "Linked account",
  calculated: "Calculated",
  estimated: "Estimated",
  "source-backed": "Source-backed",
  missing: "Missing context",
};

export const dataSourceStatusLabels: Record<ReviewDataSourceStatus, string> = {
  active: "Active",
  available: "Available",
  empty: "No data",
  fallback: "Fallback",
  future: "Future",
};

export function dataSourceStatusTone(status: ReviewDataSourceStatus) {
  if (status === "active") {
    return "seed";
  }

  if (status === "available") {
    return "earth";
  }

  return "stone";
}

export function reviewPanelClass(className?: string) {
  return joinClasses(
    "rounded-lg border border-stone-200 bg-white shadow-sm",
    className,
  );
}

export function reviewSubtlePanelClass(className?: string) {
  return joinClasses(
    "rounded-lg border border-stone-200 bg-stone-50",
    className,
  );
}

export function reviewDashedPanelClass(className?: string) {
  return joinClasses(
    "rounded-lg border border-dashed border-stone-300 bg-white",
    className,
  );
}

export function reviewDisclosureClass(className?: string) {
  return joinClasses(
    "rounded-md border border-stone-200 bg-stone-50",
    className,
  );
}

export function reviewDisclosureSummaryClass(className?: string) {
  return joinClasses(
    "cursor-pointer text-sm font-semibold text-seed-950 outline-none focus:ring-2 focus:ring-seed-500",
    className,
  );
}

export function reviewInlineDisclosureSummaryClass(className?: string) {
  return joinClasses(
    "cursor-pointer text-sm font-semibold text-seed-700 outline-none underline-offset-4 hover:underline focus:ring-2 focus:ring-seed-500",
    className,
  );
}

export function reviewAccordionCardClass(className?: string) {
  return joinClasses(
    "group rounded-lg border border-stone-200 bg-white shadow-sm",
    className,
  );
}

export function reviewAccordionSummaryClass(className?: string) {
  return joinClasses(
    "cursor-pointer list-none p-4 outline-none focus:ring-2 focus:ring-seed-500 [&::-webkit-details-marker]:hidden",
    className,
  );
}

export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "earth" | "seed" | "stone";
}) {
  const toneClass = {
    earth: "border-earth-200 bg-earth-50 text-earth-800",
    seed: "border-seed-200 bg-seed-50 text-seed-800",
    stone: "border-stone-200 bg-stone-100 text-earth-700",
  }[tone];

  return (
    <span
      className={`inline-flex min-h-6 items-center gap-1.5 self-start rounded-full border px-2 text-xs font-semibold ${toneClass}`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
      />
      {label}
    </span>
  );
}

export function ReviewDisclosure({
  children,
  className,
  summary,
  summaryClassName,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  summary: ReactNode;
  summaryClassName?: string;
  variant?: "default" | "panel";
}) {
  const disclosureClass =
    variant === "panel"
      ? reviewPanelClass(joinClasses("group", className))
      : reviewDisclosureClass(joinClasses("group", className));
  const summaryClasses =
    variant === "panel"
      ? reviewAccordionSummaryClass(
          joinClasses(
            "flex items-center justify-between gap-3",
            summaryClassName,
          ),
        )
      : reviewDisclosureSummaryClass(
          joinClasses(
            "flex list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden",
            summaryClassName,
          ),
        );

  return (
    <details className={disclosureClass}>
      <summary className={summaryClasses}>
        <div className="min-w-0 flex-1">{summary}</div>
        <DisclosureChevron />
      </summary>
      {/* Gentle one-pass settle as the body opens (Phase 5.5.7). Native
          <details> reveals instantly; this only softens the reveal and is
          skipped under reduced motion. */}
      <div className="group-open:animate-[money-disclosure-open_220ms_ease-out] motion-reduce:animate-none">
        {children}
      </div>
    </details>
  );
}

function DisclosureChevron() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-seed-700 transition-transform group-open:rotate-90"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </span>
  );
}

export function ReviewEmptyState({
  action,
  children,
  footer,
  label,
  testId,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  label?: string;
  testId?: string;
  title: string;
}) {
  return (
    <div className={reviewDashedPanelClass("p-5")} data-testid={testId}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {label ? <StatusPill label={label} tone="stone" /> : null}
          <h3
            className={joinClasses(
              "text-lg font-semibold text-seed-950",
              label && "mt-3",
            )}
          >
            {title}
          </h3>
          <div className="mt-2 max-w-3xl text-sm leading-6 text-earth-700">
            {children}
          </div>
        </div>
        {action}
      </div>
      {footer}
    </div>
  );
}

export type ReviewEvidenceRow = {
  amount: string;
  detail: string;
  id: string;
  label: string;
  postedDate: string;
};

export function ReviewEvidenceRowList({ rows }: { rows: ReviewEvidenceRow[] }) {
  return (
    <ul className="mt-2 divide-y divide-stone-200 overflow-hidden rounded-md border border-stone-200 bg-white">
      {rows.map((row) => (
        <li
          className="grid gap-2 p-2.5 text-sm sm:grid-cols-[112px_minmax(0,1fr)_96px] sm:items-start"
          key={row.id}
        >
          <span className="font-medium tabular-nums text-earth-800">
            {row.postedDate}
          </span>
          <span className="min-w-0 break-words text-earth-800">
            {row.label}
            <span className="block text-earth-600">{row.detail}</span>
          </span>
          <span className="font-semibold tabular-nums text-seed-950 sm:text-right">
            {row.amount}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-earth-600">{label}</dt>
      <dd className="mt-1 break-words font-medium text-earth-900">{value}</dd>
    </div>
  );
}

export function ProvenanceTag({ provenance }: { provenance: Provenance }) {
  const isMissing = provenance === "missing";

  return (
    <span
      className={`rounded-lg border px-2 py-1 text-xs font-medium ${
        isMissing
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-stone-200 bg-white text-earth-700"
      }`}
    >
      {provenanceLabels[provenance]}
    </span>
  );
}

export function EducationTopicLink({ id }: { id: string }) {
  const topic = resolveEducationTopic(id);

  return (
    <a
      className="inline-flex min-h-8 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 font-medium text-earth-800 hover:border-seed-200 hover:bg-seed-50 hover:text-seed-900 focus:outline-none focus:ring-2 focus:ring-seed-500"
      href={`#${educationTopicAnchor(id)}`}
    >
      {topic.title}
    </a>
  );
}

export function ReviewSectionHeading({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description: string;
  id: string;
}) {
  return (
    <div className="pt-1">
      <p className="text-sm font-semibold text-seed-700">{eyebrow}</p>
      <h2 id={id} className="mt-1 text-xl font-semibold text-seed-950">
        {title}
      </h2>
      <p className="sr-only">{description}</p>
    </div>
  );
}

export function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-seed-950">{title}</h4>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Brief acknowledgement that an input finished applying (Phase 5.5.7): a soft
 * check with a short one-pass settle — never confetti, never a judgment of the
 * value entered. `role="status"` announces the same text to assistive tech.
 * The owner mounts it only for a moment after a successful apply; the copy
 * keeps the session boundary honest ("updated", not "saved").
 */
export function SoftCheckAcknowledgement({ label }: { label: string }) {
  return (
    <p
      className="inline-flex animate-[money-soft-check_240ms_ease-out] items-center gap-1.5 text-xs font-semibold text-seed-700 motion-reduce:animate-none"
      data-testid="soft-check"
      role="status"
    >
      <span
        aria-hidden="true"
        className="grid size-4 place-items-center rounded-full bg-seed-100 text-seed-700"
      >
        <svg
          className="size-2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      {label}
    </p>
  );
}
