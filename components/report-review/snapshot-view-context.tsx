"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Shared view state for the Money screen so the net-worth hero chart can drive
 * the spending detail below: selecting a month on the chart selects it in the
 * monthly detail so the two surfaces stay in sync.
 *
 * `availableMonths` is registered by the spending detail from its
 * transaction-derived rows, so the chart only offers months that actually have
 * monthly detail — months without data are not selectable rather than silently
 * falling back.
 *
 * State is in-session only and holds no financial data — just which month is in
 * view.
 */
type SnapshotViewValue = {
  selectedMonth: string | null;
  availableMonths: string[] | null;
  selectMonth: (month: string) => void;
  setAvailableMonths: (months: string[]) => void;
};

const SnapshotViewContext = createContext<SnapshotViewValue | null>(null);

export function SnapshotViewProvider({ children }: { children: ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [availableMonths, setAvailableMonthsState] = useState<string[] | null>(
    null,
  );

  const value = useMemo<SnapshotViewValue>(
    () => ({
      availableMonths,
      selectedMonth,
      selectMonth: (month: string) => {
        setSelectedMonth(month);
      },
      setAvailableMonths: (months: string[]) => {
        setAvailableMonthsState((current) =>
          current !== null &&
          current.length === months.length &&
          current.every((month, index) => month === months[index])
            ? current
            : months,
        );
      },
    }),
    [availableMonths, selectedMonth],
  );

  return (
    <SnapshotViewContext.Provider value={value}>
      {children}
    </SnapshotViewContext.Provider>
  );
}

/** Returns the shared view context, or `null` when no provider is present. */
export function useSnapshotView(): SnapshotViewValue | null {
  return useContext(SnapshotViewContext);
}
