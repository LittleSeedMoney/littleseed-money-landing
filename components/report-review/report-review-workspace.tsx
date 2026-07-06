"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import type {
  ReportReviewSample,
  SnapshotItem,
} from "@/data/report-review-sample";
import {
  defaultManualProfileValues,
  type ManualAssetValue,
  type ManualDebtValue,
  type ManualProfilePresetId,
  type ManualProfileScalarField,
  type ManualProfileValues,
} from "@/lib/report-review/manual-profile";
import {
  currentGoalPlanningAsOfMonth,
  currentGoalPlanningAsOfMonthUTC,
  defaultGoalPlanningRows,
  summarizeGoalPlan,
  type GoalPlanningRow,
} from "@/lib/report-review/goal-planning";
import { MONEY_BLOCK_SHOW_EVENT } from "@/lib/report-review/money-arrangement";
import { scrollOnceShown } from "@/lib/report-review/reveal-anchor";
import {
  reportReviewRevealTargetForHash,
  reportReviewScreenFromHash,
  type ReportReviewScreenId,
} from "@/lib/report-review/report-review-screens";

import {
  createManualRowId,
  type ManualRequestState,
} from "./manual-input-section";
import { ReportReviewScreenPanel } from "./report-review-screen-panel";
import { ReportReviewShell } from "./report-review-shell";

export function ReportReviewWorkspace({
  aiEnabled,
  initialReport,
}: {
  aiEnabled: boolean;
  initialReport: ReportReviewSample;
}) {
  const [report, setReport] = useState(initialReport);
  const [values, setValues] = useState(defaultManualProfileValues);
  const [goalRows, setGoalRows] = useState(defaultGoalPlanningRows);
  // Goal progress counts against the visitor's local calendar month (owner
  // decision: at UTC Jun 30 23:00 a KST visitor is already in July). The
  // server cannot know the visitor's timezone, so the first paint uses the
  // UTC month: that removes timezone-offset SSR/CSR disagreement for the
  // common path (a render/hydration straddle across 00:00 UTC on the first
  // of a month is still a tiny residual race — avoiding it entirely would
  // require serializing the server-computed month). The effect below adopts
  // the visitor's local month after mount.
  const [goalPlanningAsOfMonth, setGoalPlanningAsOfMonth] = useState(() =>
    currentGoalPlanningAsOfMonthUTC(),
  );

  useEffect(() => {
    setGoalPlanningAsOfMonth(currentGoalPlanningAsOfMonth());
  }, []);
  const [selectedPreset, setSelectedPreset] = useState<
    ManualProfilePresetId | "custom"
  >("sample");
  const [requestState, setRequestState] = useState<ManualRequestState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeScreen, setActiveScreen] =
    useState<ReportReviewScreenId>("money");

  // Compose the date and time from explicit fields joined by a fixed literal.
  // A single `dateStyle`/`timeStyle` formatter draws its date↔time connector
  // from the runtime's ICU/CLDR data, which varies by version: Node renders
  // "Jun 12, 2026 at 3:12 AM" while some browsers render "Jun 12, 2026, 3:12 AM".
  // That difference makes the SSR HTML and the hydrating client tree disagree,
  // triggering a hydration mismatch. Individual month/day/year/hour/minute
  // fields carry no locale connector, so server and client always agree. The
  // trailing " UTC" is appended by the caller (`OverviewSection`).
  const generatedAt = useMemo(() => {
    const generated = new Date(report.generatedAt);
    const date = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(generated);
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }).format(generated);
    return `${date}, ${time}`;
  }, [report.generatedAt]);
  const sourceById = useMemo(
    () => new Map(report.evidenceSources.map((source) => [source.id, source])),
    [report.evidenceSources],
  );
  const goalSummaries = useMemo(
    () => summarizeGoalPlan(goalRows, goalPlanningAsOfMonth),
    [goalPlanningAsOfMonth, goalRows],
  );
  const topGoalSummary = goalSummaries[0] ?? null;

  const [revealTarget, setRevealTarget] = useState<{
    id: string;
    nonce: number;
  } | null>(null);

  useEffect(() => {
    function syncScreenFromHash() {
      const hash = window.location.hash;
      setActiveScreen(reportReviewScreenFromHash(hash));
      const target = reportReviewRevealTargetForHash(hash);
      setRevealTarget(target ? { id: target, nonce: Date.now() } : null);
    }

    syncScreenFromHash();
    window.addEventListener("hashchange", syncScreenFromHash);
    return () => window.removeEventListener("hashchange", syncScreenFromHash);
  }, []);

  // After the resolved screen renders, open the deep-linked section (and any
  // ancestor disclosure) and scroll it into view.
  useEffect(() => {
    if (!revealTarget) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(revealTarget.id);
      if (!element) {
        return;
      }

      // The target can sit inside a Money block hidden by the in-session
      // arrangement (Phase 5.5.6). Hidden content must remain reachable, so
      // ask the arrangement owner to show the block and scroll a couple of
      // frames later, after React has re-rendered it visible.
      const hiddenBlock = element.closest("[data-money-block][hidden]");
      if (hiddenBlock instanceof HTMLElement) {
        hiddenBlock.dispatchEvent(
          new CustomEvent(MONEY_BLOCK_SHOW_EVENT, {
            bubbles: true,
            detail: hiddenBlock.dataset.moneyBlock,
          }),
        );
      }

      for (
        let node: HTMLElement | null = element;
        node;
        node = node.parentElement
      ) {
        if (node instanceof HTMLDetailsElement) {
          node.open = true;
        }
      }
      element.closest("details")?.setAttribute("open", "");

      if (hiddenBlock) {
        // Scroll only once the block has re-rendered visible; a scroll issued
        // against a display:none subtree is silently ignored.
        scrollOnceShown(element, "start");
        return;
      }
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => cancelAnimationFrame(frame);
  }, [activeScreen, revealTarget]);

  async function submitManualProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/private/report-review/workspace-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        error?: string;
        report?: ReportReviewSample;
      };

      if (!response.ok || !payload.report) {
        throw new Error(payload.error ?? `Report request failed.`);
      }

      const nextReport = payload.report;
      setReport((currentReport) =>
        preserveExternalPortfolioItems(nextReport, currentReport),
      );
      setRequestState("idle");
    } catch (error) {
      setRequestState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Manual report request failed.",
      );
    }
  }

  function updateValue(
    field: ManualProfileScalarField,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const nextValue = event.target.value;
    setSelectedPreset("custom");
    setValues((current) => ({ ...current, [field]: nextValue }));
  }

  function updateAssetValue<T extends keyof ManualAssetValue>(
    id: string,
    field: T,
    value: ManualAssetValue[T],
  ) {
    setSelectedPreset("custom");
    setValues((current) => ({
      ...current,
      assets: current.assets.map((asset) =>
        asset.id === id ? { ...asset, [field]: value } : asset,
      ),
    }));
  }

  function updateDebtValue<T extends keyof ManualDebtValue>(
    id: string,
    field: T,
    value: ManualDebtValue[T],
  ) {
    setSelectedPreset("custom");
    setValues((current) => ({
      ...current,
      debts: current.debts.map((debt) =>
        debt.id === id ? { ...debt, [field]: value } : debt,
      ),
    }));
  }

  function addAssetRow() {
    const id = createManualRowId("asset");

    setSelectedPreset("custom");
    setValues((current) => ({
      ...current,
      assets: [
        ...current.assets,
        {
          id,
          name: "New asset",
          category: "other",
          balance: "0.00",
        },
      ],
    }));
    return id;
  }

  function removeAssetRow(id: string) {
    setSelectedPreset("custom");
    setValues((current) => {
      if (current.assets.length === 1) {
        return current;
      }

      return {
        ...current,
        assets: current.assets.filter((asset) => asset.id !== id),
      };
    });
  }

  function addDebtRow() {
    const id = createManualRowId("debt");

    setSelectedPreset("custom");
    setValues((current) => ({
      ...current,
      debts: [
        ...current.debts,
        {
          id,
          name: "New liability",
          debtType: "other",
          balance: "0.00",
          annualInterestRate: "0.00",
          monthlyPayment: "0.00",
          interestTaxAdvantaged: false,
        },
      ],
    }));
    return id;
  }

  function removeDebtRow(id: string) {
    setSelectedPreset("custom");
    setValues((current) => ({
      ...current,
      debts: current.debts.filter((debt) => debt.id !== id),
    }));
  }

  function resetValues(
    nextValues: ManualProfileValues,
    nextPreset: ManualProfilePresetId | "custom",
  ) {
    setValues(nextValues);
    setSelectedPreset(nextPreset);
    setErrorMessage("");
    setRequestState("idle");
  }

  function updateGoalValue<T extends keyof GoalPlanningRow>(
    id: string,
    field: T,
    value: GoalPlanningRow[T],
  ) {
    setGoalRows((current) =>
      current.map((goal) =>
        goal.id === id ? { ...goal, [field]: value } : goal,
      ),
    );
  }

  function addGoalRow() {
    setGoalRows((current) => {
      const nextIndex = current.length + 1;

      return [
        ...current,
        {
          currentSaved: "0.00",
          id: createManualRowId("goal"),
          monthlyContribution: "0.00",
          name: `New goal ${nextIndex}`,
          targetAmount: "0.00",
          targetMonth: "",
          type: "custom",
        },
      ];
    });
  }

  function removeGoalRow(id: string) {
    setGoalRows((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((goal) => goal.id !== id);
    });
  }

  function moveGoalRow(id: string, direction: "up" | "down") {
    setGoalRows((current) => {
      const index = current.findIndex((goal) => goal.id === id);

      if (index < 0) {
        return current;
      }

      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextRows = [...current];
      const [movedGoal] = nextRows.splice(index, 1);

      if (!movedGoal) {
        return current;
      }

      nextRows.splice(nextIndex, 0, movedGoal);
      return nextRows;
    });
  }

  function selectScreen(screen: ReportReviewScreenId) {
    setActiveScreen(screen);
    window.history.replaceState(null, "", `#${screen}`);
  }

  return (
    <ReportReviewShell
      activeScreen={activeScreen}
      dataLabel={dataLabel(report)}
      onScreenSelect={selectScreen}
      report={report}
    >
      <ReportReviewScreenPanel
        activeScreen={activeScreen}
        aiEnabled={aiEnabled}
        errorMessage={errorMessage}
        generatedAt={generatedAt}
        goalPlanningAsOfMonth={goalPlanningAsOfMonth}
        goalRows={goalRows}
        onAddAsset={addAssetRow}
        onAddDebt={addDebtRow}
        onAddGoal={addGoalRow}
        onAssetUpdate={updateAssetValue}
        onDebtUpdate={updateDebtValue}
        onGoalMove={moveGoalRow}
        onGoalRemove={removeGoalRow}
        onGoalUpdate={updateGoalValue}
        onRemoveAsset={removeAssetRow}
        onRemoveDebt={removeDebtRow}
        onSubmit={submitManualProfile}
        onUpdate={updateValue}
        onValuesReset={resetValues}
        report={report}
        requestState={requestState}
        selectedPreset={selectedPreset}
        sourceById={sourceById}
        topGoalSummary={topGoalSummary}
        values={values}
      />
    </ReportReviewShell>
  );
}

function dataLabel(report: ReportReviewSample) {
  const activeSource = report.dataSources.find(
    (source) => source.status === "active",
  );

  if (activeSource) {
    return activeSource.kind === "manual"
      ? "Manual source"
      : activeSource.label;
  }

  if (report.dataMode.toLowerCase().includes("user")) {
    return "User-entered data";
  }
  if (report.dataMode.toLowerCase().includes("api")) {
    return "Sample via API";
  }
  return "Sample data";
}

function preserveExternalPortfolioItems(
  nextReport: ReportReviewSample,
  currentReport: ReportReviewSample,
): ReportReviewSample {
  const assets = preserveExternalSnapshotItems(
    nextReport.assetPortfolio.assets,
    currentReport.assetPortfolio.assets,
  );
  const liabilities = preserveExternalSnapshotItems(
    nextReport.assetPortfolio.liabilities,
    currentReport.assetPortfolio.liabilities,
  );

  if (
    assets === nextReport.assetPortfolio.assets &&
    liabilities === nextReport.assetPortfolio.liabilities
  ) {
    return nextReport;
  }

  return {
    ...nextReport,
    assetPortfolio: {
      ...nextReport.assetPortfolio,
      assets,
      liabilities,
    },
  };
}

function preserveExternalSnapshotItems(
  nextItems: SnapshotItem[],
  currentItems: SnapshotItem[],
) {
  const nextIds = new Set(nextItems.map((item) => item.id));
  const preservedItems = currentItems.filter(
    (item) => isExternalSnapshotItem(item) && !nextIds.has(item.id),
  );

  if (preservedItems.length === 0) {
    return nextItems;
  }

  return [...nextItems, ...preservedItems];
}

function isExternalSnapshotItem(item: SnapshotItem) {
  return (
    item.provenance === "csv-imported" ||
    item.provenance === "linked-account"
  );
}
