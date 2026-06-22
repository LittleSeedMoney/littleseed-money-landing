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
  const [selectedPreset, setSelectedPreset] = useState<
    ManualProfilePresetId | "custom"
  >("sample");
  const [requestState, setRequestState] = useState<ManualRequestState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeScreen, setActiveScreen] =
    useState<ReportReviewScreenId>("report");

  const generatedAt = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(new Date(report.generatedAt)),
    [report.generatedAt],
  );
  const sourceById = useMemo(
    () => new Map(report.evidenceSources.map((source) => [source.id, source])),
    [report.evidenceSources],
  );

  useEffect(() => {
    function syncScreenFromHash() {
      setActiveScreen(reportReviewScreenFromHash(window.location.hash));
    }

    syncScreenFromHash();
    window.addEventListener("hashchange", syncScreenFromHash);
    return () => window.removeEventListener("hashchange", syncScreenFromHash);
  }, []);

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
        onAddAsset={addAssetRow}
        onAddDebt={addDebtRow}
        onAssetUpdate={updateAssetValue}
        onDebtUpdate={updateDebtValue}
        onRemoveAsset={removeAssetRow}
        onRemoveDebt={removeDebtRow}
        onSubmit={submitManualProfile}
        onUpdate={updateValue}
        onValuesReset={resetValues}
        report={report}
        requestState={requestState}
        selectedPreset={selectedPreset}
        sourceById={sourceById}
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
