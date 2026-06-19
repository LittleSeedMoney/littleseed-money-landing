import type { ChangeEvent, FormEvent } from "react";

import {
  MANUAL_PROFILE_FIELD_REQUIREMENTS,
  MANUAL_PROFILE_PRESETS,
  type ManualAssetCategory,
  type ManualAssetValue,
  type ManualDebtType,
  type ManualDebtValue,
  type ManualProfileFieldRequirement,
  type ManualProfilePresetId,
  type ManualProfileScalarField,
  type ManualProfileValues,
} from "@/lib/report-review/manual-profile";

import { ReviewSectionHeading, StatusPill } from "./shared";

export type ManualRequestState = "idle" | "submitting" | "error";

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

export function ManualInputSection({
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
                In-session review inputs. Fields marked * build the request;
                blank fields stay missing.
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
            label="Monthly take-home income"
            onUpdate={onUpdate}
            prefix="$"
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
            label="Monthly housing cost"
            onUpdate={onUpdate}
            prefix="$"
            required
            value={values.monthlyHousingCost}
          />
          <NumberField
            field="monthlyNonHousingEssentialExpenses"
            label="Other monthly essentials"
            onUpdate={onUpdate}
            prefix="$"
            required
            value={values.monthlyNonHousingEssentialExpenses}
          />
          <NumberField
            field="monthlyDiscretionaryExpenses"
            label="Monthly discretionary expenses"
            onUpdate={onUpdate}
            prefix="$"
            required
            value={values.monthlyDiscretionaryExpenses}
          />
          <NumberField
            field="monthlyInvestmentContribution"
            label="Monthly investing contribution"
            onUpdate={onUpdate}
            prefix="$"
            required
            value={values.monthlyInvestmentContribution}
          />
          <NumberField
            field="grossAnnualIncome"
            label="Gross annual income"
            onUpdate={onUpdate}
            prefix="$"
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
                    required
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
                    label="Balance"
                    onChange={(event) =>
                      onAssetUpdate(asset.id, "balance", event.target.value)
                    }
                    prefix="$"
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
                      requirement={
                        isPositiveDecimal(debt.balance)
                          ? "required"
                          : "conditional"
                      }
                      label="Liability name"
                      onChange={(event) =>
                        onDebtUpdate(debt.id, "name", event.target.value)
                      }
                      required={isPositiveDecimal(debt.balance)}
                      value={debt.name}
                    />
                    <SelectValueField
                      required
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
                      label="Balance"
                      onChange={(event) =>
                        onDebtUpdate(debt.id, "balance", event.target.value)
                      }
                      prefix="$"
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
                      label="Monthly payment"
                      onChange={(event) =>
                        onDebtUpdate(
                          debt.id,
                          "monthlyPayment",
                          event.target.value,
                        )
                      }
                      prefix="$"
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
  prefix,
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
  prefix?: string;
  required?: boolean;
  step?: string;
  value: string;
}) {
  const requirement = MANUAL_PROFILE_FIELD_REQUIREMENTS[field];

  return (
    <label className="block">
      <FieldLabel label={label} requirement={requirement} />
      <span className="relative mt-2 block">
        {prefix ? <InputPrefix value={prefix} /> : null}
        <input
          className={numberInputClass(prefix)}
          inputMode="decimal"
          min="0"
          onChange={(event) => onUpdate(field, event)}
          required={required}
          step={step}
          type="number"
          value={value}
        />
      </span>
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
  const requirement = MANUAL_PROFILE_FIELD_REQUIREMENTS[field];

  return (
    <label className="block">
      <FieldLabel label={label} requirement={requirement} />
      <select
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
        onChange={(event) => onUpdate(field, event)}
        required={requirement === "required"}
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
  requirement,
  required = false,
  value,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  requirement?: ManualProfileFieldRequirement | "conditional";
  required?: boolean;
  value: string;
}) {
  const resolvedRequirement =
    requirement ?? (required ? "required" : "optional");

  return (
    <label className="block">
      <FieldLabel label={label} requirement={resolvedRequirement} />
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
  prefix,
  requirement,
  required = false,
  step = "0.01",
  value,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  requirement?: ManualProfileFieldRequirement | "conditional";
  required?: boolean;
  step?: string;
  value: string;
}) {
  const resolvedRequirement =
    requirement ?? (required ? "required" : "optional");

  return (
    <label className="block">
      <FieldLabel label={label} requirement={resolvedRequirement} />
      <span className="relative mt-2 block">
        {prefix ? <InputPrefix value={prefix} /> : null}
        <input
          className={numberInputClass(prefix)}
          inputMode="decimal"
          min="0"
          onChange={onChange}
          required={required}
          step={step}
          type="number"
          value={value}
        />
      </span>
    </label>
  );
}

function InputPrefix({ value }: { value: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-earth-600"
    >
      {value}
    </span>
  );
}

function numberInputClass(prefix?: string) {
  return `min-h-11 w-full rounded-lg border border-stone-300 bg-white py-2 pr-3 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200 ${
    prefix ? "pl-7" : "pl-3"
  }`;
}

function SelectValueField({
  label,
  onChange,
  options,
  required = false,
  value,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: ReadonlyArray<readonly [string, string]>;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block">
      <FieldLabel
        label={label}
        requirement={required ? "required" : "optional"}
      />
      <select
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
        onChange={onChange}
        required={required}
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

function FieldLabel({
  label,
  requirement,
}: {
  label: string;
  requirement: ManualProfileFieldRequirement | "conditional";
}) {
  const isRequired = requirement === "required";
  const isConditional = requirement === "conditional";

  return (
    <span className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-sm font-medium text-earth-800">
        {label}
        {isRequired ? (
          <>
            <span aria-hidden="true" className="ml-1 text-seed-700">
              *
            </span>
            <span className="sr-only"> required</span>
          </>
        ) : null}
      </span>
      {isConditional ? (
        <span className="text-xs font-semibold text-seed-700">
          * if balance &gt; 0
        </span>
      ) : null}
    </span>
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

export function createManualRowId(prefix: "asset" | "debt") {
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
