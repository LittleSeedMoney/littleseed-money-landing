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
 * the snapshot below: selecting a month on the chart selects it in the monthly
 * detail and switches the snapshot to its Monthly tab.
 *
 * `availableMonths` is registered by the snapshot from its transaction-derived
 * rows, so the chart only offers months that actually have monthly detail —
 * months without data are not selectable rather than silently falling back.
 *
 * State is in-session only and holds no financial data — just which month and
 * tab are in view.
 */
export type SnapshotTab = "overview" | "monthly";

type SnapshotViewValue = {
  selectedMonth: string | null;
  activeTab: SnapshotTab;
  availableMonths: string[] | null;
  selectMonth: (month: string) => void;
  setActiveTab: (tab: SnapshotTab) => void;
  setAvailableMonths: (months: string[]) => void;
};

const SnapshotViewContext = createContext<SnapshotViewValue | null>(null);

export function SnapshotViewProvider({ children }: { children: ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SnapshotTab>("overview");
  const [availableMonths, setAvailableMonthsState] = useState<string[] | null>(
    null,
  );

  const value = useMemo<SnapshotViewValue>(
    () => ({
      activeTab,
      availableMonths,
      selectedMonth,
      selectMonth: (month: string) => {
        setSelectedMonth(month);
        setActiveTab("monthly");
      },
      setActiveTab,
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
    [activeTab, availableMonths, selectedMonth],
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
