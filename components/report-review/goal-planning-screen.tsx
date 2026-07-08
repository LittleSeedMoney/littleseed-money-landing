"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

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
  ReviewDisclosure,
  ReviewSectionHeading,
  reviewSubtlePanelClass,
  StatusPill,
} from "./shared";
import { SproutMark } from "./sprout-mark";

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

  // Removal is deferred behind a short undo window: the remove button sits in
  // the same control stack as move up/down, so a stray tap would otherwise
  // destroy typed-in goal values with no recovery. The row is replaced in
  // place by an undo bar (keeping the other rows' numbering stable), and the
  // removal only reaches the workspace when the window elapses, a second
  // removal starts, or the screen unmounts. Undo simply cancels the timer —
  // nothing was deleted yet.
  const [pendingRemoval, setPendingRemoval] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const pendingRef = useRef<{ id: string; timer: number } | null>(null);
  const onGoalRemoveRef = useRef(onGoalRemove);
  onGoalRemoveRef.current = onGoalRemove;

  function finalizePendingRemoval() {
    const pending = pendingRef.current;
    if (!pending) {
      return;
    }
    window.clearTimeout(pending.timer);
    pendingRef.current = null;
    setPendingRemoval(null);
    onGoalRemoveRef.current(pending.id);
  }

  function requestGoalRemoval(id: string) {
    const summary = summaries.find((entry) => entry.id === id);
    if (!summary) {
      return;
    }
    finalizePendingRemoval();
    const timer = window.setTimeout(finalizePendingRemoval, 5000);
    pendingRef.current = { id, timer };
    setPendingRemoval({ id, name: summary.name });
  }

  function undoGoalRemoval() {
    const pending = pendingRef.current;
    if (!pending) {
      return;
    }
    window.clearTimeout(pending.timer);
    pendingRef.current = null;
    setPendingRemoval(null);
  }

  // Leaving the screen finalizes a pending removal instead of silently
  // resurrecting the goal on return.
  useEffect(
    () => () => {
      const pending = pendingRef.current;
      if (pending) {
        window.clearTimeout(pending.timer);
        pendingRef.current = null;
        onGoalRemoveRef.current(pending.id);
      }
    },
    [],
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
        description="Edit goals and set your own priority order."
      />

      <div className={reviewPanelClass("space-y-4 p-4 sm:p-5")}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-serif text-base font-bold text-seed-950">
              Your goals
            </h3>
            <p className="mt-0.5 text-xs text-earth-600">
              Use the arrows to set your own order. The order is your choice —
              nothing here ranks or recommends.
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

        <div className="divide-y divide-stone-100">
          {summaries.map((summary, index) =>
            pendingRemoval?.id === summary.id ? (
              <GoalRemovalUndoRow
                key={summary.id}
                name={pendingRemoval.name}
                onUndo={undoGoalRemoval}
              />
            ) : (
              <GoalPlanningRowEditor
                canMoveDown={index < summaries.length - 1}
                canMoveUp={index > 0}
                // While one removal is pending, the effective row count is one
                // lower — keep the last remaining goal unremovable through the
                // window instead of letting two quick taps empty the list.
                canRemove={summaries.length > (pendingRemoval ? 2 : 1)}
                key={summary.id}
                onGoalMove={onGoalMove}
                onGoalRemove={requestGoalRemoval}
                onGoalUpdate={onGoalUpdate}
                asOfMonth={asOfMonth}
                summary={summary}
              />
            ),
          )}
        </div>

        <GoalPlanningLimits
          items={[
            "Calculates remaining amount, progress, and monthly math from the values you enter.",
            "Uses your row order as the priority shown in Snapshot.",
            "Keeps edits in the current browser session only.",
            "Does not save goals, connect accounts, make transfers, recommend priority, or send local goal state to AI.",
          ]}
        />
      </div>
    </section>
  );
}

export type GoalMoveDirection = "up" | "down";

/**
 * Stands in for a goal row while its removal waits out the undo window.
 * role="status" announces the removal; Undo cancels the timer (nothing has
 * been deleted yet), so the row returns exactly as it was.
 */
function GoalRemovalUndoRow({
  name,
  onUndo,
}: {
  name: string;
  onUndo: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-4 first:pt-1 last:pb-1"
      data-testid="goal-removal-undo"
      role="status"
    >
      <p className="min-w-0 truncate text-sm text-earth-600">
        Removed “{name}”.
      </p>
      <button
        className="inline-flex min-h-8 shrink-0 items-center rounded-md border border-stone-300 bg-white px-3 text-xs font-semibold text-seed-700 shadow-sm outline-none hover:border-seed-400 focus:ring-2 focus:ring-seed-500"
        data-testid="goal-removal-undo-button"
        onClick={onUndo}
        type="button"
      >
        Undo
      </button>
    </div>
  );
}

function GoalPlanningLimits({ items }: { items: string[] }) {
  return (
    <ReviewDisclosure
      className="border-t-0 p-3"
      summary="Planning limits"
    >
      <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
        {items.map((item) => (
          <li className="ml-4 list-disc" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </ReviewDisclosure>
  );
}

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

  const progress =
    summary.progressPercent === null
      ? null
      : Math.max(0, Math.min(100, summary.progressPercent));

  return (
    <article
      className="py-4 first:pt-1 last:pb-1"
      data-goal-id={summary.id}
      data-testid="goal-planning-row"
    >
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border border-seed-100 bg-seed-50 text-xs font-extrabold text-seed-700"
        >
          {summary.priority}
        </span>
        <span className="sr-only">Priority {summary.priority}</span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-seed-950">
              {summary.name}
            </h3>
            {/* Decorative seed-growth stage beside the status; the label and
                percentage stay the real information. Sized up beside the goal
                title (owner feedback) — the hero tile keeps the smaller
                default next to its compact label. */}
            <SproutMark
              className="size-7 shrink-0 text-seed-600"
              progressPercent={summary.progressPercent}
            />
            <StatusPill
              label={summary.statusLabel}
              tone={goalStatusTone(summary.status)}
            />
          </div>
          <p className="mt-0.5 text-xs text-earth-600">
            {goalSubline(summary)}
          </p>
          {progress !== null ? (
            <div
              aria-hidden="true"
              className="mt-2 h-[7px] overflow-hidden rounded-full bg-stone-100"
            >
              <span
                className={`block h-full rounded-full ${
                  goalStatusTone(summary.status) === "earth"
                    ? "bg-earth-500"
                    : "bg-seed-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
          <p className="sr-only">As of {asOfMonth}.</p>
        </div>

        {progress !== null ? (
          <span className="mt-0.5 flex-none font-serif text-lg font-bold tabular-nums text-seed-950">
            {formatGoalPlanningPercent(summary.progressPercent)}
          </span>
        ) : null}

        <div className="flex flex-none flex-col gap-1 sm:flex-row">
          <button
            aria-label="Move up"
            className={goalActionClass(canMoveUp)}
            disabled={!canMoveUp}
            onClick={() => onGoalMove(summary.id, "up")}
            title="Move up"
            type="button"
          >
            <GoalActionIcon action="up" />
          </button>
          <button
            aria-label="Move down"
            className={goalActionClass(canMoveDown)}
            disabled={!canMoveDown}
            onClick={() => onGoalMove(summary.id, "down")}
            title="Move down"
            type="button"
          >
            <GoalActionIcon action="down" />
          </button>
          <button
            aria-label="Remove"
            className={goalActionClass(canRemove)}
            disabled={!canRemove}
            onClick={() => onGoalRemove(summary.id)}
            title="Remove"
            type="button"
          >
            <GoalActionIcon action="remove" />
          </button>
        </div>
      </div>

      {summary.validationMessages.length > 0 ? (
        <div
          className="ml-[42px] mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
          role="alert"
        >
          {summary.validationMessages.join(" ")}
        </div>
      ) : null}

      <ReviewDisclosure className="ml-[42px] mt-3 p-3" summary="Edit details">
        <GoalPlanningRowFields
          summary={summary}
          updateField={updateField}
        />
      </ReviewDisclosure>
    </article>
  );
}

function goalSubline(summary: GoalPlanningSummary) {
  const parts: string[] = [];
  if (summary.currentSavedValue !== null && summary.targetAmountValue !== null) {
    parts.push(
      `${formatGoalPlanningMoney(summary.currentSavedValue)} of ${formatGoalPlanningMoney(summary.targetAmountValue)}`,
    );
  }
  if (summary.remainingAmount !== null) {
    parts.push(`${formatGoalPlanningMoney(summary.remainingAmount)} to go`);
  }
  if (summary.monthlyContributionValue !== null) {
    parts.push(
      `${formatGoalPlanningMoney(summary.monthlyContributionValue)}/mo`,
    );
  }
  if (summary.monthsAtCurrentContribution !== null) {
    parts.push(
      `~${formatGoalPlanningMonthCount(summary.monthsAtCurrentContribution)}`,
    );
  }
  return parts.join(" · ");
}

function GoalPlanningRowFields({
  summary,
  updateField,
}: {
  summary: GoalPlanningSummary;
  updateField: <T extends keyof GoalPlanningRow>(
    field: T,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
}) {
  return (
    <>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
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

      {/* Owner-requested simplification: the four derived metric cards
          duplicated the summary line above the editor (saved-of-target,
          remaining, monthly input, months at pace). Only "needed for the
          target month" had no other home, so it stays as one factual line. */}
      {summary.monthlyNeededForTarget !== null ? (
        <p className="mt-3 text-xs text-earth-600">
          Reaching the target month takes{" "}
          {formatGoalPlanningMoney(summary.monthlyNeededForTarget)}/month —
          remaining amount divided by the months left.
        </p>
      ) : null}
    </>
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


function goalActionClass(enabled: boolean) {
  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-seed-500";

  if (!enabled) {
    return `${base} cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400`;
  }

  return `${base} border-stone-300 bg-white text-earth-800 hover:bg-stone-50`;
}

function GoalActionIcon({
  action,
}: {
  action: "down" | "remove" | "up";
}) {
  if (action === "remove") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {action === "up" ? (
        <path d="m18 15-6-6-6 6" />
      ) : (
        <path d="m6 9 6 6 6-6" />
      )}
    </svg>
  );
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
