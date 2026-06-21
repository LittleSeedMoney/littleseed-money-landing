import {
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import type {
  DecisionReadiness,
  EvidenceSource,
  PortfolioNote,
  ReportReviewSample,
  SnapshotItem,
  SummaryMetric,
} from "@/data/report-review-sample";
import type {
  ManualAssetValue,
  ManualDebtValue,
  ManualProfileScalarField,
  ManualProfileValues,
} from "@/lib/report-review/manual-profile";

import {
  EducationTopicLink,
  ProvenanceTag,
  reviewDisclosureClass,
  reviewDisclosureSummaryClass,
  reviewInlineDisclosureSummaryClass,
  reviewPanelClass,
  reviewSubtlePanelClass,
  StatusPill,
} from "./shared";
import {
  PortfolioSnapshotAssetEditForm,
  PortfolioSnapshotDebtEditForm,
  type ManualRequestState,
  type PortfolioEditTarget,
} from "./manual-input-section";
import { PortfolioSnapshotList } from "./portfolio-snapshot-list";

export function AssetPortfolioSection({
  activePortfolioEdit,
  activeProfileField,
  decisionReadiness,
  errorMessage,
  onAddAsset,
  onAddDebt,
  onAssetEdit,
  onAssetUpdate,
  onCancelEdit,
  onDebtEdit,
  onDebtUpdate,
  onProfileFieldEdit,
  onProfileSubmit,
  onProfileUpdate,
  onPortfolioSubmit,
  portfolio,
  requestState,
  sourceById,
  statusLabel,
  values,
}: {
  activePortfolioEdit: PortfolioEditTarget | null;
  activeProfileField: ManualProfileScalarField | null;
  decisionReadiness: DecisionReadiness;
  errorMessage: string;
  onAddAsset: () => void;
  onAddDebt: () => void;
  onAssetEdit: (id: string) => void;
  onAssetUpdate: <T extends keyof ManualAssetValue>(
    id: string,
    field: T,
    value: ManualAssetValue[T],
  ) => void;
  onCancelEdit: () => void;
  onDebtEdit: (id: string) => void;
  onDebtUpdate: <T extends keyof ManualDebtValue>(
    id: string,
    field: T,
    value: ManualDebtValue[T],
  ) => void;
  onProfileFieldEdit: (field: ManualProfileScalarField) => void;
  onProfileSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onProfileUpdate: (
    field: ManualProfileScalarField,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onPortfolioSubmit: (event: FormEvent<HTMLFormElement>) => void;
  portfolio: ReportReviewSample["assetPortfolio"];
  requestState: ManualRequestState;
  sourceById: ReadonlyMap<string, EvidenceSource>;
  statusLabel: string;
  values: ManualProfileValues;
}) {
  const assetItems = manualAssetSnapshotItems(values.assets, portfolio.assets);
  const liabilityItems = manualDebtSnapshotItems(
    values.debts,
    portfolio.liabilities,
  );
  const manualAssetIds = new Set(values.assets.map((asset) => asset.id));
  const manualDebtIds = new Set(values.debts.map((debt) => debt.id));

  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-heading"
      className="scroll-mt-28 space-y-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-seed-700">
            Workspace snapshot
          </p>
          <h2
            className="mt-1 text-2xl font-semibold tracking-normal text-seed-950"
            id="portfolio-heading"
          >
            Current portfolio snapshot
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-earth-700">
            The report interprets the current assets, liabilities, liquidity,
            and decision-slice readiness from this in-session snapshot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill label={statusLabel} tone="stone" />
        </div>
      </div>

      <div className={reviewPanelClass("p-4")}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {portfolio.totals.map((metric) => (
            <PortfolioMetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        <div className="mt-4 space-y-4">
          <ProfileSnapshotCard
            activeField={activeProfileField}
            errorMessage={errorMessage}
            onCancelEdit={onCancelEdit}
            onFieldEdit={onProfileFieldEdit}
            onSubmit={onProfileSubmit}
            onUpdate={onProfileUpdate}
            requestState={requestState}
            values={values}
          />

          <PortfolioSnapshotList
            action={
              <button
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-earth-800 shadow-sm hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-seed-500"
                onClick={onAddAsset}
                type="button"
              >
                Add asset
              </button>
            }
            activeItemId={
              activePortfolioEdit?.group === "assets"
                ? activePortfolioEdit.id
                : null
            }
            description="Current asset balances grouped by liquidity."
            descriptionId="assets-snapshot-description"
            items={assetItems}
            renderItemAction={(item) =>
              manualAssetIds.has(item.id) ? (
                <EditIconButton
                  label={`Edit ${item.name}`}
                  onClick={() => onAssetEdit(item.id)}
                />
              ) : null
            }
            renderItemEditor={(item) => {
              const asset = values.assets.find(
                (candidate) => candidate.id === item.id,
              );

              if (!asset) {
                return null;
              }

              return (
                <PortfolioSnapshotAssetEditForm
                  asset={asset}
                  errorMessage={errorMessage}
                  onAssetUpdate={onAssetUpdate}
                  onCancelEdit={onCancelEdit}
                  onSubmit={onPortfolioSubmit}
                  requestState={requestState}
                />
              );
            }}
            title="Assets"
          />

          <PortfolioSnapshotList
            action={
              <button
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-earth-800 shadow-sm hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-seed-500"
                onClick={onAddDebt}
                type="button"
              >
                Add liability
              </button>
            }
            activeItemId={
              activePortfolioEdit?.group === "liabilities"
                ? activePortfolioEdit.id
                : null
            }
            description="Current debt balances grouped by obligation type."
            descriptionId="liabilities-snapshot-description"
            items={liabilityItems}
            renderItemAction={(item) =>
              manualDebtIds.has(item.id) ? (
                <EditIconButton
                  label={`Edit ${item.name}`}
                  onClick={() => onDebtEdit(item.id)}
                />
              ) : null
            }
            renderItemEditor={(item) => {
              const debt = values.debts.find(
                (candidate) => candidate.id === item.id,
              );

              if (!debt) {
                return null;
              }

              return (
                <PortfolioSnapshotDebtEditForm
                  debt={debt}
                  errorMessage={errorMessage}
                  onCancelEdit={onCancelEdit}
                  onDebtUpdate={onDebtUpdate}
                  onSubmit={onPortfolioSubmit}
                  requestState={requestState}
                />
              );
            }}
            title="Liabilities"
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {portfolio.notes.map((note) => (
            <PortfolioNoteCard key={note.id} note={note} />
          ))}
        </div>
      </div>

      <DecisionReadinessCard
        decisionReadiness={decisionReadiness}
        sourceById={sourceById}
      />
    </section>
  );
}

function ProfileSnapshotCard({
  activeField,
  errorMessage,
  onCancelEdit,
  onFieldEdit,
  onSubmit,
  onUpdate,
  requestState,
  values,
}: {
  activeField: ManualProfileScalarField | null;
  errorMessage: string;
  onCancelEdit: () => void;
  onFieldEdit: (field: ManualProfileScalarField) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (
    field: ManualProfileScalarField,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  requestState: "error" | "idle" | "submitting";
  values: ManualProfileValues;
}) {
  const isEditing = activeField !== null;
  const isSubmitting = requestState === "submitting";

  return (
    <form
      aria-labelledby="profile-values-heading"
      className={reviewSubtlePanelClass("min-w-0 p-3")}
      onSubmit={onSubmit}
    >
      <GroupHeader
        action={
          isEditing ? (
            <>
              <button
                className="min-h-10 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-earth-800 shadow-sm hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-seed-500"
                onClick={onCancelEdit}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-h-10 rounded-lg border border-seed-700 bg-seed-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-seed-800 focus:outline-none focus:ring-2 focus:ring-seed-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Saving profile" : "Save profile"}
              </button>
            </>
          ) : null
        }
        description="Age, income, expenses, job stability, and target context."
        headingId="profile-values-heading"
        statusLabel={isEditing ? "Editing" : "Profile"}
        title="Profile values"
      />
      <dl className="mt-3 grid gap-x-6 gap-y-4 rounded-md border border-stone-200 bg-white p-3 sm:grid-cols-2 xl:grid-cols-4">
        {profileSummaryItems(values).map((item) => (
          <div className="min-h-16 min-w-0" key={item.field}>
            <dt className="flex min-h-6 items-center gap-1.5 text-xs font-medium text-earth-600">
              <span>{item.label}</span>
              <EditIconButton
                isCompact
                label={`Edit ${item.label}`}
                onClick={() => onFieldEdit(item.field)}
              />
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-seed-950">
              {activeField === item.field ? (
                <ProfileFieldControl
                  item={item}
                  onUpdate={onUpdate}
                  values={values}
                />
              ) : (
                <ProfileDisplayValue item={item} />
              )}
            </dd>
          </div>
        ))}
      </dl>
      {isEditing && errorMessage ? (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-950"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}
    </form>
  );
}

function GroupHeader({
  action,
  description,
  headingId,
  statusLabel,
  title,
}: {
  action: ReactNode;
  description: string;
  headingId: string;
  statusLabel: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-seed-950" id={headingId}>
          {title}
        </h3>
        <p className="mt-0.5 text-sm leading-6 text-earth-700">
          {description}
        </p>
      </div>
      <div className="flex min-h-10 items-center gap-2">
        <StatusPill label={statusLabel} tone="stone" />
        {action}
      </div>
    </div>
  );
}

function EditIconButton({
  isCompact = false,
  label,
  onClick,
}: {
  isCompact?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={
        isCompact
          ? "inline-flex h-5 w-5 items-center justify-center rounded-sm text-earth-500 hover:bg-stone-100 hover:text-seed-800 focus:outline-none focus:ring-2 focus:ring-seed-500"
          : "inline-flex h-8 w-8 items-center justify-center rounded-md text-earth-700 hover:bg-stone-100 hover:text-seed-800 focus:outline-none focus:ring-2 focus:ring-seed-500"
      }
      onClick={onClick}
      title={label}
      type="button"
    >
      <PencilIcon className={isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </button>
  );
}

function manualAssetSnapshotItems(
  assets: ManualAssetValue[],
  reportAssets: SnapshotItem[],
): SnapshotItem[] {
  const seenIds = new Set<string>();

  const manualItems = assets.map((asset) => {
    const reportItem = reportAssetForManualAsset(asset, reportAssets, seenIds);

    if (reportItem) {
      seenIds.add(reportItem.id);
    }

    return manualAssetSnapshotItem(asset, reportItem);
  });

  return [
    ...manualItems,
    ...reportAssets.filter((item) =>
      shouldKeepUnmatchedReportItem(item, seenIds, assets.length),
    ),
  ];
}

function manualDebtSnapshotItems(
  debts: ManualDebtValue[],
  reportLiabilities: SnapshotItem[],
): SnapshotItem[] {
  const seenIds = new Set<string>();

  const manualItems = debts.map((debt) => {
    const reportItem = reportLiabilityForManualDebt(
      debt,
      reportLiabilities,
      seenIds,
    );

    if (reportItem) {
      seenIds.add(reportItem.id);
    }

    return manualDebtSnapshotItem(debt, reportItem);
  });

  return [
    ...manualItems,
    ...reportLiabilities.filter((item) =>
      shouldKeepUnmatchedReportItem(item, seenIds, debts.length),
    ),
  ];
}

function reportAssetForManualAsset(
  asset: ManualAssetValue,
  reportAssets: SnapshotItem[],
  seenIds: ReadonlySet<string>,
) {
  return (
    reportAssets.find(
      (item) => !seenIds.has(item.id) && item.id === asset.id,
    ) ??
    reportAssets.find(
      (item) =>
        !seenIds.has(item.id) &&
        isManualLikeReportItem(item) &&
        normalizeSnapshotText(item.category) ===
          normalizeSnapshotText(assetCategoryLabel(asset.category)),
    )
  );
}

function reportLiabilityForManualDebt(
  debt: ManualDebtValue,
  reportLiabilities: SnapshotItem[],
  seenIds: ReadonlySet<string>,
) {
  return (
    reportLiabilities.find(
      (item) => !seenIds.has(item.id) && item.id === debt.id,
    ) ??
    reportLiabilities.find(
      (item) =>
        !seenIds.has(item.id) &&
        isManualLikeReportItem(item) &&
        normalizeSnapshotText(item.name) === normalizeSnapshotText(debt.name),
    )
  );
}

function shouldKeepUnmatchedReportItem(
  item: SnapshotItem,
  seenIds: ReadonlySet<string>,
  manualItemCount: number,
) {
  if (seenIds.has(item.id)) {
    return false;
  }

  return manualItemCount === 0 || isExternalReportItem(item);
}

function isManualLikeReportItem(item: SnapshotItem) {
  return !isExternalReportItem(item);
}

function isExternalReportItem(item: SnapshotItem) {
  return (
    item.provenance === "csv-imported" ||
    item.provenance === "linked-account"
  );
}

function normalizeSnapshotText(value: string) {
  return value.trim().toLowerCase().replace(/[_\s-]+/g, " ");
}

function manualAssetSnapshotItem(
  asset: ManualAssetValue,
  reportItem?: SnapshotItem,
): SnapshotItem {
  return {
    category: assetCategoryLabel(asset.category),
    emergencyEligible: reportItem?.emergencyEligible ?? asset.category === "cash",
    id: asset.id,
    liquidity: reportItem?.liquidity ?? assetLiquidityLabel(asset.category),
    name: asset.name || "Unnamed asset",
    provenance: reportItem?.provenance ?? "user-entered",
    value: displayMoneyValue(asset.balance),
  };
}

function manualDebtSnapshotItem(
  debt: ManualDebtValue,
  reportItem?: SnapshotItem,
): SnapshotItem {
  return {
    category: debtTypeLabel(debt.debtType),
    emergencyEligible: false,
    id: debt.id,
    liquidity: reportItem?.liquidity ?? "debt",
    name: debt.name || "Unnamed liability",
    provenance: reportItem?.provenance ?? "user-entered",
    value: displayMoneyValue(debt.balance),
  };
}

function assetCategoryLabel(category: ManualAssetValue["category"]) {
  const labels: Record<ManualAssetValue["category"], string> = {
    brokerage: "Brokerage",
    cash: "Cash",
    other: "Other",
    retirement: "Retirement",
  };

  return labels[category];
}

function assetLiquidityLabel(category: ManualAssetValue["category"]) {
  if (category === "cash") {
    return "cash";
  }

  if (category === "retirement") {
    return "restricted";
  }

  return "invested";
}

function debtTypeLabel(debtType: ManualDebtValue["debtType"]) {
  const labels: Record<ManualDebtValue["debtType"], string> = {
    auto_loan: "Auto loan",
    credit_card: "Credit card",
    medical_debt: "Medical debt",
    other: "Other",
    personal_loan: "Personal loan",
    student_loan: "Student loan",
  };

  return labels[debtType];
}

function profileSummaryItems(values: ManualProfileValues) {
  return [
    {
      field: "age",
      label: "Age",
      required: true,
      step: "1",
      type: "number",
      value: displayValue(values.age),
    },
    {
      field: "monthlyTakeHomeIncome",
      label: "Monthly take-home income",
      prefix: "$",
      required: true,
      type: "number",
      value: displayMoneyValue(values.monthlyTakeHomeIncome),
    },
    {
      field: "monthlyHousingCost",
      label: "Monthly housing cost",
      prefix: "$",
      required: true,
      type: "number",
      value: displayMoneyValue(values.monthlyHousingCost),
    },
    {
      field: "monthlyNonHousingEssentialExpenses",
      label: "Other monthly essentials",
      prefix: "$",
      required: true,
      type: "number",
      value: displayMoneyValue(values.monthlyNonHousingEssentialExpenses),
    },
    {
      field: "monthlyDiscretionaryExpenses",
      label: "Monthly discretionary expenses",
      prefix: "$",
      required: true,
      type: "number",
      value: displayMoneyValue(values.monthlyDiscretionaryExpenses),
    },
    {
      field: "monthlyInvestmentContribution",
      label: "Monthly investing contribution",
      prefix: "$",
      required: true,
      type: "number",
      value: displayMoneyValue(values.monthlyInvestmentContribution),
    },
    {
      field: "incomePattern",
      label: "Income pattern",
      options: [
        ["mostly_stable", "Mostly stable"],
        ["variable", "Variable"],
        ["seasonal", "Seasonal"],
        ["irregular", "Irregular"],
      ],
      required: true,
      type: "select",
      value: displayMappedValue(values.incomePattern, {
        irregular: "Irregular",
        mostly_stable: "Mostly stable",
        seasonal: "Seasonal",
        variable: "Variable",
      }),
    },
    {
      field: "jobStability",
      label: "Job stability",
      options: [
        ["high", "High"],
        ["medium", "Medium"],
        ["low", "Low"],
      ],
      required: true,
      type: "select",
      value: displayMappedValue(values.jobStability, {
        high: "High",
        low: "Low",
        medium: "Medium",
      }),
    },
    {
      field: "riskTolerance",
      label: "Risk tolerance",
      options: [
        ["medium", "Medium"],
        ["low", "Low"],
        ["high", "High"],
      ],
      required: true,
      type: "select",
      value: displayMappedValue(values.riskTolerance, {
        high: "High",
        low: "Low",
        medium: "Medium",
      }),
    },
    {
      field: "expectedYearsInCurrentLocation",
      label: "Expected years in current location",
      required: true,
      step: "1",
      type: "number",
      value: values.expectedYearsInCurrentLocation
        ? `${values.expectedYearsInCurrentLocation} years`
        : "Missing",
    },
    {
      field: "userTargetMonths",
      label: "Emergency target",
      step: "0.01",
      type: "number",
      value: values.userTargetMonths
        ? `${values.userTargetMonths} months`
        : "Missing",
    },
  ] satisfies ProfileSummaryItem[];
}

type ProfileSummaryItem = {
  field: ManualProfileScalarField;
  label: string;
  options?: ReadonlyArray<readonly [string, string]>;
  prefix?: string;
  required?: boolean;
  step?: string;
  type: "number" | "select";
  value: string;
};

function ProfileDisplayValue({ item }: { item: ProfileSummaryItem }) {
  if (!item.prefix || !item.value.startsWith(item.prefix)) {
    return item.value;
  }

  return (
    <>
      <span className="text-seed-950">{item.prefix}</span>
      {item.value.slice(item.prefix.length)}
    </>
  );
}

function ProfileFieldControl({
  item,
  onUpdate,
  values,
}: {
  item: ProfileSummaryItem;
  onUpdate: (
    field: ManualProfileScalarField,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  values: ManualProfileValues;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (item.type === "select") {
      selectRef.current?.focus();
      return;
    }

    inputRef.current?.focus();
  }, [item.field, item.type]);

  if (item.type === "select") {
    return (
      <select
        aria-label={item.label}
        className="min-h-9 w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-sm font-semibold text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200"
        onChange={(event) => onUpdate(item.field, event)}
        ref={selectRef}
        required={item.required}
        value={values[item.field]}
      >
        {(item.options ?? []).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    );
  }

  return (
    <span className="relative block">
      {item.prefix ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-seed-950"
        >
          {item.prefix}
        </span>
      ) : null}
      <input
        aria-label={item.label}
        className={`min-h-9 w-full rounded-md border border-stone-300 bg-white py-1 pr-2 text-sm font-semibold tabular-nums text-seed-950 shadow-sm outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-200 ${
          item.prefix ? "pl-6" : "pl-2"
        }`}
        inputMode="decimal"
        min="0"
        onChange={(event) => onUpdate(item.field, event)}
        ref={inputRef}
        required={item.required}
        step={item.step ?? "0.01"}
        type="number"
        value={values[item.field]}
      />
    </span>
  );
}

function displayMappedValue(value: string, labels: Record<string, string>) {
  if (!value) {
    return "Missing";
  }

  return labels[value] ?? value;
}

function displayMoneyValue(value: string) {
  if (!value) {
    return "Missing";
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: parsed % 1 === 0 ? 0 : 2,
    style: "currency",
  }).format(parsed);
}

function displayValue(value: string) {
  return value || "Missing";
}

function PencilIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L7 21H3v-4L16.5 3.5Z" />
    </svg>
  );
}

function PortfolioMetricCard({ metric }: { metric: SummaryMetric }) {
  return (
    <article className={reviewSubtlePanelClass("p-3")}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-earth-700">{metric.label}</h3>
        <ProvenanceTag provenance={metric.provenance} />
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums text-seed-950">
        {metric.value}
      </p>
      <p className="mt-1 text-sm leading-6 text-earth-700">{metric.detail}</p>
    </article>
  );
}

function PortfolioNoteCard({ note }: { note: PortfolioNote }) {
  return (
    <details className={reviewSubtlePanelClass("p-3")}>
      <summary className={reviewDisclosureSummaryClass()}>
        {note.title}
      </summary>
      <p className="mt-1 text-sm leading-6 text-earth-700">{note.body}</p>
    </details>
  );
}

function DecisionReadinessCard({
  decisionReadiness,
  sourceById,
}: {
  decisionReadiness: DecisionReadiness;
  sourceById: ReadonlyMap<string, EvidenceSource>;
}) {
  return (
    <article className={reviewPanelClass("p-5")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-seed-700">
            First decision slice
          </p>
          <h3 className="mt-1 text-lg font-semibold text-seed-950">
            {decisionReadiness.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-earth-700">
            {decisionReadiness.explanation}
          </p>
        </div>
        <StatusPill label={decisionReadiness.status} tone="stone" />
      </div>

      {decisionReadiness.resultMetrics.length > 0 ? (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <h4 className="text-sm font-semibold text-seed-950">
            Decision output
          </h4>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            {decisionReadiness.resultMetrics.map((metric) => (
              <div key={metric.id} className="min-w-0">
                <dt className="text-sm font-medium text-earth-700">
                  {metric.label}
                </dt>
                <dd className="mt-1">
                  <span className="block break-words font-semibold tabular-nums text-seed-950">
                    {metric.value}
                  </span>
                  <span className="mt-2 inline-flex">
                    <ProvenanceTag provenance={metric.provenance} />
                  </span>
                  {metric.detail ? (
                    <details className="mt-2">
                      <summary className={reviewInlineDisclosureSummaryClass()}>
                        Detail
                      </summary>
                      <p className="mt-2 text-sm leading-6 text-earth-700">
                        {metric.detail}
                      </p>
                    </details>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {decisionReadiness.userSelectedTarget ? (
        <UserSelectedTargetSummary target={decisionReadiness.userSelectedTarget} />
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-seed-950">
            Available inputs
          </h4>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {decisionReadiness.availableInputs.map((input) => (
              <div
                key={input.id}
                className={reviewSubtlePanelClass("p-3")}
              >
                <dt className="text-sm font-medium text-earth-700">
                  {input.label}
                </dt>
                <dd className="mt-2 flex flex-col gap-2">
                  <span className="font-semibold tabular-nums text-seed-950">
                    {input.value}
                  </span>
                  <ProvenanceTag provenance={input.provenance} />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <details className={reviewDisclosureClass("p-3")}>
          <summary className={reviewDisclosureSummaryClass()}>
            Missing optional context
          </summary>
          <ul className="mt-3 space-y-3">
            {decisionReadiness.missingInputs.map((input) => (
              <li
                key={input.id}
                className={reviewPanelClass("p-3 shadow-none")}
              >
                <p className="text-sm font-medium text-seed-950">
                  {input.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-earth-700">
                  {input.whyItMatters}
                </p>
              </li>
            ))}
          </ul>
        </details>
      </div>

      {decisionReadiness.educationTopics.length > 0 ? (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <h4 className="text-sm font-semibold text-seed-950">
            Related education
          </h4>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {decisionReadiness.educationTopics.map((id) => (
              <li key={id}>
                <EducationTopicLink id={id} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {decisionReadiness.assumptions.length > 0 ? (
        <details className="mt-5 border-t border-stone-200 pt-4">
          <summary className={reviewDisclosureSummaryClass()}>
            Assumptions
          </summary>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
            {decisionReadiness.assumptions.map((assumption, index) => (
              <li key={`${assumption}-${index}`}>{assumption}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <DecisionTrace
        decisionReadiness={decisionReadiness}
        sourceById={sourceById}
      />

      <details className="mt-5 border-t border-stone-200 pt-4">
        <summary className={reviewDisclosureSummaryClass()}>
          Limits
        </summary>
        <ul className="mt-2 space-y-2 text-sm leading-6 text-earth-700">
          {decisionReadiness.limitations.map((limitation, index) => (
            <li key={`${limitation}-${index}`}>{limitation}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function UserSelectedTargetSummary({
  target,
}: {
  target: NonNullable<DecisionReadiness["userSelectedTarget"]>;
}) {
  return (
    <div className="mt-5 border-t border-stone-200 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-seed-950">
            User-selected target comparison
          </h4>
          <details className="mt-2">
            <summary className={reviewInlineDisclosureSummaryClass()}>
              Alignment detail
            </summary>
            <p className="mt-2 text-sm leading-6 text-earth-700">
              {target.alignmentDetail}
            </p>
          </details>
        </div>
        <StatusPill label={target.alignmentLabel} tone="stone" />
      </div>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-sm font-medium text-earth-700">
            Preference months
          </dt>
          <dd className="mt-1 font-semibold tabular-nums text-seed-950">
            {target.targetMonths}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-earth-700">Target amount</dt>
          <dd className="mt-1 font-semibold tabular-nums text-seed-950">
            {target.targetAmount}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-earth-700">Remaining gap</dt>
          <dd className="mt-1 font-semibold tabular-nums text-seed-950">
            {target.gapAmount}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function DecisionTrace({
  decisionReadiness,
  sourceById,
}: {
  decisionReadiness: DecisionReadiness;
  sourceById: ReadonlyMap<string, EvidenceSource>;
}) {
  return (
    <details className="mt-5 border-t border-stone-200 pt-4">
      <summary className={reviewDisclosureSummaryClass()}>
        Evidence and rule trace
      </summary>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-earth-700">Model version</dt>
          <dd className="mt-1 break-words font-semibold text-seed-950">
            {decisionReadiness.modelVersion}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-earth-700">Guidance registry</dt>
          <dd className="mt-1 break-words font-semibold text-seed-950">
            {decisionReadiness.guidanceRuleVersion}
          </dd>
        </div>
      </dl>

      {decisionReadiness.guidanceRules.length > 0 ? (
        <div className="mt-4">
          <h5 className="text-sm font-semibold text-seed-950">
            Matched guidance rules
          </h5>
          <ul className="mt-2 space-y-3">
            {decisionReadiness.guidanceRules.map((rule) => (
              <li
                key={rule.id}
                className={reviewSubtlePanelClass("p-3 text-sm")}
              >
                <p className="font-medium leading-6 text-seed-950">
                  {rule.allowedPhrasing}
                </p>
                <dl className="mt-2 grid gap-2 text-earth-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-earth-800">Rule</dt>
                    <dd className="break-words">{rule.id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-earth-800">Trigger</dt>
                    <dd className="break-words">{rule.trigger}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-earth-800">Version</dt>
                    <dd className="break-words">{rule.ruleVersion}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-earth-800">Required context</dt>
                    <dd className="break-words">
                      {rule.requiredGuards.join(", ")}
                    </dd>
                  </div>
                </dl>
                <div className="mt-2 flex flex-wrap gap-2">
                  {rule.evidenceSourceIds.map((id) => {
                    const source = sourceById.get(id);

                    return (
                      <span
                        key={id}
                        className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-earth-700"
                      >
                        {source?.publisher ?? id}
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-earth-700">
          No guidance rule matched this decision result, so no approved
          next-step phrasing is active for this snapshot.
        </p>
      )}

      {decisionReadiness.evidenceSourceIds.length > 0 ? (
        <ul className="mt-3 space-y-3 text-sm leading-6">
          {decisionReadiness.evidenceSourceIds.map((id) => {
            const source = sourceById.get(id);

            return (
              <li key={id}>
                {source ? (
                  <>
                    <a
                      className="font-medium text-seed-800 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-seed-500"
                      href={source.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {source.title}
                    </a>
                    <p className="text-earth-700">
                      {source.publisher}. {source.supports}
                    </p>
                  </>
                ) : (
                  <p className="font-medium text-earth-700">{id}</p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-earth-700">
          No evidence source IDs were returned for this decision result.
        </p>
      )}
    </details>
  );
}
