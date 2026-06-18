"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import {
  MANUAL_PROFILE_PRESETS,
  defaultManualProfileValues,
  manualProfilePresetValues,
  type ManualAssetCategory,
  type ManualAssetValue,
  type ManualDebtType,
  type ManualDebtValue,
  type ManualProfilePresetId,
  type ManualProfileScalarField,
  type ManualProfileValues,
} from "@/lib/report-review/manual-profile";

import { AssetPortfolioSection } from "./asset-portfolio-section";
import { EducationSection } from "./education-section";
import { EvidenceSection } from "./evidence-section";
import { FindingsSection } from "./findings-section";
import { InputsSection } from "./inputs-section";
import { OverviewSection } from "./overview-section";
import { ReportReviewHeader } from "./report-review-header";
import { ReportReviewNav } from "./report-review-nav";
import { ReportSections } from "./report-sections";
import { ReviewRail } from "./review-rail";
import { ReviewSectionHeading, StatusPill } from "./shared";
import { ValidationChecklistSection } from "./validation-checklist-section";

type ManualRequestState = "idle" | "submitting" | "error";

const ASSET_CATEGORY_OPTIONS: Array<[ManualAssetCategory, string]> = [
  ["cash", "Cash"],
  ["retirement", "Retirement"],
  ["brokerage", "Brokerage"],
  ["other", "Other"],
];

const DEBT_TYPE_OPTIONS: Array<[ManualDebtType, string]> = [
  ["credit_card", "Credit card"],
  ["student_loan", "Student loan"],
  ["auto_loan", "Auto loan"],
  ["personal_loan", "Personal loan"],
  ["medical_debt", "Medical debt"],
  ["other", "Other"],
];

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

  return (
    <main className="min-h-screen bg-stone-50 text-earth-900">
      <ReportReviewHeader dataLabel={dataLabel(report.dataMode)} />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:px-8">
        <ReportReviewNav />

        <div className="min-w-0 space-y-6">
          <ManualInputSection
            errorMessage={errorMessage}
            onAddAsset={addAssetRow}
            onAddDebt={addDebtRow}
            onAssetUpdate={updateAssetValue}
            onDebtUpdate={updateDebtValue}
            onRemoveAsset={removeAssetRow}
            onRemoveDebt={removeDebtRow}
            onPresetSelect={applyPreset}
            onSubmit={submitManualProfile}
            onUpdate={updateValue}
            requestState={requestState}
            selectedPreset={selectedPreset}
            values={values}
          />
          <ValidationChecklistSection selectedPreset={selectedPreset} />
          {hasReportContent(report) ? (
            <>
              <OverviewSection generatedAt={generatedAt} report={report} />
              <ReportSections
                sections={report.sections}
                sourceById={sourceById}
              />
              <AssetPortfolioSection
                decisionReadiness={report.decisionReadiness}
                portfolio={report.assetPortfolio}
                sourceById={sourceById}
              />
              <FindingsSection findings={report.findings} />
              <EducationSection
                decisionReadiness={report.decisionReadiness}
                findings={report.findings}
              />
              <EvidenceSection sources={report.evidenceSources} />
              <InputsSection dataCompleteness={report.dataCompleteness} />
            </>
          ) : (
            <EmptyReportState />
          )}
        </div>

        <ReviewRail report={report} />
      </div>
    </main>
  );
}

function ManualInputSection({
  errorMessage,
  onAddAsset,
  onAddDebt,
  onAssetUpdate,
  onDebtUpdate,
  onRemoveAsset,
  onRemoveDebt,
  onPresetSelect,
  onSubmit,
  onUpdate,
  requestState,
  selectedPreset,
  values,
}: {
  errorMessage: string;
  onAddAsset: () => void;
  onAddDebt: () => void;
  onAssetUpdate: <T extends keyof ManualAssetValue>(
    id: string,
    field: T,
    value: ManualAssetValue[T],
  ) => void;
  onDebtUpdate: <T extends keyof ManualDebtValue>(
    id: string,
    field: T,
    value: ManualDebtValue[T],
  ) => void;
  onRemoveAsset: (id: string) => void;
  onRemoveDebt: (id: string) => void;
  onPresetSelect: (presetId: ManualProfilePresetId) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (
    field: ManualProfileScalarField,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  requestState: ManualRequestState;
  selectedPreset: ManualProfilePresetId | "custom";
  values: ManualProfileValues;
}) {
  const isSubmitting = requestState === "submitting";

  return (
    <section id="manual-input" aria-labelledby="manual-input-heading">
      <ReviewSectionHeading
        eyebrow="Input flow"
        id="manual-input-heading"
        title="Manual review inputs"
        description="Enter the profile, asset, and liability values needed for the private report and Emergency Fund Target review."
      />

      <form
        className="mt-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
        onSubmit={onSubmit}
      >
        <div className="border-b border-stone-200 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-seed-950">
                Scenario presets
              </h3>
              <p className="mt-1 text-sm leading-6 text-earth-700">
                In-session review inputs. No profile is saved.
              </p>
            </div>
            <StatusPill
              label={selectedPreset === "custom" ? "Custom inputs" : "Preset"}
              tone="stone"
            />
          </div>
          <div
            aria-label="Scenario presets"
            className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
            role="group"
          >
            {MANUAL_PROFILE_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;

              return (
                <button
                  aria-pressed={isSelected}
                  className={presetButtonClass(isSelected)}
                  key={preset.id}
                  onClick={() => onPresetSelect(preset.id)}
                  type="button"
                >
                  <span className="block text-sm font-semibold">
                    {preset.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5">
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedPreset === "custom" ? (
            <p className="mt-3 text-sm leading-6 text-earth-700">
              Inputs have changed after loading a preset.
            </p>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <NumberField
            field="age"
            label="Age"
            onUpdate={onUpdate}
            required
            step="1"
            value={values.age}
          />
          <NumberField
            field="monthlyTakeHomeIncome"
            label="Monthly take-home income, dollars"
            onUpdate={onUpdate}
            required
            value={values.monthlyTakeHomeIncome}
          />
          <SelectField
            field="incomePattern"
            label="Income pattern"
            onUpdate={onUpdate}
            options={[
              ["mostly_stable", "Mostly stable"],
              ["variable", "Variable"],
              ["seasonal", "Seasonal"],
              ["irregular", "Irregular"],
            ]}
            value={values.incomePattern}
          />
          <NumberField
            field="monthlyHousingCost"
            label="Monthly housing cost, dollars"
            onUpdate={onUpdate}
            required
            value={values.monthlyHousingCost}
          />
          <NumberField
            field="monthlyNonHousingEssentialExpenses"
            label="Other monthly essentials, dollars"
            onUpdate={onUpdate}
            required
            value={values.monthlyNonHousingEssentialExpenses}
          />
          <NumberField
            field="monthlyDiscretionaryExpenses"
            label="Monthly discretionary expenses, dollars"
            onUpdate={onUpdate}
            required
            value={values.monthlyDiscretionaryExpenses}
          />
          <NumberField
            field="monthlyInvestmentContribution"
            label="Monthly investing contribution, dollars"
            onUpdate={onUpdate}
            required
            value={values.monthlyInvestmentContribution}
          />
          <NumberField
            field="grossAnnualIncome"
            label="Gross annual income, dollars"
            onUpdate={onUpdate}
            value={values.grossAnnualIncome}
          />
          <SelectField
            field="jobStability"
            label="Job stability"
            onUpdate={onUpdate}
            options={[
              ["high", "High"],
              ["medium", "Medium"],
              ["low", "Low"],
            ]}
            value={values.jobStability}
          />
          <SelectField
            field="riskTolerance"
            label="Risk tolerance"
            onUpdate={onUpdate}
            options={[
              ["medium", "Medium"],
              ["low", "Low"],
              ["high", "High"],
            ]}
            value={values.riskTolerance}
          />
          <NumberField
            field="expectedYearsInCurrentLocation"
            label="Expected years in current location"
            onUpdate={onUpdate}
            required
            step="1"
            value={values.expectedYearsInCurrentLocation}
          />
          <NumberField
            field="dependents"
            label="Dependents"
            onUpdate={onUpdate}
            step="1"
            value={values.dependents}
          />
          <NumberField
            field="userTargetMonths"
            label="Your emergency target, months"
            onUpdate={onUpdate}
            value={values.userTargetMonths}
          />
        </div>

        <div className="mt-5 border-t border-stone-200 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-seed-950">Assets</h3>
              <p className="mt-1 text-sm leading-6 text-earth-700">
                Track cash separately from longer-term balances so liquidity
                stays visible in the report.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill label="Required" tone="stone" />
              <button
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-earth-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-seed-500"
                onClick={onAddAsset}
                type="button"
              >
                Add asset
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {values.assets.map((asset, index) => (
              <div
                className="border-t border-stone-200 pt-4 first:border-t-0 first:pt-0"
                key={asset.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-earth-800">
                    Asset {index + 1}
                  </p>
                  <button
                    className="self-start rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-earth-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-seed-500 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                    disabled={values.assets.length === 1}
                    onClick={() => onRemoveAsset(asset.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <TextValueField
                    label="Asset name"
                    onChange={(event) =>
                      onAssetUpdate(asset.id, "name", event.target.value)
                    }
                    required
                    value={asset.name}
                  />
                  <SelectValueField
                    label="Category"
                    onChange={(event) =>
                      onAssetUpdate(
                        asset.id,
                        "category",
                        event.target.value as ManualAssetCategory,
                      )
                    }
                    options={ASSET_CATEGORY_OPTIONS}
                    value={asset.category}
                  />
                  <NumberValueField
                    label="Balance, dollars"
                    onChange={(event) =>
                      onAssetUpdate(asset.id, "balance", event.target.value)
                    }
                    required
                    value={asset.balance}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-stone-200 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-seed-950">
                Liabilities
              </h3>
              <p className="mt-1 text-sm leading-6 text-earth-700">
                Rows with no balance stay out of the submitted liability list.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill label="Optional" tone="stone" />
              <button
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-earth-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-seed-500"
                onClick={onAddDebt}
                type="button"
              >
                Add liability
              </button>
            </div>
          </div>
          {values.debts.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-stone-300 px-4 py-3 text-sm leading-6 text-earth-700">
              No liabilities entered.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {values.debts.map((debt, index) => (
                <div
                  className="border-t border-stone-200 pt-4 first:border-t-0 first:pt-0"
                  key={debt.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-earth-800">
                      Liability {index + 1}
                    </p>
                    <button
                      className="self-start rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-earth-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-seed-500 sm:self-auto"
                      onClick={() => onRemoveDebt(debt.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <TextValueField
                      label="Liability name"
                      onChange={(event) =>
                        onDebtUpdate(debt.id, "name", event.target.value)
                      }
                      required={isPositiveDecimal(debt.balance)}
                      value={debt.name}
                    />
                    <SelectValueField
                      label="Type"
                      onChange={(event) =>
                        onDebtUpdate(
                          debt.id,
                          "debtType",
                          event.target.value as ManualDebtType,
                        )
                      }
                      options={DEBT_TYPE_OPTIONS}
                      value={debt.debtType}
                    />
                    <NumberValueField
                      label="Balance, dollars"
                      onChange={(event) =>
                        onDebtUpdate(debt.id, "balance", event.target.value)
                      }
                      required
                      value={debt.balance}
                    />
                    <NumberValueField
                      label="APR, percent"
                      onChange={(event) =>
                        onDebtUpdate(
                          debt.id,
                          "annualInterestRate",
                          event.target.value,
                        )
                      }
                      required
                      value={debt.annualInterestRate}
                    />
                    <NumberValueField
                      label="Monthly payment, dollars"
                      onChange={(event) =>
                        onDebtUpdate(
                          debt.id,
                          "monthlyPayment",
                          event.target.value,
                        )
                      }
                      required
                      value={debt.monthlyPayment}
                    />
                  </div>
                  <CheckboxField
                    checked={debt.interestTaxAdvantaged}
                    label="Interest may be tax advantaged"
                    onChange={(event) =>
                      onDebtUpdate(
                        debt.id,
                        "interestTaxAdvantaged",
                        event.target.checked,
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {errorMessage ? (
          <div
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-950"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-lg border border-seed-700 bg-seed-700 px-4 py-2 text-sm font-semibold text-white hover:bg-seed-800 focus:outline-none focus:ring-2 focus:ring-seed-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Running report" : "Run manual report"}
          </button>
        </div>
      </form>
    </section>
  );
}

function NumberField({
  field,
  label,
  onUpdate,
  required = false,
  step = "0.01",
  value,
}: {
  field: ManualProfileScalarField;
  label: string;
  onUpdate: (
    field: ManualProfileScalarField,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  required?: boolean;
  step?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-earth-800">{label}</span>
      <input
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
        inputMode="decimal"
        min="0"
        onChange={(event) => onUpdate(field, event)}
        required={required}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function SelectField({
  field,
  label,
  onUpdate,
  options,
  value,
}: {
  field: ManualProfileScalarField;
  label: string;
  onUpdate: (
    field: ManualProfileScalarField,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  options: ReadonlyArray<readonly [string, string]>;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-earth-800">{label}</span>
      <select
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
        onChange={(event) => onUpdate(field, event)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextValueField({
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
    <label className="block">
      <span className="text-sm font-medium text-earth-800">{label}</span>
      <input
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
        onChange={onChange}
        required={required}
        type="text"
        value={value}
      />
    </label>
  );
}

function NumberValueField({
  label,
  onChange,
  required = false,
  step = "0.01",
  value,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  step?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-earth-800">{label}</span>
      <input
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
        inputMode="decimal"
        min="0"
        onChange={onChange}
        required={required}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function SelectValueField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: ReadonlyArray<readonly [string, string]>;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-earth-800">{label}</span>
      <select
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
        onChange={onChange}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="mt-3 flex items-center gap-2 text-sm font-medium text-earth-800">
      <input
        checked={checked}
        className="h-4 w-4 rounded border-stone-300 text-seed-700 focus:ring-seed-500"
        onChange={onChange}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

function createManualRowId(prefix: "asset" | "debt") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isPositiveDecimal(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

function presetButtonClass(isSelected: boolean) {
  const base =
    "min-h-24 rounded-lg border px-3 py-3 text-left text-earth-800 shadow-sm outline-none transition focus:ring-2 focus:ring-seed-500";

  if (isSelected) {
    return `${base} border-seed-700 bg-seed-50 text-seed-950`;
  }

  return `${base} border-stone-300 bg-white hover:bg-stone-50`;
}

function hasReportContent(report: ReportReviewSample) {
  return report.summaryMetrics.length > 0 || report.sections.length > 0;
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

function EmptyReportState() {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-seed-700">
        Review state
      </p>
      <h2 className="mt-2 text-xl font-semibold text-seed-950">
        No report data returned
      </h2>
      <p className="mt-3 text-sm leading-6 text-earth-700">
        The platform response did not include renderable report sections or
        summary metrics for this session.
      </p>
    </section>
  );
}
