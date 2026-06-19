"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import {
  defaultManualProfileValues,
  manualProfilePresetValues,
  type ManualAssetValue,
  type ManualDebtValue,
  type ManualProfilePresetId,
  type ManualProfileScalarField,
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
  initialReport,
}: {
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

      setReport(payload.report);
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
    setSelectedPreset("custom");
    setValues((current) => ({
      ...current,
      assets: [
        ...current.assets,
        {
          id: createManualRowId("asset"),
          name: "New asset",
          category: "other",
          balance: "0.00",
        },
      ],
    }));
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
    setSelectedPreset("custom");
    setValues((current) => ({
      ...current,
      debts: [
        ...current.debts,
        {
          id: createManualRowId("debt"),
          name: "New liability",
          debtType: "other",
          balance: "0.00",
          annualInterestRate: "0.00",
          monthlyPayment: "0.00",
          interestTaxAdvantaged: false,
        },
      ],
    }));
  }

  function removeDebtRow(id: string) {
    setSelectedPreset("custom");
    setValues((current) => ({
      ...current,
      debts: current.debts.filter((debt) => debt.id !== id),
    }));
  }

  function applyPreset(presetId: ManualProfilePresetId) {
    setValues(manualProfilePresetValues(presetId));
    setSelectedPreset(presetId);
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
      dataLabel={dataLabel(report.dataMode)}
      onScreenSelect={selectScreen}
      report={report}
    >
      <ReportReviewScreenPanel
        activeScreen={activeScreen}
        errorMessage={errorMessage}
        generatedAt={generatedAt}
        onAddAsset={addAssetRow}
        onAddDebt={addDebtRow}
        onAssetUpdate={updateAssetValue}
        onDebtUpdate={updateDebtValue}
        onPresetSelect={applyPreset}
        onRemoveAsset={removeAssetRow}
        onRemoveDebt={removeDebtRow}
        onSubmit={submitManualProfile}
        onUpdate={updateValue}
        report={report}
        requestState={requestState}
        selectedPreset={selectedPreset}
        sourceById={sourceById}
        values={values}
      />
    </ReportReviewShell>
  );
}

function dataLabel(dataMode: string) {
  if (dataMode.toLowerCase().includes("user")) {
    return "User-entered data";
  }
  if (dataMode.toLowerCase().includes("api")) {
    return "Sample via API";
  }
  return "Sample data";
}
