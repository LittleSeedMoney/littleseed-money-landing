export type SavingGoalDraftValues = {
  goalName: string;
  targetAmount: string;
  currentSaved: string;
  monthlyContribution: string;
  targetMonths: string;
};

export type SavingGoalDraftStatus =
  | "invalid_input"
  | "needs_target"
  | "reached"
  | "pace_fits_horizon"
  | "inputs_do_not_fit_horizon"
  | "estimate_only"
  | "horizon_only"
  | "needs_contribution_or_horizon";

export type SavingGoalDraftSummary = {
  goalName: string;
  targetAmount: number | null;
  currentSaved: number | null;
  monthlyContribution: number | null;
  targetMonths: number | null;
  remainingAmount: number | null;
  progressPercent: number | null;
  monthsAtCurrentContribution: number | null;
  monthlyNeededForTarget: number | null;
  status: SavingGoalDraftStatus;
  statusLabel: string;
  validationMessages: string[];
  assumptions: string[];
  limitations: string[];
};

export function defaultSavingGoalDraftValues(): SavingGoalDraftValues {
  return {
    currentSaved: "12000.00",
    goalName: "Emergency reserve top-up",
    monthlyContribution: "500.00",
    targetAmount: "15000.00",
    targetMonths: "6",
  };
}

export function formatSavingGoalDraftMoney(value: number | null) {
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

export function calculateSavingGoalDraft(
  values: SavingGoalDraftValues,
): SavingGoalDraftSummary {
  const validationMessages: string[] = [];
  const goalName = values.goalName.trim() || "Savings goal draft";
  const targetAmount = parseRequiredNonNegativeDecimal(
    values.targetAmount,
    "Target amount",
    validationMessages,
  );
  const currentSaved = parseRequiredNonNegativeDecimal(
    values.currentSaved,
    "Current saved amount",
    validationMessages,
  );
  const monthlyContribution = parseRequiredNonNegativeDecimal(
    values.monthlyContribution,
    "Monthly contribution",
    validationMessages,
  );
  const targetMonths = parseOptionalPositiveDecimal(
    values.targetMonths,
    "Target horizon",
    validationMessages,
  );
  const hasInvalidTargetMonths =
    values.targetMonths.trim() !== "" && targetMonths === null;

  if (
    targetAmount === null ||
    currentSaved === null ||
    monthlyContribution === null ||
    hasInvalidTargetMonths
  ) {
    return buildSummary({
      currentSaved,
      goalName,
      limitations: defaultLimitations(),
      monthlyContribution,
      monthlyNeededForTarget: null,
      monthsAtCurrentContribution: null,
      progressPercent: null,
      remainingAmount: null,
      status:
        targetAmount === null && !hasInvalidTargetMonths
          ? "needs_target"
          : "invalid_input",
      targetAmount,
      targetMonths,
      validationMessages,
    });
  }

  if (targetAmount <= 0) {
    validationMessages.push("Target amount must be greater than 0.");

    return buildSummary({
      currentSaved,
      goalName,
      limitations: defaultLimitations(),
      monthlyContribution,
      monthlyNeededForTarget: null,
      monthsAtCurrentContribution: null,
      progressPercent: null,
      remainingAmount: null,
      status: "needs_target",
      targetAmount,
      targetMonths,
      validationMessages,
    });
  }

  const remainingAmount = Math.max(targetAmount - currentSaved, 0);
  const progressPercent = Math.min((currentSaved / targetAmount) * 100, 100);
  const monthsAtCurrentContribution =
    remainingAmount === 0
      ? 0
      : monthlyContribution > 0
        ? Math.ceil(remainingAmount / monthlyContribution)
        : null;
  const monthlyNeededForTarget =
    targetMonths === null ? null : remainingAmount / targetMonths;
  const status = resolveStatus({
    monthlyContribution,
    monthlyNeededForTarget,
    remainingAmount,
    targetMonths,
  });

  return buildSummary({
    currentSaved,
    goalName,
    limitations: defaultLimitations(),
    monthlyContribution,
    monthlyNeededForTarget,
    monthsAtCurrentContribution,
    progressPercent,
    remainingAmount,
    status,
    targetAmount,
    targetMonths,
    validationMessages,
  });
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

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed < 0) {
    validationMessages.push(`${label} must be a non-negative number.`);
    return null;
  }

  return parsed;
}

function parseOptionalPositiveDecimal(
  value: string,
  label: string,
  validationMessages: string[],
) {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    validationMessages.push(`${label} must be greater than 0 when entered.`);
    return null;
  }

  return parsed;
}

function resolveStatus({
  monthlyContribution,
  monthlyNeededForTarget,
  remainingAmount,
  targetMonths,
}: {
  monthlyContribution: number;
  monthlyNeededForTarget: number | null;
  remainingAmount: number;
  targetMonths: number | null;
}): SavingGoalDraftStatus {
  if (remainingAmount === 0) {
    return "reached";
  }

  if (targetMonths === null && monthlyContribution <= 0) {
    return "needs_contribution_or_horizon";
  }

  if (targetMonths === null) {
    return "estimate_only";
  }

  if (monthlyContribution <= 0) {
    return "horizon_only";
  }

  if (
    monthlyNeededForTarget !== null &&
    monthlyContribution >= monthlyNeededForTarget
  ) {
    return "pace_fits_horizon";
  }

  return "inputs_do_not_fit_horizon";
}

function buildSummary({
  currentSaved,
  goalName,
  limitations,
  monthlyContribution,
  monthlyNeededForTarget,
  monthsAtCurrentContribution,
  progressPercent,
  remainingAmount,
  status,
  targetAmount,
  targetMonths,
  validationMessages,
}: {
  currentSaved: number | null;
  goalName: string;
  limitations: string[];
  monthlyContribution: number | null;
  monthlyNeededForTarget: number | null;
  monthsAtCurrentContribution: number | null;
  progressPercent: number | null;
  remainingAmount: number | null;
  status: SavingGoalDraftStatus;
  targetAmount: number | null;
  targetMonths: number | null;
  validationMessages: string[];
}): SavingGoalDraftSummary {
  return {
    assumptions: [
      "Uses only the values entered in this in-session draft.",
      "Assumes the entered monthly contribution is available each month.",
      "Does not compare this goal against other household priorities.",
    ],
    currentSaved,
    goalName,
    limitations,
    monthlyContribution,
    monthlyNeededForTarget,
    monthsAtCurrentContribution,
    progressPercent,
    remainingAmount,
    status,
    statusLabel: statusLabel(status),
    targetAmount,
    targetMonths,
    validationMessages,
  };
}

function defaultLimitations() {
  return [
    "No bank connection, transfer, monitoring, or persistent transaction storage is used.",
    "Interest, market returns, taxes, fees, and changing expenses are not modeled.",
    "Priority, flexibility, and deadline context is still needed before comparing goals.",
  ];
}

function statusLabel(status: SavingGoalDraftStatus) {
  const labels: Record<SavingGoalDraftStatus, string> = {
    estimate_only: "Timeline estimate only",
    horizon_only: "Horizon-only draft",
    inputs_do_not_fit_horizon: "Inputs do not fit entered horizon",
    invalid_input: "Draft needs valid inputs",
    needs_contribution_or_horizon: "Draft needs contribution or horizon",
    needs_target: "Draft needs target amount",
    pace_fits_horizon: "Pace fits entered horizon",
    reached: "Entered target reached",
  };

  return labels[status];
}
