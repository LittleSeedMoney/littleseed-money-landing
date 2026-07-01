import {
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type Ref,
} from "react";

import {
  type ManualAssetCategory,
  type ManualAssetValue,
  type ManualDebtType,
  type ManualDebtValue,
  type ManualProfileFieldRequirement,
  type ManualProfileValues,
} from "@/lib/report-review/manual-profile";

import { reviewDashedPanelClass } from "./shared";

export type ManualRequestState = "idle" | "submitting" | "error";
export type PortfolioEditGroup = "assets" | "liabilities";
export type PortfolioEditTarget =
  | { group: "assets"; id: string }
  | { group: "liabilities"; id: string };

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

const SAVE_LABEL: Record<PortfolioEditGroup, string> = {
  assets: "Save assets",
  liabilities: "Save liabilities",
};

const SAVING_LABEL: Record<PortfolioEditGroup, string> = {
  assets: "Saving assets",
  liabilities: "Saving liabilities",
};

export function PortfolioSnapshotGroupEditForm({
  errorMessage,
  group,
  headingId,
  onAddAsset,
  onAddDebt,
  onAssetUpdate,
  onDebtUpdate,
  onRemoveAsset,
  onRemoveDebt,
  onSubmit,
  requestState,
  values,
}: {
  errorMessage: string;
  group: PortfolioEditGroup;
  headingId: string;
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
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  requestState: ManualRequestState;
  values: ManualProfileValues;
}) {
  const isSubmitting = requestState === "submitting";

  return (
    <form
      aria-labelledby={headingId}
      className="space-y-5"
      id={group === "assets" ? "manual-input" : "manual-input-liabilities"}
      onSubmit={onSubmit}
    >
      <p className="sr-only">
        Fields marked * build the request; blank optional fields stay missing.
      </p>

      {group === "assets" ? (
        <div className="border-t border-stone-200 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-seed-950">Assets</h3>
              <p className="sr-only">
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
      ) : null}

      {group === "liabilities" ? (
        <div className="border-t border-stone-200 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-seed-950">
                Liabilities
              </h3>
              <p className="sr-only">
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
            <p
              className={reviewDashedPanelClass(
                "mt-4 px-4 py-3 text-sm leading-6 text-earth-700",
              )}
            >
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
      ) : null}

      {errorMessage ? (
        <div
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-950"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row">
        <button
          className="rounded-lg border border-seed-700 bg-seed-700 px-4 py-2 text-sm font-semibold text-white hover:bg-seed-800 focus:outline-none focus:ring-2 focus:ring-seed-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? SAVING_LABEL[group] : SAVE_LABEL[group]}
        </button>
      </div>
    </form>
  );
}

export function PortfolioSnapshotAssetEditForm({
  asset,
  errorMessage,
  onAssetUpdate,
  onCancelEdit,
  onSubmit,
  requestState,
}: {
  asset: ManualAssetValue;
  errorMessage: string;
  onAssetUpdate: <T extends keyof ManualAssetValue>(
    id: string,
    field: T,
    value: ManualAssetValue[T],
  ) => void;
  onCancelEdit: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  requestState: ManualRequestState;
}) {
  const isSubmitting = requestState === "submitting";
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [asset.id]);

  return (
    <form
      aria-label={`Edit ${asset.name || "asset"}`}
      className="space-y-4"
      onSubmit={onSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TextValueField
          inputRef={firstFieldRef}
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

      <PortfolioEditError errorMessage={errorMessage} />

      <div className="flex flex-col gap-3 border-t border-stone-200 pt-4 sm:flex-row">
        <button
          className="rounded-lg border border-seed-700 bg-seed-700 px-4 py-2 text-sm font-semibold text-white hover:bg-seed-800 focus:outline-none focus:ring-2 focus:ring-seed-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving asset" : "Save asset"}
        </button>
        <button
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-earth-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-seed-500"
          onClick={onCancelEdit}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PortfolioSnapshotDebtEditForm({
  debt,
  errorMessage,
  onCancelEdit,
  onDebtUpdate,
  onSubmit,
  requestState,
}: {
  debt: ManualDebtValue;
  errorMessage: string;
  onCancelEdit: () => void;
  onDebtUpdate: <T extends keyof ManualDebtValue>(
    id: string,
    field: T,
    value: ManualDebtValue[T],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  requestState: ManualRequestState;
}) {
  const isSubmitting = requestState === "submitting";
  const requiresName = isPositiveDecimal(debt.balance);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [debt.id]);

  return (
    <form
      aria-label={`Edit ${debt.name || "liability"}`}
      className="space-y-4"
      onSubmit={onSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TextValueField
          inputRef={firstFieldRef}
          requirement={requiresName ? "required" : "conditional"}
          label="Liability name"
          onChange={(event) =>
            onDebtUpdate(debt.id, "name", event.target.value)
          }
          required={requiresName}
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
            onDebtUpdate(debt.id, "annualInterestRate", event.target.value)
          }
          required
          value={debt.annualInterestRate}
        />
        <NumberValueField
          label="Monthly payment"
          onChange={(event) =>
            onDebtUpdate(debt.id, "monthlyPayment", event.target.value)
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

      <PortfolioEditError errorMessage={errorMessage} />

      <div className="flex flex-col gap-3 border-t border-stone-200 pt-4 sm:flex-row">
        <button
          className="rounded-lg border border-seed-700 bg-seed-700 px-4 py-2 text-sm font-semibold text-white hover:bg-seed-800 focus:outline-none focus:ring-2 focus:ring-seed-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving liability" : "Save liability"}
        </button>
        <button
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-earth-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-seed-500"
          onClick={onCancelEdit}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function PortfolioEditError({ errorMessage }: { errorMessage: string }) {
  if (!errorMessage) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-950"
      role="alert"
    >
      {errorMessage}
    </div>
  );
}

function TextValueField({
  inputRef,
  label,
  onChange,
  requirement,
  required = false,
  value,
}: {
  inputRef?: Ref<HTMLInputElement>;
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
        ref={inputRef}
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
      <FieldLabel
        label={label}
        requirement={resolvedRequirement}
        unitLabel={accessibleUnitLabel(prefix)}
      />
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

function accessibleUnitLabel(prefix?: string) {
  return prefix === "$" ? "dollars" : undefined;
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
  unitLabel,
}: {
  label: string;
  requirement: ManualProfileFieldRequirement | "conditional";
  unitLabel?: string;
}) {
  const isRequired = requirement === "required";
  const isConditional = requirement === "conditional";

  return (
    <span className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-sm font-medium text-earth-800">
        {label}
        {unitLabel ? <span className="sr-only">, {unitLabel}</span> : null}
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

export function createManualRowId(prefix: "asset" | "debt" | "goal") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isPositiveDecimal(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}
