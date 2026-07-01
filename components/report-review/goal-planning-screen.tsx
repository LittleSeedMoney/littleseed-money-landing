"use client";

import { useMemo, type ChangeEvent } from "react";

import {
  formatGoalPlanningMoney,
  formatGoalPlanningMonthCount,
  formatGoalPlanningPercent,
  GOAL_PLANNING_TYPE_LABELS,
  summarizeGoalPlan,
  type GoalPlanningRow,
  type GoalPlanningStatus,
  type GoalPlanningSummary,
  type GoalPlanningType,
} from "@/lib/report-review/goal-planning";

import {
  reviewPanelClass,
  ReviewSectionHeading,
  reviewSubtlePanelClass,
  StatusPill,
} from "./shared";

export function GoalPlanningScreen({
  asOfMonth,
  goalRows,
  onAddGoal,
  onGoalMove,
  onGoalRemove,
  onGoalUpdate,
}: {
  asOfMonth: string;
  goalRows: GoalPlanningRow[];
  onAddGoal: () => void;
  onGoalMove: (id: string, direction: GoalMoveDirection) => void;
  onGoalRemove: (id: string) => void;
  onGoalUpdate: <T extends keyof GoalPlanningRow>(
    id: string,
    field: T,
    value: GoalPlanningRow[T],
  ) => void;
}) {
  const summaries = useMemo(
    () => summarizeGoalPlan(goalRows, asOfMonth),
    [asOfMonth, goalRows],
  );

  return (
    <section
      aria-labelledby="goal-planning-heading"
      className="space-y-4"
      data-testid="goal-planning-screen"
      id="goals"
    >
      <ReviewSectionHeading
        eyebrow="Goals"
        id="goal-planning-heading"
        title="Goal planning workspace"
        description="Plan multiple savings goals with manual, in-session inputs. The order below is your priority order; the app does not rank or recommend which goal should come first."
      />

      <div className={reviewPanelClass("space-y-5 p-4 sm:p-5")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-seed-950">
              User-ordered goal list
            </h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-earth-700">
              Values stay in this browser session. Use Move up and Move down to
              express your own priority; those controls are not automation or
              advice.
            </p>
          </div>
          <button
            className="w-fit rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-earth-800 shadow-sm hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-seed-500"
            onClick={onAddGoal}
            type="button"
          >
            Add goal
          </button>
        </div>

        <div className="space-y-4">
          {summaries.map((summary, index) => (
            <GoalPlanningRowEditor
              canMoveDown={index < summaries.length - 1}
              canMoveUp={index > 0}
              canRemove={summaries.length > 1}
              key={summary.id}
              onGoalMove={onGoalMove}
              onGoalRemove={onGoalRemove}
              onGoalUpdate={onGoalUpdate}
              asOfMonth={asOfMonth}
              summary={summary}
            />
          ))}
        </div>

        <div className="grid gap-3 border-t border-stone-200 pt-4 md:grid-cols-2">
          <BoundaryBlock
            title="What this does"
            items={[
              "Calculates remaining amount, progress, and monthly math from the values you enter.",
              "Uses your row order as the priority shown in Snapshot.",
              "Keeps edits in the current browser session only.",
            ]}
          />
          <BoundaryBlock
            title="What this does not do"
            items={[
              "Does not save goals, connect accounts, or automate transfers.",
              "Does not recommend which goal should be first.",
              "Does not send local goal state to the AI explanation route.",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

export type GoalMoveDirection = "up" | "down";

function GoalPlanningRowEditor({
  canMoveDown,
  canMoveUp,
  canRemove,
  onGoalMove,
  onGoalRemove,
  onGoalUpdate,
  asOfMonth,
  summary,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  canRemove: boolean;
  onGoalMove: (id: string, direction: GoalMoveDirection) => void;
  onGoalRemove: (id: string) => void;
  onGoalUpdate: <T extends keyof GoalPlanningRow>(
    id: string,
    field: T,
    value: GoalPlanningRow[T],
  ) => void;
  asOfMonth: string;
  summary: GoalPlanningSummary;
}) {
  function updateField<T extends keyof GoalPlanningRow>(
    field: T,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    onGoalUpdate(summary.id, field, event.target.value as GoalPlanningRow[T]);
  }

  return (
    <article
      className="rounded-lg border border-stone-200 bg-stone-50/80 p-3 shadow-sm"
      data-goal-id={summary.id}
      data-testid="goal-planning-row"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-seed-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-seed-800">
              Priority {summary.priority}
            </span>
            <h3 className="text-base font-semibold text-seed-950">
              {summary.name}
            </h3>
            <StatusPill
              label={summary.statusLabel}
              tone={goalStatusTone(summary.status)}
            />
          </div>
          <p className="mt-1 text-sm leading-6 text-earth-700">
            As of {asOfMonth}. Target month math uses the entered month only.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className={goalActionClass(canMoveUp)}
            disabled={!canMoveUp}
            onClick={() => onGoalMove(summary.id, "up")}
            type="button"
          >
            Move up
          </button>
          <button
            className={goalActionClass(canMoveDown)}
            disabled={!canMoveDown}
            onClick={() => onGoalMove(summary.id, "down")}
            type="button"
          >
            Move down
          </button>
          <button
            className={goalActionClass(canRemove)}
            disabled={!canRemove}
            onClick={() => onGoalRemove(summary.id)}
            type="button"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <GoalTextField
          label="Goal name"
          onChange={(event) => updateField("name", event)}
          value={summary.name}
        />
        <GoalTypeField
          onChange={(event) => updateField("type", event)}
          value={summary.type}
        />
        <GoalMoneyField
          label="Target amount"
          onChange={(event) => updateField("targetAmount", event)}
          required
          value={summary.targetAmount}
        />
        <GoalMoneyField
          label="Current saved"
          onChange={(event) => updateField("currentSaved", event)}
          required
          value={summary.currentSaved}
        />
        <GoalMoneyField
          label="Monthly input"
          onChange={(event) => updateField("monthlyContribution", event)}
          required
          value={summary.monthlyContribution}
        />
        <GoalMonthField
          label="Target month"
          onChange={(event) => updateField("targetMonth", event)}
          value={summary.targetMonth}
        />
      </div>

      {summary.validationMessages.length > 0 ? (
        <div
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
          role="alert"
        >
          {summary.validationMessages.join(" ")}
        </div>
      ) : null}

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GoalMetric
          detail="Target amount minus current saved."
          label="Remaining"
          value={formatGoalPlanningMoney(summary.remainingAmount)}
        />
        <GoalMetric
          detail="Current saved divided by target amount."
          label="Progress"
          value={formatGoalPlanningPercent(summary.progressPercent)}
        />
        <GoalMetric
          detail="Remaining amount divided by entered monthly input."
          label="At monthly input"
          value={formatGoalPlanningMonthCount(
            summary.monthsAtCurrentContribution,
          )}
        />
        <GoalMetric
          detail="Remaining amount divided by months through the entered target month."
          label="Needed for target month"
          value={
            summary.monthlyNeededForTarget === null
              ? "Needs target month"
              : `${formatGoalPlanningMoney(
                  summary.monthlyNeededForTarget,
                )} / month`
          }
        />
      </dl>
    </article>
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

function GoalTypeField({
  onChange,
  value,
}: {
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  value: GoalPlanningType;
}) {
  return (
    <label className="block min-w-0">
      <GoalFieldLabel label="Goal type" />
      <select
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
        onChange={onChange}
        value={value}
      >
        {Object.entries(GOAL_PLANNING_TYPE_LABELS).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function GoalMoneyField({
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
      <GoalFieldLabel label={label} required={required} unitLabel="dollars" />
      <span className="relative mt-2 block">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-earth-600"
        >
          $
        </span>
        <input
          className="min-h-11 w-full rounded-lg border border-stone-300 bg-white py-2 pl-7 pr-3 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
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

function GoalMonthField({
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
        type="month"
        value={value}
      />
    </label>
  );
}

function GoalFieldLabel({
  label,
  required = false,
  unitLabel,
}: {
  label: string;
  required?: boolean;
  unitLabel?: string;
}) {
  return (
    <span className="block min-h-5 text-sm font-medium text-earth-800">
      {label}
      {unitLabel ? <span className="sr-only">, {unitLabel}</span> : null}
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
    <div className={reviewSubtlePanelClass("p-3")}>
      <dt className="text-sm font-medium text-earth-700">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums text-seed-950">
        {value}
      </dd>
      <dd className="mt-2 text-xs leading-5 text-earth-600">{detail}</dd>
    </div>
  );
}

function BoundaryBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={reviewSubtlePanelClass("p-3")}>
      <h3 className="text-sm font-semibold text-seed-950">{title}</h3>
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

function goalActionClass(enabled: boolean) {
  const base =
    "min-h-9 rounded-lg border px-3 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-seed-500";

  if (!enabled) {
    return `${base} cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400`;
  }

  return `${base} border-stone-300 bg-white text-earth-800 hover:bg-stone-50`;
}

function goalStatusTone(status: GoalPlanningStatus) {
  if (status === "reached" || status === "on_track_for_month") {
    return "seed";
  }

  if (
    status === "needs_more_monthly_input" ||
    status === "target_month_only"
  ) {
    return "earth";
  }

  return "stone";
}
