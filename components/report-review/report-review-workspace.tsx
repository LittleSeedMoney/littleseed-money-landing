"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import {
  defaultManualProfileValues,
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

type ManualRequestState = "idle" | "submitting" | "error";

export function ReportReviewWorkspace({
  initialReport,
}: {
  initialReport: ReportReviewSample;
}) {
  const [report, setReport] = useState(initialReport);
  const [values, setValues] = useState(defaultManualProfileValues);
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
    field: keyof ManualProfileValues,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const nextValue = event.target.value;
    setValues((current) => ({ ...current, [field]: nextValue }));
  }

  function resetToSampleValues() {
    setValues(defaultManualProfileValues());
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
            onReset={resetToSampleValues}
            onSubmit={submitManualProfile}
            onUpdate={updateValue}
            requestState={requestState}
            values={values}
          />
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
  onReset,
  onSubmit,
  onUpdate,
  requestState,
  values,
}: {
  errorMessage: string;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (
    field: keyof ManualProfileValues,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  requestState: ManualRequestState;
  values: ManualProfileValues;
}) {
  const isSubmitting = requestState === "submitting";

  return (
    <section id="manual-input" aria-labelledby="manual-input-heading">
      <ReviewSectionHeading
        eyebrow="Input flow"
        id="manual-input-heading"
        title="Manual review inputs"
        description="Enter the minimum profile values needed for the private report and Emergency Fund Target review."
      />

      <form
        className="mt-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
        onSubmit={onSubmit}
      >
        <div className="grid gap-4 lg:grid-cols-3">
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
            field="cash"
            label="Cash and cash equivalents, dollars"
            onUpdate={onUpdate}
            required
            value={values.cash}
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
              <h3 className="text-sm font-semibold text-seed-950">
                Credit-card debt
              </h3>
              <p className="mt-1 text-sm leading-6 text-earth-700">
                Enter 0 values when there is no current credit-card balance.
              </p>
            </div>
            <StatusPill label="Required" tone="stone" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <NumberField
              field="creditCardBalance"
              label="Credit-card balance, dollars"
              onUpdate={onUpdate}
              required
              value={values.creditCardBalance}
            />
            <NumberField
              field="creditCardApr"
              label="Credit-card APR, percent"
              onUpdate={onUpdate}
              required
              value={values.creditCardApr}
            />
            <NumberField
              field="creditCardMonthlyPayment"
              label="Credit-card monthly payment, dollars"
              onUpdate={onUpdate}
              required
              value={values.creditCardMonthlyPayment}
            />
          </div>
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
          <button
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-earth-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-seed-500"
            onClick={onReset}
            type="button"
          >
            Reset sample inputs
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
  field: keyof ManualProfileValues;
  label: string;
  onUpdate: (
    field: keyof ManualProfileValues,
    event: ChangeEvent<HTMLInputElement>,
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
  field: keyof ManualProfileValues;
  label: string;
  onUpdate: (
    field: keyof ManualProfileValues,
    event: ChangeEvent<HTMLSelectElement>,
  ) => void;
  options: Array<[string, string]>;
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
