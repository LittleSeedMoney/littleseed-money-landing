import { parseMoneyCents } from "./snapshot-monthly-draft";

export const GOAL_PLANNING_AS_OF_MONTH = "2026-07";

export type GoalPlanningType =
  | "emergency_fund"
  | "home_down_payment"
  | "wedding"
  | "car_down_payment"
  | "custom";

export type GoalPlanningRow = {
  id: string;
  name: string;
  type: GoalPlanningType;
  targetAmount: string;
  currentSaved: string;
  monthlyContribution: string;
  targetMonth: string;
};

export type GoalPlanningStatus =
  | "needs_valid_inputs"
  | "needs_target"
  | "reached"
  | "contribution_only"
  | "target_month_only"
  | "needs_contribution_or_month"
  | "on_track_for_month"
  | "needs_more_monthly_input";

export type GoalPlanningSummary = GoalPlanningRow & {
  priority: number;
  targetAmountValue: number | null;
  currentSavedValue: number | null;
  monthlyContributionValue: number | null;
  remainingAmount: number | null;
  progressPercent: number | null;
  targetMonthValue: string | null;
  monthsUntilTarget: number | null;
  monthlyNeededForTarget: number | null;
  monthsAtCurrentContribution: number | null;
  status: GoalPlanningStatus;
  statusLabel: string;
  validationMessages: string[];
};

export const GOAL_PLANNING_TYPE_LABELS: Record<GoalPlanningType, string> = {
  car_down_payment: "Car down payment",
  custom: "Custom",
  emergency_fund: "Emergency fund",
  home_down_payment: "Home down payment",
  wedding: "Wedding",
};

export function defaultGoalPlanningRows(): GoalPlanningRow[] {
  return [
    {
      currentSaved: "12000.00",
      id: "goal-emergency-fund",
      monthlyContribution: "600.00",
      name: "Emergency fund",
      targetAmount: "20000.00",
      targetMonth: "2027-01",
      type: "emergency_fund",
    },
    {
      currentSaved: "18000.00",
      id: "goal-house-down-payment",
      monthlyContribution: "1200.00",
      name: "House down payment",
      targetAmount: "60000.00",
      targetMonth: "2029-06",
      type: "home_down_payment",
    },
    {
      currentSaved: "5000.00",
      id: "goal-wedding",
      monthlyContribution: "700.00",
      name: "Wedding fund",
      targetAmount: "25000.00",
      targetMonth: "2028-05",
      type: "wedding",
    },
    {
      currentSaved: "2500.00",
      id: "goal-car-down-payment",
      monthlyContribution: "350.00",
      name: "Car down payment",
      targetAmount: "12000.00",
      targetMonth: "2027-12",
      type: "car_down_payment",
    },
  ];
}

export function summarizeGoalPlan(
  rows: GoalPlanningRow[],
  asOfMonth = GOAL_PLANNING_AS_OF_MONTH,
): GoalPlanningSummary[] {
  return rows.map((row, index) =>
    summarizeGoalPlanningRow(row, index + 1, asOfMonth),
  );
}

export function summarizeGoalPlanningRow(
  row: GoalPlanningRow,
  priority: number,
  asOfMonth = GOAL_PLANNING_AS_OF_MONTH,
): GoalPlanningSummary {
  const validationMessages: string[] = [];
  const name = row.name.trim() || "Untitled goal";
  const targetAmountValue = parseRequiredNonNegativeDecimal(
    row.targetAmount,
    "Target amount",
    validationMessages,
  );
  const currentSavedValue = parseRequiredNonNegativeDecimal(
    row.currentSaved,
    "Current saved",
    validationMessages,
  );
  const monthlyContributionValue = parseRequiredNonNegativeDecimal(
    row.monthlyContribution,
    "Monthly contribution",
    validationMessages,
  );
  const targetMonthValue = parseOptionalMonth(
    row.targetMonth,
    "Target month",
    validationMessages,
  );
  const monthsUntilTarget =
    targetMonthValue === null
      ? null
      : monthsBetween(asOfMonth, targetMonthValue, validationMessages);

  if (
    targetAmountValue === null ||
    currentSavedValue === null ||
    monthlyContributionValue === null ||
    validationMessages.length > 0
  ) {
    return buildSummary({
      currentSavedValue,
      monthlyContributionValue,
      monthsAtCurrentContribution: null,
      monthsUntilTarget,
      monthlyNeededForTarget: null,
      priority,
      progressPercent: null,
      remainingAmount: null,
      row: { ...row, name },
      status: targetAmountValue === null ? "needs_target" : "needs_valid_inputs",
      targetAmountValue,
      targetMonthValue,
      validationMessages,
    });
  }

  if (targetAmountValue <= 0) {
    validationMessages.push("Target amount must be greater than 0.");

    return buildSummary({
      currentSavedValue,
      monthlyContributionValue,
      monthsAtCurrentContribution: null,
      monthsUntilTarget,
      monthlyNeededForTarget: null,
      priority,
      progressPercent: null,
      remainingAmount: null,
      row: { ...row, name },
      status: "needs_target",
      targetAmountValue,
      targetMonthValue,
      validationMessages,
    });
  }

  const remainingAmount = Math.max(targetAmountValue - currentSavedValue, 0);
  const progressPercent = Math.min(
    (currentSavedValue / targetAmountValue) * 100,
    100,
  );
  const monthsAtCurrentContribution =
    remainingAmount === 0
      ? 0
      : monthlyContributionValue > 0
        ? Math.ceil(remainingAmount / monthlyContributionValue)
        : null;
  const monthlyNeededForTarget =
    monthsUntilTarget === null ? null : remainingAmount / monthsUntilTarget;
  const status = resolveGoalPlanningStatus({
    monthlyContributionValue,
    monthlyNeededForTarget,
    remainingAmount,
    targetMonthValue,
  });

  return buildSummary({
    currentSavedValue,
    monthlyContributionValue,
    monthsAtCurrentContribution,
    monthsUntilTarget,
    monthlyNeededForTarget,
    priority,
    progressPercent,
    remainingAmount,
    row: { ...row, name },
    status,
    targetAmountValue,
    targetMonthValue,
    validationMessages,
  });
}

export function formatGoalPlanningMoney(value: number | null) {
  if (value === null) {
    return "Missing";
  }

  const cents = Math.round(value * 100);
  const hasCents = Math.abs(cents % 100) !== 0;

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: hasCents ? 2 : 0,
    minimumFractionDigits: hasCents ? 2 : 0,
    style: "currency",
  }).format(cents / 100);
}

export function formatGoalPlanningPercent(value: number | null) {
  if (value === null) {
    return "Missing";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}%`;
}

export function formatGoalPlanningMonthCount(value: number | null) {
  if (value === null) {
    return "Needs input";
  }

  if (value === 0) {
    return "Reached";
  }

  if (value === 1) {
    return "1 month";
  }

  return `${value} months`;
}

export function currentGoalPlanningAsOfMonth(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function parseRequiredNonNegativeDecimal(
  value: string,
  label: string,
  validationMessages: string[],
) {
  const trimmed = value.trim();

  if (trimmed === "") {
    validationMessages.push(`${label} is required.`);
    return null;
  }

  const normalized = trimmed.replace(/[$,\s]/g, "");
  const parsedCents = normalized === "" ? null : parseMoneyCents(trimmed);

  if (parsedCents === null || parsedCents < 0) {
    validationMessages.push(`${label} must be a non-negative number.`);
    return null;
  }

  return parsedCents / 100;
}

function parseOptionalMonth(
  value: string,
  label: string,
  validationMessages: string[],
) {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  if (!/^\d{4}-\d{2}$/.test(trimmed)) {
    validationMessages.push(`${label} must use YYYY-MM format.`);
    return null;
  }

  const [, month] = trimmed.split("-").map(Number);

  if (month < 1 || month > 12) {
    validationMessages.push(`${label} must use a month from 01 to 12.`);
    return null;
  }

  return trimmed;
}

function monthsBetween(
  asOfMonth: string,
  targetMonth: string,
  validationMessages: string[],
) {
  const asOfIndex = monthIndex(asOfMonth);
  const targetIndex = monthIndex(targetMonth);

  if (asOfIndex === null) {
    validationMessages.push("As-of month must use YYYY-MM format.");
    return null;
  }

  if (targetIndex === null) {
    validationMessages.push("Target month must use YYYY-MM format.");
    return null;
  }

  const difference = targetIndex - asOfIndex;

  if (difference < 0) {
    validationMessages.push("Target month cannot be before the current month.");
    return null;
  }

  return Math.max(difference, 1);
}

function monthIndex(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return null;
  }

  const [year, monthNumber] = month.split("-").map(Number);

  if (monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  return year * 12 + monthNumber;
}

function resolveGoalPlanningStatus({
  monthlyContributionValue,
  monthlyNeededForTarget,
  remainingAmount,
  targetMonthValue,
}: {
  monthlyContributionValue: number;
  monthlyNeededForTarget: number | null;
  remainingAmount: number;
  targetMonthValue: string | null;
}): GoalPlanningStatus {
  if (remainingAmount === 0) {
    return "reached";
  }

  if (targetMonthValue === null && monthlyContributionValue <= 0) {
    return "needs_contribution_or_month";
  }

  if (targetMonthValue === null) {
    return "contribution_only";
  }

  if (monthlyContributionValue <= 0) {
    return "target_month_only";
  }

  if (
    monthlyNeededForTarget !== null &&
    monthlyContributionValue >= monthlyNeededForTarget
  ) {
    return "on_track_for_month";
  }

  return "needs_more_monthly_input";
}

function buildSummary({
  currentSavedValue,
  monthlyContributionValue,
  monthsAtCurrentContribution,
  monthsUntilTarget,
  monthlyNeededForTarget,
  priority,
  progressPercent,
  remainingAmount,
  row,
  status,
  targetAmountValue,
  targetMonthValue,
  validationMessages,
}: {
  currentSavedValue: number | null;
  monthlyContributionValue: number | null;
  monthsAtCurrentContribution: number | null;
  monthsUntilTarget: number | null;
  monthlyNeededForTarget: number | null;
  priority: number;
  progressPercent: number | null;
  remainingAmount: number | null;
  row: GoalPlanningRow;
  status: GoalPlanningStatus;
  targetAmountValue: number | null;
  targetMonthValue: string | null;
  validationMessages: string[];
}): GoalPlanningSummary {
  return {
    ...row,
    currentSavedValue,
    monthlyContributionValue,
    monthsAtCurrentContribution,
    monthsUntilTarget,
    monthlyNeededForTarget,
    priority,
    progressPercent,
    remainingAmount,
    status,
    statusLabel: goalPlanningStatusLabel(status),
    targetAmountValue,
    targetMonthValue,
    validationMessages,
  };
}

function goalPlanningStatusLabel(status: GoalPlanningStatus) {
  const labels: Record<GoalPlanningStatus, string> = {
    contribution_only: "Contribution timeline only",
    needs_contribution_or_month: "Needs contribution or month",
    needs_more_monthly_input: "Below entered month math",
    needs_target: "Needs target amount",
    needs_valid_inputs: "Needs valid inputs",
    on_track_for_month: "On track for entered month",
    reached: "Entered target reached",
    target_month_only: "Target month math only",
  };

  return labels[status];
}
