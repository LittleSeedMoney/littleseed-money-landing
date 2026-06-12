import type { Provenance } from "@/data/report-review-sample";

export const reportReviewNavItems = [
  ["Overview", "#overview"],
  ["Sections", "#sections"],
  ["Findings", "#findings"],
  ["Evidence", "#evidence"],
  ["Inputs", "#inputs"],
] as const;

export const provenanceLabels: Record<Provenance, string> = {
  sample: "Sample",
  "user-entered": "User-entered",
  calculated: "Calculated",
  "source-backed": "Source-backed",
  missing: "Missing context",
};

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
      className={`inline-flex min-h-8 items-center rounded-lg border px-3 text-xs font-semibold ${toneClass}`}
    >
      {label}
    </span>
  );
}

export function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.14em] text-earth-500">
        {label}
      </dt>
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

export function SectionHeading({
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
    <div className="pt-2">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-seed-700">
        {eyebrow}
      </p>
      <h2 id={id} className="mt-1 text-xl font-semibold text-earth-950">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-earth-700">
        {description}
      </p>
    </div>
  );
}

export function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-earth-950">{title}</h4>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
