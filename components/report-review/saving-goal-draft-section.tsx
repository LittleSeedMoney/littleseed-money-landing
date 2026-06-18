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

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
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

        <div className="mt-5 grid gap-4 lg:grid-cols-5">
          <GoalTextField
            label="Goal name"
            onChange={(event) => updateValue("goalName", event)}
            value={values.goalName}
          />
          <GoalNumberField
            label="Target amount, dollars"
            onChange={(event) => updateValue("targetAmount", event)}
            required
            value={values.targetAmount}
          />
          <GoalNumberField
            label="Current saved, dollars"
            onChange={(event) => updateValue("currentSaved", event)}
            required
            value={values.currentSaved}
          />
          <GoalNumberField
            label="Monthly contribution, dollars"
            onChange={(event) => updateValue("monthlyContribution", event)}
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

        <div className="mt-5 grid gap-4 border-t border-stone-200 pt-5 md:grid-cols-2">
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
      <GoalFieldLabel label={label} requirement="Required" />
      <input
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
        onChange={onChange}
        required
        type="text"
        value={value}
      />
    </label>
  );
}

function GoalNumberField({
  label,
  onChange,
  required = false,
  value,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block min-w-0">
      <GoalFieldLabel label={label} requirement={required ? "Required" : "Optional"} />
      <input
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
        inputMode="decimal"
        min="0"
        onChange={onChange}
        required={required}
        step="0.01"
        type="number"
        value={value}
      />
    </label>
  );
}

function GoalFieldLabel({
  label,
  requirement,
}: {
  label: string;
  requirement: "Required" | "Optional";
}) {
  return (
    <span className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-sm font-medium text-earth-800">{label}</span>
      <span
        className={`text-xs font-semibold uppercase tracking-[0.12em] ${
          requirement === "Required" ? "text-seed-700" : "text-earth-500"
        }`}
      >
        {requirement}
      </span>
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
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <dt className="text-sm font-medium text-earth-700">{label}</dt>
      <dd className="mt-2 text-xl font-semibold tabular-nums text-seed-950">
        {value}
      </dd>
      <dd className="mt-2 text-sm leading-6 text-earth-700">{detail}</dd>
    </div>
  );
}

function BoundaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-seed-950">{title}</h4>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
        {items.map((item) => (
          <li className="ml-4 list-disc" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
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
