"use client";

import { useMemo, useState, type ChangeEvent } from "react";

import {
  calculateSavingGoalDraft,
  defaultSavingGoalDraftValues,
  formatSavingGoalDraftMoney,
  type SavingGoalDraftStatus,
  type SavingGoalDraftValues,
} from "@/lib/report-review/saving-goal-draft";

import { ReviewSectionHeading, StatusPill } from "./shared";

export function SavingGoalDraftSection() {
  const [values, setValues] = useState(defaultSavingGoalDraftValues);
  const summary = useMemo(() => calculateSavingGoalDraft(values), [values]);

  function updateValue(
    field: keyof SavingGoalDraftValues,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  }

  return (
    <section
      id="saving-goal-draft"
      aria-labelledby="saving-goal-draft-heading"
      className="space-y-3"
    >
      <ReviewSectionHeading
        eyebrow="Goal draft"
        id="saving-goal-draft-heading"
        title="Saving goal arithmetic check"
        description="Draft a single savings goal with manual, in-session inputs. The check shows simple math only; it does not rank goals or recommend financial products."
      />

      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-seed-950">
              {summary.goalName}
            </h3>
            <p className="mt-1 text-sm leading-6 text-earth-700">
              Private report-review draft. Values stay in this browser session
              until the page changes or reloads.
            </p>
          </div>
          <StatusPill
            label={summary.statusLabel}
            tone={statusTone(summary.status)}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <GoalTextField
            label="Goal name"
            onChange={(event) => updateValue("goalName", event)}
            value={values.goalName}
          />
          <GoalNumberField
            label="Target amount"
            onChange={(event) => updateValue("targetAmount", event)}
            prefix="$"
            required
            value={values.targetAmount}
          />
          <GoalNumberField
            label="Current saved"
            onChange={(event) => updateValue("currentSaved", event)}
            prefix="$"
            required
            value={values.currentSaved}
          />
          <GoalNumberField
            label="Monthly contribution"
            onChange={(event) => updateValue("monthlyContribution", event)}
            prefix="$"
            required
            value={values.monthlyContribution}
          />
          <GoalNumberField
            label="Target horizon, months"
            onChange={(event) => updateValue("targetMonths", event)}
            value={values.targetMonths}
          />
        </div>

        {summary.validationMessages.length > 0 ? (
          <div
            className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
            role="alert"
          >
            {summary.validationMessages.join(" ")}
          </div>
        ) : null}

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <GoalMetric
            detail="Target amount minus current saved amount."
            label="Remaining"
            value={formatSavingGoalDraftMoney(summary.remainingAmount)}
          />
          <GoalMetric
            detail="Current saved amount divided by the target amount."
            label="Progress"
            value={formatPercent(summary.progressPercent)}
          />
          <GoalMetric
            detail="Uses the entered monthly contribution only."
            label="At current contribution"
            value={formatMonthCount(summary.monthsAtCurrentContribution)}
          />
          <GoalMetric
            detail="Blank when no target horizon is entered."
            label="For entered horizon"
            value={formatMonthlyNeeded(summary.monthlyNeededForTarget)}
          />
        </dl>

        <div className="mt-5 grid gap-3 border-t border-stone-200 pt-4 md:grid-cols-2">
          <BoundaryList title="Assumptions" items={summary.assumptions} />
          <BoundaryList title="Limits" items={summary.limitations} />
        </div>
      </div>
    </section>
  );
}

function GoalTextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
}) {
  return (
    <label className="block min-w-0">
      <GoalFieldLabel label={label} />
      <input
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
        onChange={onChange}
        type="text"
        value={value}
      />
    </label>
  );
}

function GoalNumberField({
  label,
  onChange,
  prefix,
  required = false,
  value,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block min-w-0">
      <GoalFieldLabel label={label} required={required} />
      <span className="relative mt-2 block">
        {prefix ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-earth-600"
          >
            {prefix}
          </span>
        ) : null}
        <input
          className={`min-h-11 w-full rounded-lg border border-stone-300 bg-white py-2 pr-3 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200 ${
            prefix ? "pl-7" : "pl-3"
          }`}
          inputMode="decimal"
          min="0"
          onChange={onChange}
          required={required}
          step="0.01"
          type="number"
          value={value}
        />
      </span>
    </label>
  );
}

function GoalFieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <span className="block min-h-5">
      <span className="text-sm font-medium text-earth-800">{label}</span>
      {required ? <span className="sr-only"> required</span> : null}
    </span>
  );
}

function GoalMetric({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
      <dt className="text-sm font-medium text-earth-700">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-seed-950">
        {value}
      </dd>
      <dd>
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-semibold text-seed-700 outline-none underline-offset-4 hover:underline focus:ring-2 focus:ring-seed-500">
            Detail
          </summary>
          <p className="mt-2 text-sm leading-6 text-earth-700">{detail}</p>
        </details>
      </dd>
    </div>
  );
}

function BoundaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <details className="rounded-md border border-stone-200 bg-stone-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-seed-950 outline-none focus:ring-2 focus:ring-seed-500">
        {title}
      </summary>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
        {items.map((item) => (
          <li className="ml-4 list-disc" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}

function statusTone(status: SavingGoalDraftStatus) {
  if (status === "reached" || status === "pace_fits_horizon") {
    return "seed";
  }

  if (status === "inputs_do_not_fit_horizon" || status === "horizon_only") {
    return "earth";
  }

  return "stone";
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "Missing";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}%`;
}

function formatMonthCount(value: number | null) {
  if (value === null) {
    return "Needs monthly input";
  }

  if (value === 0) {
    return "Reached";
  }

  return `${value} months`;
}

function formatMonthlyNeeded(value: number | null) {
  if (value === null) {
    return "No horizon entered";
  }

  return `${formatSavingGoalDraftMoney(value)} / month`;
}
