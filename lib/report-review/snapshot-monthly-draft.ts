import type {
  ChargeInspectorCategoryEvidenceRow,
  ChargeInspectorCategoryMonthlySummary,
} from "./charge-inspector";

export type SnapshotTargetPreset = {
  amountCents: number;
  amountLabel: string;
};

export type SnapshotTargetStatus =
  | { kind: "no-target"; label: "No target" }
  | { kind: "within-target"; label: "Within target" }
  | { kind: "over-target"; label: string }
  | { kind: "invalid-target"; label: "Invalid target" };

export function expenseRowsForMonth(
  rows: ChargeInspectorCategoryMonthlySummary[],
  month: string,
) {
  if (!month) {
    return [];
  }

  return rows
    .filter(
      (row) =>
        row.month === month &&
        row.debitTotalCents > 0 &&
        row.category !== "income",
    )
    .sort(compareMonthlyExpenseRows);
}

export function deriveSnapshotMonthlyDraftRows(
  rows: ChargeInspectorCategoryMonthlySummary[],
  transactionRowsByOriginalCategory: ReadonlyMap<
    string,
    ChargeInspectorCategoryEvidenceRow[]
  >,
  sessionTransactionCategoryOverrides: Record<string, string>,
  month: string,
) {
  if (!month) {
    return [];
  }

  const draftRowsByCategory = new Map(
    expenseRowsForMonth(rows, month).map((row) => [row.category, { ...row }]),
  );

  for (const [originalCategory, transactions] of transactionRowsByOriginalCategory) {
    if (originalCategory === "income") {
      continue;
    }

    for (const transaction of transactions) {
      if (!transaction.postedDate.startsWith(month)) {
        continue;
      }

      const nextCategory =
        sessionTransactionCategoryOverrides[transaction.id] ?? originalCategory;

      if (nextCategory === originalCategory || nextCategory === "income") {
        continue;
      }

      const amountCents = parseMoneyCents(transaction.amountLabel);
      if (amountCents === null || amountCents <= 0) {
        continue;
      }

      const sourceRow = ensureSnapshotMonthlyDraftRow(
        draftRowsByCategory,
        rows,
        month,
        originalCategory,
      );
      sourceRow.debitTotalCents = Math.max(
        0,
        sourceRow.debitTotalCents - amountCents,
      );
      sourceRow.transactionCount = Math.max(0, sourceRow.transactionCount - 1);
      sourceRow.debitTransactionCount = Math.max(
        0,
        sourceRow.debitTransactionCount - 1,
      );

      const destinationRow = ensureSnapshotMonthlyDraftRow(
        draftRowsByCategory,
        rows,
        month,
        nextCategory,
      );
      destinationRow.debitTotalCents += amountCents;
      destinationRow.transactionCount += 1;
      destinationRow.debitTransactionCount += 1;
    }
  }

  return [...draftRowsByCategory.values()]
    .filter((row) => row.category !== "income" && row.debitTotalCents > 0)
    .map((row) => ({
      ...row,
      debitTotalLabel: moneyFromCentsForMonthlyReference(row.debitTotalCents),
    }))
    .sort(compareMonthlyExpenseRows);
}

export function categoryMonthlyDebitTotalRows(
  rows: ChargeInspectorCategoryMonthlySummary[],
  category: string,
  activeMonth: string,
) {
  const months = [...new Set(rows.map((row) => row.month))]
    .filter((month) => !activeMonth || month <= activeMonth)
    .sort((left, right) => right.localeCompare(left))
    .slice(0, 3);
  const rowByMonth = new Map(
    rows
      .filter((row) => row.category === category)
      .map((row) => [row.month, row]),
  );

  return months.map((month) => {
    const row = rowByMonth.get(month);

    return {
      amountLabel: row
        ? moneyFromCentsForMonthlyReference(row.debitTotalCents)
        : moneyFromCentsForMonthlyReference(0),
      month,
    };
  });
}

export function targetPresetsByCategory(
  rows: ChargeInspectorCategoryMonthlySummary[],
  categories: string[],
  activeMonth: string,
) {
  const presets = new Map<string, SnapshotTargetPreset>();

  for (const category of categories) {
    const preset = targetPresetForCategory(rows, category, activeMonth);
    if (preset) {
      presets.set(category, preset);
    }
  }

  return presets;
}

export function targetPresetForCategory(
  rows: ChargeInspectorCategoryMonthlySummary[],
  category: string,
  activeMonth: string,
): SnapshotTargetPreset | null {
  const previousRows = rows
    .filter(
      (row) =>
        row.category === category &&
        row.month < activeMonth &&
        row.debitTotalCents > 0,
    )
    .sort((left, right) => right.month.localeCompare(left.month))
    .slice(0, 3);

  if (previousRows.length === 0) {
    return null;
  }

  const totalCents = previousRows.reduce(
    (total, row) => total + row.debitTotalCents,
    0,
  );
  const amountCents = Math.round(totalCents / previousRows.length);

  return {
    amountCents,
    amountLabel: moneyFromCentsForMonthlyReference(amountCents),
  };
}

export function targetStatusForRow(
  row: ChargeInspectorCategoryMonthlySummary,
  targetInput: string,
): SnapshotTargetStatus {
  if (targetInput.trim().length === 0) {
    return { kind: "no-target", label: "No target" };
  }

  const targetCents = parseMoneyCents(targetInput);
  if (targetCents === null || targetCents <= 0) {
    return { kind: "invalid-target", label: "Invalid target" };
  }

  if (row.debitTotalCents <= targetCents) {
    return { kind: "within-target", label: "Within target" };
  }

  return {
    kind: "over-target",
    label: `Over by ${moneyFromCentsForMonthlyReference(
      row.debitTotalCents - targetCents,
    )}`,
  };
}

export function parseMoneyCents(value: string) {
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * 100);
}

export function centsToInputValue(cents: number) {
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

export function moneyFromCentsForMonthlyReference(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    style: "currency",
  }).format(cents / 100);
}

function ensureSnapshotMonthlyDraftRow(
  rowsByCategory: Map<string, ChargeInspectorCategoryMonthlySummary>,
  sourceRows: ChargeInspectorCategoryMonthlySummary[],
  month: string,
  category: string,
) {
  const existing = rowsByCategory.get(category);
  if (existing) {
    return existing;
  }

  const sourceRow = sourceRows.find((row) => row.category === category);
  const row: ChargeInspectorCategoryMonthlySummary = {
    category,
    creditTotalCents: 0,
    creditTotalLabel: moneyFromCentsForMonthlyReference(0),
    creditTransactionCount: 0,
    debitTotalCents: 0,
    debitTotalLabel: moneyFromCentsForMonthlyReference(0),
    debitTransactionCount: 0,
    label: sourceRow?.label ?? titleCase(category),
    limitations: [
      "This visible row is recalculated from current-session category overrides.",
    ],
    month,
    ruleIds: sourceRow?.ruleIds ?? [],
    transactionCount: 0,
  };

  rowsByCategory.set(category, row);
  return row;
}

function compareMonthlyExpenseRows(
  left: ChargeInspectorCategoryMonthlySummary,
  right: ChargeInspectorCategoryMonthlySummary,
) {
  const amountComparison = right.debitTotalCents - left.debitTotalCents;
  return amountComparison !== 0
    ? amountComparison
    : left.label.localeCompare(right.label);
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
