import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
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
import type {
  ChargeInspectorCategoryMonthlySummary,
  ChargeInspectorReview,
} from "@/lib/report-review/charge-inspector";

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
  chargeInspector,
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
  chargeInspector: ChargeInspectorReview;
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
  const [activeSnapshotTab, setActiveSnapshotTab] =
    useState<SnapshotTabId>("overview");
  const monthlyTrendRows = monthlyFinancialTrendRows(chargeInspector, values);
  const latestSnapshotMonth =
    monthlyTrendRows[monthlyTrendRows.length - 1]?.month ?? "";
  const [selectedSnapshotMonth, setSelectedSnapshotMonth] =
    useState(latestSnapshotMonth);
  const assetItems = manualAssetSnapshotItems(values.assets, portfolio.assets);
  const liabilityItems = manualDebtSnapshotItems(
    values.debts,
    portfolio.liabilities,
  );
  const manualAssetIds = new Set(values.assets.map((asset) => asset.id));
  const manualDebtIds = new Set(values.debts.map((debt) => debt.id));

  useEffect(() => {
    if (
      latestSnapshotMonth &&
      !monthlyTrendRows.some((row) => row.month === selectedSnapshotMonth)
    ) {
      setSelectedSnapshotMonth(latestSnapshotMonth);
    }
  }, [latestSnapshotMonth, monthlyTrendRows, selectedSnapshotMonth]);

  function selectSnapshotMonth(month: string) {
    setSelectedSnapshotMonth(month);
    setActiveSnapshotTab("monthly");
  }

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
        <SnapshotTrendPanel
          onMonthSelect={selectSnapshotMonth}
          rows={monthlyTrendRows}
          selectedMonth={selectedSnapshotMonth}
          values={values}
        />

        <SnapshotTabs
          activeTab={activeSnapshotTab}
          onTabChange={setActiveSnapshotTab}
        />

        {activeSnapshotTab === "overview" ? (
          <SnapshotOverviewTab
            activeField={activeProfileField}
            activePortfolioEdit={activePortfolioEdit}
            assetItems={assetItems}
            errorMessage={errorMessage}
            liabilityItems={liabilityItems}
            manualAssetIds={manualAssetIds}
            manualDebtIds={manualDebtIds}
            onAddAsset={onAddAsset}
            onAddDebt={onAddDebt}
            onAssetEdit={onAssetEdit}
            onAssetUpdate={onAssetUpdate}
            onCancelEdit={onCancelEdit}
            onDebtEdit={onDebtEdit}
            onDebtUpdate={onDebtUpdate}
            onFieldEdit={onProfileFieldEdit}
            onPortfolioSubmit={onPortfolioSubmit}
            onProfileSubmit={onProfileSubmit}
            onProfileUpdate={onProfileUpdate}
            portfolio={portfolio}
            requestState={requestState}
            values={values}
          />
        ) : null}

        {activeSnapshotTab === "monthly" ? (
          <SnapshotMonthlyTab
            chargeInspector={chargeInspector}
            selectedMonth={selectedSnapshotMonth}
            values={values}
          />
        ) : null}
      </div>

      <DecisionReadinessCard
        decisionReadiness={decisionReadiness}
        sourceById={sourceById}
      />
    </section>
  );
}

type SnapshotTabId = "overview" | "monthly";

const SNAPSHOT_TABS: { id: SnapshotTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "monthly", label: "Monthly" },
];

function SnapshotTrendPanel({
  onMonthSelect,
  rows,
  selectedMonth,
  values,
}: {
  onMonthSelect: (month: string) => void;
  rows: ReturnType<typeof monthlyFinancialTrendRows>;
  selectedMonth: string;
  values: ManualProfileValues;
}) {
  const latestMonth = rows[rows.length - 1] ?? null;
  const flowMaxAmount = Math.max(
    1,
    ...rows.flatMap((row) => [row.incomeCents, row.expenseCents]),
  );
  const assetMaxAmount = Math.max(
    1,
    ...rows.map((row) => row.assetCents),
  );
  const assetBuckets = assetBucketSummary(values);

  return (
    <section
      aria-labelledby="snapshot-monthly-trend-heading"
      className={reviewSubtlePanelClass("p-3")}
      data-testid="snapshot-monthly-trend"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3
            className="text-sm font-semibold text-seed-950"
            id="snapshot-monthly-trend-heading"
          >
            Monthly trend
          </h3>
          <p className="mt-1 text-sm leading-6 text-earth-700">
            Income and expenses use posted-date month aggregates. Asset values
            use the current snapshot until historical asset snapshots are
            available.
          </p>
        </div>
        {latestMonth ? (
          <StatusPill label={`Latest ${latestMonth.month}`} tone="stone" />
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        <MixedMonthlyTrendChart
          assetMaxAmount={assetMaxAmount}
          flowMaxAmount={flowMaxAmount}
          onMonthSelect={onMonthSelect}
          rows={rows}
          selectedMonth={selectedMonth}
        />

        <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {assetBuckets.map((bucket) => (
            <div
              className="rounded-md border border-stone-200 bg-white p-3"
              key={bucket.label}
            >
              <dt className="text-xs font-semibold uppercase text-earth-600">
                {bucket.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-seed-950">
                {bucket.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function MixedMonthlyTrendChart({
  assetMaxAmount,
  flowMaxAmount,
  onMonthSelect,
  rows,
  selectedMonth,
}: {
  assetMaxAmount: number;
  flowMaxAmount: number;
  onMonthSelect: (month: string) => void;
  rows: ReturnType<typeof monthlyFinancialTrendRows>;
  selectedMonth: string;
}) {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const width = 1040;
  const height = 430;
  const padding = { bottom: 64, left: 86, right: 104, top: 34 };
  const availableChartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const compactMonthStep = 142;
  const chartWidth =
    rows.length > 1
      ? Math.min(availableChartWidth, compactMonthStep * (rows.length - 1))
      : Math.min(availableChartWidth, compactMonthStep);
  const chartStartX = padding.left + (availableChartWidth - chartWidth) / 2;
  const chartEndX = chartStartX + chartWidth;
  const pointInset = rows.length > 1 ? Math.min(54, chartWidth * 0.18) : 0;
  const pointStartX = chartStartX + pointInset;
  const pointEndX = chartEndX - pointInset;
  const pointWidth = Math.max(1, pointEndX - pointStartX);
  const monthStep = rows.length > 1 ? pointWidth / (rows.length - 1) : 0;
  const monthSlotWidth =
    rows.length > 1
      ? Math.min(compactMonthStep * 0.86, chartWidth / rows.length)
      : Math.min(180, chartWidth * 0.72);
  const barWidth = Math.max(22, Math.min(38, monthSlotWidth / 3.5));
  const yTicks = [1, 0.75, 0.5, 0.25, 0];
  const selectedIndex = rows.findIndex((row) => row.month === selectedMonth);
  const hoveredIndex = rows.findIndex((row) => row.month === hoveredMonth);
  const hoveredRow = hoveredIndex >= 0 ? rows[hoveredIndex] : null;

  function xForIndex(index: number) {
    if (rows.length === 1) {
      return chartStartX + chartWidth / 2;
    }

    return pointStartX + monthStep * index;
  }

  function yForFlowValue(value: number) {
    return (
      padding.top +
      chartHeight -
      (Math.max(0, value) / flowMaxAmount) * chartHeight
    );
  }

  function yForAssetValue(value: number) {
    return (
      padding.top +
      chartHeight -
      (Math.max(0, value) / assetMaxAmount) * chartHeight
    );
  }

  const assetPoints = rows
    .map((row, index) => `${xForIndex(index)},${yForAssetValue(row.assetCents)}`)
    .join(" ");
  const tooltipX =
    hoveredIndex >= 0
      ? Math.max(
          padding.left + 130,
          Math.min(width - padding.right - 130, xForIndex(hoveredIndex)),
        )
      : 0;
  const tooltipY =
    hoveredRow && hoveredIndex >= 0
      ? Math.max(
          padding.top + 12,
          Math.min(
            yForFlowValue(
              Math.max(hoveredRow.incomeCents, hoveredRow.expenseCents),
            ),
            yForAssetValue(hoveredRow.assetCents),
          ) - 76,
        )
      : 0;

  function handleMonthKeyDown(
    event: KeyboardEvent<SVGGElement>,
    month: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onMonthSelect(month);
    }
  }

  return (
    <div className="min-w-0">
      <figure>
        <svg
          aria-label="Monthly trend chart with income and expense bars plus asset line"
          className="h-auto w-full"
          data-testid="snapshot-monthly-mixed-chart"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <rect
            fill="#ffffff"
            height={height}
            rx="6"
            stroke="#e7e5e4"
            width={width}
            x="0"
            y="0"
          />
          {selectedIndex >= 0 ? (
            <rect
              fill="#f4f1ea"
              height={chartHeight}
              rx="6"
              stroke="#2f6f4e"
              strokeDasharray="4 4"
              width={monthSlotWidth}
              x={xForIndex(selectedIndex) - monthSlotWidth / 2}
              y={padding.top}
            />
          ) : null}
          {yTicks.map((tick) => {
            const flowValue = flowMaxAmount * tick;
            const assetValue = assetMaxAmount * tick;
            const y = yForFlowValue(flowValue);

            return (
              <g key={tick}>
                <line
                  stroke="#e7e5e4"
                  x1={chartStartX}
                  x2={chartEndX}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#78716c"
                  fontSize="11"
                  textAnchor="end"
                  x={padding.left - 10}
                  y={y + 4}
                >
                  {moneyFromCentsForSnapshot(flowValue)}
                </text>
                <text
                  fill="#57534e"
                  fontSize="11"
                  textAnchor="start"
                  x={chartEndX + 10}
                  y={y + 4}
                >
                  {moneyFromCentsForSnapshot(assetValue)}
                </text>
              </g>
            );
          })}
          <line
            stroke="#78716c"
            x1={chartStartX}
            x2={chartStartX}
            y1={padding.top}
            y2={height - padding.bottom}
          />
          <line
            stroke="#78716c"
            x1={chartEndX}
            x2={chartEndX}
            y1={padding.top}
            y2={height - padding.bottom}
          />
          <line
            stroke="#78716c"
            x1={chartStartX}
            x2={chartEndX}
            y1={height - padding.bottom}
            y2={height - padding.bottom}
          />
          <text
            fill="#57534e"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            transform={`rotate(-90 ${18} ${height / 2})`}
            x="18"
            y={height / 2}
          >
            Income / expenses
          </text>
          <text
            fill="#57534e"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            transform={`rotate(90 ${chartEndX + 70} ${height / 2})`}
            x={chartEndX + 70}
            y={height / 2}
          >
            Assets
          </text>
          {rows.map((row, index) => {
            const x = xForIndex(index);
            const incomeY = yForFlowValue(row.incomeCents);
            const expenseY = yForFlowValue(row.expenseCents);
            const baseline = height - padding.bottom;

            return (
              <g
                aria-label={`Show ${row.month} monthly data`}
                className="cursor-pointer outline-none"
                data-month={row.month}
                data-testid="snapshot-monthly-chart-month"
                key={row.month}
                onBlur={() => setHoveredMonth(null)}
                onClick={() => onMonthSelect(row.month)}
                onFocus={() => setHoveredMonth(row.month)}
                onKeyDown={(event) => handleMonthKeyDown(event, row.month)}
                onMouseEnter={() => setHoveredMonth(row.month)}
                onMouseLeave={() => setHoveredMonth(null)}
                role="button"
                tabIndex={0}
              >
                <title>
                  {`${row.month}: income ${row.incomeLabel}, expenses ${row.expenseLabel}, assets ${row.assetLabel}`}
                </title>
                <rect
                  fill="transparent"
                  height={chartHeight + 28}
                  width={monthSlotWidth}
                  x={x - monthSlotWidth / 2}
                  y={padding.top}
                />
                <rect
                  fill="#2f6f4e"
                  height={baseline - incomeY}
                  rx="3"
                  width={barWidth}
                  x={x - barWidth - 2}
                  y={incomeY}
                />
                <rect
                  fill="#9a5b32"
                  height={baseline - expenseY}
                  rx="3"
                  width={barWidth}
                  x={x + 2}
                  y={expenseY}
                />
                <text
                  fill={row.month === selectedMonth ? "#1f5138" : "#57534e"}
                  fontSize="11"
                  fontWeight={row.month === selectedMonth ? "700" : "600"}
                  textAnchor="middle"
                  x={x}
                  y={height - 16}
                >
                  {row.month}
                </text>
              </g>
            );
          })}
          <polyline
            fill="none"
            points={assetPoints}
            stroke="#27272a"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          {rows.map((row, index) => (
            <circle
              cx={xForIndex(index)}
              cy={yForAssetValue(row.assetCents)}
              fill="#ffffff"
              key={row.month}
              r={row.month === selectedMonth ? "6" : "4.5"}
              stroke={row.month === selectedMonth ? "#2f6f4e" : "#27272a"}
              strokeWidth={row.month === selectedMonth ? "3" : "2"}
            />
          ))}
          {hoveredRow ? (
            <g
              data-testid="snapshot-monthly-chart-hover-label"
              pointerEvents="none"
              transform={`translate(${tooltipX - 124} ${tooltipY})`}
            >
              <rect
                fill="#1c1917"
                height="66"
                opacity="0.92"
                rx="6"
                width="248"
              />
              <text fill="#ffffff" fontSize="12" fontWeight="700" x="12" y="19">
                {hoveredRow.month}
              </text>
              <text fill="#f5f5f4" fontSize="11" x="12" y="38">
                Income {hoveredRow.incomeLabel} / Expenses{" "}
                {hoveredRow.expenseLabel}
              </text>
              <text fill="#f5f5f4" fontSize="11" x="12" y="55">
                Assets {hoveredRow.assetLabel}
              </text>
            </g>
          ) : null}
        </svg>
        <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-earth-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-seed-700" />
            Income bar
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-earth-600" />
            Expense bar
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-stone-700" />
            Asset line
          </span>
        </figcaption>
      </figure>
    </div>
  );
}

function SnapshotTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: SnapshotTabId;
  onTabChange: (tab: SnapshotTabId) => void;
}) {
  return (
    <div
      aria-label="Snapshot views"
      className="mt-4 flex flex-wrap gap-2 border-b border-stone-200"
      role="tablist"
    >
      {SNAPSHOT_TABS.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            aria-selected={isActive}
            className={[
              "min-h-10 border-b-2 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-seed-500",
              isActive
                ? "border-seed-700 text-seed-950"
                : "border-transparent text-earth-700 hover:text-seed-900",
            ].join(" ")}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function SnapshotOverviewTab({
  activeField,
  activePortfolioEdit,
  assetItems,
  errorMessage,
  liabilityItems,
  manualAssetIds,
  manualDebtIds,
  onAddAsset,
  onAddDebt,
  onAssetEdit,
  onAssetUpdate,
  onCancelEdit,
  onDebtEdit,
  onDebtUpdate,
  onFieldEdit,
  onPortfolioSubmit,
  onProfileSubmit,
  onProfileUpdate,
  portfolio,
  requestState,
  values,
}: {
  activeField: ManualProfileScalarField | null;
  activePortfolioEdit: PortfolioEditTarget | null;
  assetItems: SnapshotItem[];
  errorMessage: string;
  liabilityItems: SnapshotItem[];
  manualAssetIds: ReadonlySet<string>;
  manualDebtIds: ReadonlySet<string>;
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
  onFieldEdit: (field: ManualProfileScalarField) => void;
  onPortfolioSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onProfileSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onProfileUpdate: (
    field: ManualProfileScalarField,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  portfolio: ReportReviewSample["assetPortfolio"];
  requestState: ManualRequestState;
  values: ManualProfileValues;
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className={reviewDisclosureClass("p-3")}>
        <h3 className="text-sm font-semibold text-seed-950">
          Current snapshot
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {portfolio.totals.map((metric) => (
            <PortfolioMetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        <div className="mt-4 space-y-4">
          <ProfileSnapshotCard
            activeField={activeField}
            errorMessage={errorMessage}
            onCancelEdit={onCancelEdit}
            onFieldEdit={onFieldEdit}
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
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {portfolio.notes.map((note) => (
          <PortfolioNoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}

function SnapshotMonthlyTab({
  chargeInspector,
  selectedMonth,
  values,
}: {
  chargeInspector: ChargeInspectorReview;
  selectedMonth: string;
  values: ManualProfileValues;
}) {
  const [savedTargetInputs, setSavedTargetInputs] = useState<
    Record<string, string>
  >({});
  const [draftTargetInputs, setDraftTargetInputs] = useState<
    Record<string, string>
  >({});
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [
    savedTransactionCategoryOverrides,
    setSavedTransactionCategoryOverrides,
  ] = useState<Record<string, string>>({});
  const [
    draftTransactionCategoryOverrides,
    setDraftTransactionCategoryOverrides,
  ] =
    useState<Record<string, string>>({});
  const months = [
    ...new Set(
      chargeInspector.categoryMonthlySummary.map((row) => row.month),
    ),
  ].sort();
  const latestMonth = months[months.length - 1] ?? "";
  const activeMonth = months.includes(selectedMonth) ? selectedMonth : latestMonth;
  const activeMonthIndex = months.indexOf(activeMonth);
  const previousMonth =
    activeMonthIndex > 0 ? (months[activeMonthIndex - 1] ?? "") : "";
  const currentRows = expenseRowsForMonth(
    chargeInspector.categoryMonthlySummary,
    activeMonth,
  );
  const previousRows = expenseRowsForMonth(
    chargeInspector.categoryMonthlySummary,
    previousMonth,
  );
  const previousByCategory = new Map(
    previousRows.map((row) => [row.category, row]),
  );
  const categories = categoryOptions(chargeInspector.categoryMonthlySummary);
  const trendRows = monthlyFinancialTrendRows(chargeInspector, values);
  const activeTrend =
    trendRows.find((row) => row.month === activeMonth) ??
    trendRows[trendRows.length - 1] ??
    null;
  const activeMonthLabel =
    activeMonth && activeMonth === latestMonth
      ? `Current month (${activeMonth})`
      : activeMonth
        ? `Selected month (${activeMonth})`
        : "Selected month";

  return (
    <section
      aria-labelledby="snapshot-monthly-heading"
      className="mt-4 space-y-4"
      data-testid="snapshot-monthly-tab"
    >
      <div>
        <h3
          className="text-sm font-semibold text-seed-950"
          id="snapshot-monthly-heading"
        >
          Monthly activity
        </h3>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-earth-700">
          Income, expenses, and current assets share this monthly workspace.
          Category targets start unset and stay in this browser session.
        </p>
      </div>

      {activeTrend ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <SnapshotMonthlyMetric
            label={`Income ${activeTrend.month}`}
            value={activeTrend.incomeLabel}
          />
          <SnapshotMonthlyMetric
            label={`Expenses ${activeTrend.month}`}
            value={activeTrend.expenseLabel}
          />
          <SnapshotMonthlyMetric
            label="Current assets"
            value={activeTrend.assetLabel}
          />
        </div>
      ) : null}

      <ExpenseMonthTable
        categories={categories}
        currentMonth={activeMonth}
        draftTargetInputs={draftTargetInputs}
        draftTransactionCategoryOverrides={draftTransactionCategoryOverrides}
        editingCategory={editingCategory}
        monthlySummaryRows={chargeInspector.categoryMonthlySummary}
        monthLabel={activeMonthLabel}
        onCategoryOverrideChange={(transactionId, category) =>
          setDraftTransactionCategoryOverrides((current) => ({
            ...current,
            [transactionId]: category,
          }))
        }
        onEditCategory={(category) => {
          setEditingCategory(category);
          if (category) {
            setDraftTargetInputs((current) => ({
              ...current,
              [category]: current[category] ?? savedTargetInputs[category] ?? "",
            }));
          }
        }}
        onSaveCategoryOverride={(transactionId) =>
          setSavedTransactionCategoryOverrides((current) => {
            const draftCategory =
              draftTransactionCategoryOverrides[transactionId];

            if (!draftCategory) {
              return current;
            }

            return {
              ...current,
              [transactionId]: draftCategory,
            };
          })
        }
        onSaveTarget={(category) => {
          const draftValue = draftTargetInputs[category] ?? "";

          setSavedTargetInputs((current) => {
            if (draftValue.trim().length === 0) {
              const { [category]: _removed, ...next } = current;
              return next;
            }

            return {
              ...current,
              [category]: draftValue,
            };
          });
          setEditingCategory(null);
        }}
        onTargetChange={(category, value) =>
          setDraftTargetInputs((current) => ({ ...current, [category]: value }))
        }
        previousByCategory={previousByCategory}
        rows={currentRows}
        savedTargetInputs={savedTargetInputs}
        savedTransactionCategoryOverrides={savedTransactionCategoryOverrides}
        transactionRowsByCategory={transactionRowsByCategory(chargeInspector)}
      />

      <ExpenseMonthTable
        categories={categories}
        currentMonth={previousMonth}
        draftTargetInputs={{}}
        draftTransactionCategoryOverrides={{}}
        editingCategory={null}
        isReferenceOnly
        monthlySummaryRows={chargeInspector.categoryMonthlySummary}
        monthLabel={
          previousMonth
            ? `Previous month (${previousMonth})`
            : "Previous month"
        }
        onCategoryOverrideChange={() => undefined}
        onEditCategory={() => undefined}
        onSaveCategoryOverride={() => undefined}
        onSaveTarget={() => undefined}
        onTargetChange={() => undefined}
        previousByCategory={new Map()}
        rows={previousRows}
        savedTargetInputs={{}}
        savedTransactionCategoryOverrides={{}}
        transactionRowsByCategory={transactionRowsByCategory(chargeInspector)}
      />
    </section>
  );
}

function SnapshotMonthlyMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={reviewSubtlePanelClass("p-3")}>
      <div className="text-xs font-semibold uppercase text-earth-600">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-seed-950">
        {value}
      </div>
    </div>
  );
}

function ExpenseMonthTable({
  categories,
  currentMonth,
  draftTargetInputs,
  draftTransactionCategoryOverrides,
  editingCategory,
  isReferenceOnly = false,
  monthlySummaryRows,
  monthLabel,
  onCategoryOverrideChange,
  onEditCategory,
  onSaveCategoryOverride,
  onSaveTarget,
  onTargetChange,
  previousByCategory,
  rows,
  savedTargetInputs,
  savedTransactionCategoryOverrides,
  transactionRowsByCategory,
}: {
  categories: string[];
  currentMonth: string;
  draftTargetInputs: Record<string, string>;
  draftTransactionCategoryOverrides: Record<string, string>;
  editingCategory: string | null;
  isReferenceOnly?: boolean;
  monthlySummaryRows: ChargeInspectorCategoryMonthlySummary[];
  monthLabel: string;
  onCategoryOverrideChange: (transactionId: string, category: string) => void;
  onEditCategory: (category: string | null) => void;
  onSaveCategoryOverride: (transactionId: string) => void;
  onSaveTarget: (category: string) => void;
  onTargetChange: (category: string, value: string) => void;
  previousByCategory: ReadonlyMap<string, ChargeInspectorCategoryMonthlySummary>;
  rows: ChargeInspectorCategoryMonthlySummary[];
  savedTargetInputs: Record<string, string>;
  savedTransactionCategoryOverrides: Record<string, string>;
  transactionRowsByCategory: ReadonlyMap<
    string,
    ChargeInspectorReview["categorySummary"][number]["evidenceRows"]
  >;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <section
      className={reviewSubtlePanelClass("p-3")}
      data-testid={
        isReferenceOnly
          ? "snapshot-expense-month-table-previous"
          : "snapshot-expense-month-table-current"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-seed-950">{monthLabel}</h4>
        <StatusPill
          label={`${rows.length.toLocaleString("en-US")} categories`}
          tone="stone"
        />
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead className="border-b border-stone-200 text-xs font-semibold uppercase text-earth-600">
            <tr>
              <th className="py-2 pr-3">Category</th>
              <th className="px-3 py-2">Actual</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Previous month</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row) => {
              const previous = previousByCategory.get(row.category);
              const savedTargetInput = savedTargetInputs[row.category] ?? "";
              const draftTargetInput =
                draftTargetInputs[row.category] ?? savedTargetInput;
              const isEditing = editingCategory === row.category;
              const transactionRows =
                transactionRowsByCategory.get(row.category) ?? [];
              const currentMonthTransactionRows = transactionRows.filter(
                (transaction) => transaction.postedDate.startsWith(currentMonth),
              );
              const targetReferenceRows = categoryMonthlyDebitTotalRows(
                monthlySummaryRows,
                row.category,
                currentMonth,
              );
              const isExpanded = expandedCategory === row.category;

              return (
                <Fragment key={`${monthLabel}:${row.category}`}>
                  <tr
                    data-category={row.category}
                    data-testid="snapshot-expense-category-row"
                  >
                    <td className="py-2 pr-3 font-medium text-seed-950">
                      {currentMonthTransactionRows.length > 0 ? (
                        <button
                          aria-expanded={isExpanded}
                          className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-1.5 text-left font-semibold text-seed-950 outline-none hover:bg-stone-100 focus:ring-2 focus:ring-seed-500"
                          data-testid="snapshot-expense-category-toggle"
                          onClick={() =>
                            setExpandedCategory((current) =>
                              current === row.category ? null : row.category,
                            )
                          }
                          type="button"
                        >
                          <span
                            aria-hidden="true"
                            className="text-base leading-none text-earth-600"
                          >
                            {isExpanded ? "▾" : "▸"}
                          </span>
                          <span>{row.label}</span>
                          <span className="text-xs font-normal text-earth-600">
                            {currentMonthTransactionRows.length.toLocaleString(
                              "en-US",
                            )} rows
                          </span>
                        </button>
                      ) : (
                        row.label
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-earth-800">
                      {row.debitTotalLabel}
                    </td>
                    <td className="px-3 py-2">
                      {isReferenceOnly ? (
                        <span className="text-earth-500">Reference only</span>
                      ) : isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <label>
                            <span className="sr-only">
                              Target for {row.label}
                            </span>
                            <input
                              className="h-9 w-32 rounded-md border border-stone-300 bg-white px-2 text-sm tabular-nums text-earth-900 outline-none placeholder:text-earth-400 focus:border-seed-500 focus:ring-2 focus:ring-seed-500"
                              data-testid="snapshot-expense-category-target"
                              inputMode="decimal"
                              onChange={(event) =>
                                onTargetChange(
                                  row.category,
                                  event.target.value,
                                )
                              }
                              placeholder="$0.00"
                              type="text"
                              value={draftTargetInput}
                            />
                          </label>
                          <button
                            aria-label={`Save target for ${row.label}`}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-seed-700 bg-seed-700 text-white shadow-sm hover:bg-seed-800 focus:outline-none focus:ring-2 focus:ring-seed-500"
                            data-testid="snapshot-expense-category-target-save"
                            onClick={() => onSaveTarget(row.category)}
                            title={`Save target for ${row.label}`}
                            type="button"
                          >
                            <SaveIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-earth-500">
                            {savedTargetInput
                              ? displayMoneyValue(savedTargetInput)
                              : "Not set"}
                          </span>
                          <EditIconButton
                            isCompact
                            label={`Edit ${row.label} target`}
                            onClick={() => onEditCategory(row.category)}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-earth-800">
                      {previous?.debitTotalLabel ?? "Not available"}
                    </td>
                  </tr>
                  {isEditing ? (
                    <tr
                      data-category={row.category}
                      data-testid="snapshot-expense-target-reference-row"
                    >
                      <td className="px-0 py-0" colSpan={4}>
                        <PreviousMonthlyTotalList rows={targetReferenceRows} />
                      </td>
                    </tr>
                  ) : null}
                  {isExpanded ? (
                    <tr data-testid="snapshot-expense-transaction-list-row">
                      <td className="px-0 py-0" colSpan={4}>
                        <ul className="border-t border-stone-100 bg-stone-50 px-3 py-3">
                          {currentMonthTransactionRows.map((transaction) => {
                            const savedCategory =
                              savedTransactionCategoryOverrides[
                                transaction.id
                              ] ?? row.category;
                            const draftCategory =
                              draftTransactionCategoryOverrides[
                                transaction.id
                              ] ?? savedCategory;
                            const hasDraftChange =
                              draftCategory !== savedCategory;

                            return (
                              <li
                                className="grid gap-2 border-b border-stone-200 py-2 text-xs leading-5 last:border-b-0 md:inline-grid md:grid-cols-[6.5rem_17rem_5.5rem_10.5rem] md:items-center"
                                data-testid="snapshot-expense-transaction-row"
                                key={transaction.id}
                              >
                                <span className="font-medium text-earth-700">
                                  {transaction.postedDate}
                                </span>
                                <span className="break-words text-seed-950">
                                  {transaction.merchantName}
                                </span>
                                <span className="tabular-nums text-earth-800">
                                  {transaction.amountLabel}
                                </span>
                                <div className="grid gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      aria-label={`Category for ${transaction.merchantName}`}
                                      className="min-h-8 min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-2 text-xs text-earth-900 outline-none focus:border-seed-500 focus:ring-2 focus:ring-seed-500"
                                      data-testid="snapshot-expense-transaction-category"
                                      onChange={(event) =>
                                        onCategoryOverrideChange(
                                          transaction.id,
                                          event.target.value,
                                        )
                                      }
                                      value={draftCategory}
                                    >
                                      {categories.map((category) => (
                                        <option key={category} value={category}>
                                          {categoryLabel(category, rows)}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      aria-label={`Save category for ${transaction.merchantName}`}
                                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-white text-earth-700 shadow-sm hover:border-seed-300 hover:text-seed-900 focus:outline-none focus:ring-2 focus:ring-seed-500 disabled:cursor-not-allowed disabled:opacity-50"
                                      data-testid="snapshot-expense-transaction-category-save"
                                      disabled={!hasDraftChange}
                                      onClick={() =>
                                        onSaveCategoryOverride(transaction.id)
                                      }
                                      title={`Save category for ${transaction.merchantName}`}
                                      type="button"
                                    >
                                      <SaveIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                  {savedCategory !== row.category ? (
                                    <span className="text-xs font-semibold text-seed-800">
                                      Saved as{" "}
                                      {categoryLabel(savedCategory, rows)}
                                    </span>
                                  ) : null}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PreviousMonthlyTotalList({
  rows,
}: {
  rows: { amountLabel: string; month: string }[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div
      className="border-t border-stone-100 bg-stone-50 px-3 py-3 text-sm leading-6 text-earth-700"
      data-testid="snapshot-expense-target-reference-list"
    >
      <div className="font-semibold text-earth-600">Previous monthly totals</div>
      <ul className="mt-2 grid gap-1 sm:max-w-md">
        {rows.map((row) => (
          <li
            className="grid grid-cols-[5.5rem_1fr] gap-3 tabular-nums"
            data-testid="snapshot-expense-target-reference-transaction"
            key={row.month}
          >
            <span>{row.month}</span>
            <span className="font-semibold text-earth-800">
              {row.amountLabel}
            </span>
          </li>
        ))}
      </ul>
    </div>
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

function monthlyFinancialTrendRows(
  chargeInspector: ChargeInspectorReview,
  values?: ManualProfileValues,
) {
  const rowsByMonth = new Map<
    string,
    { expenseCents: number; incomeCents: number }
  >();

  for (const row of chargeInspector.categoryMonthlySummary) {
    const current = rowsByMonth.get(row.month) ?? {
      expenseCents: 0,
      incomeCents: 0,
    };

    current.expenseCents += row.debitTotalCents;
    current.incomeCents += row.creditTotalCents;
    rowsByMonth.set(row.month, current);
  }

  const assetCents = values ? totalAssetCents(values) : 0;

  return [...rowsByMonth.entries()]
    .sort(([leftMonth], [rightMonth]) => leftMonth.localeCompare(rightMonth))
    .map(([month, row]) => ({
      assetCents,
      assetLabel: moneyFromCentsForSnapshot(assetCents),
      expenseCents: row.expenseCents,
      expenseLabel: moneyFromCentsForSnapshot(row.expenseCents),
      incomeCents: row.incomeCents,
      incomeLabel: moneyFromCentsForSnapshot(row.incomeCents),
      month,
    }));
}

function assetBucketSummary(values: ManualProfileValues) {
  const totals = assetBucketSummaryCents(values);

  return [
    { label: "Cash", value: moneyFromCentsForSnapshot(totals.cash) },
    {
      label: "Retirement accounts",
      value: moneyFromCentsForSnapshot(totals.retirement),
    },
    {
      label: "Taxable brokerage",
      value: moneyFromCentsForSnapshot(totals.brokerage),
    },
    { label: "Other assets", value: moneyFromCentsForSnapshot(totals.other) },
  ];
}

function assetBucketSummaryCents(values: ManualProfileValues) {
  return values.assets.reduce(
    (totals, asset) => {
      totals[asset.category] += decimalStringToCents(asset.balance);
      return totals;
    },
    { brokerage: 0, cash: 0, other: 0, retirement: 0 },
  );
}

function totalAssetCents(values: ManualProfileValues) {
  const totals = assetBucketSummaryCents(values);
  return totals.brokerage + totals.cash + totals.other + totals.retirement;
}

function expenseRowsForMonth(
  rows: ChargeInspectorCategoryMonthlySummary[],
  month: string,
) {
  if (!month) {
    return [];
  }

  return rows
    .filter(
      (row) =>
        row.month === month &&
        row.debitTotalCents > 0 &&
        row.category !== "income",
    )
    .sort((left, right) => {
      const amountComparison = right.debitTotalCents - left.debitTotalCents;
      return amountComparison !== 0
        ? amountComparison
        : left.label.localeCompare(right.label);
    });
}

function categoryMonthlyDebitTotalRows(
  rows: ChargeInspectorCategoryMonthlySummary[],
  category: string,
  activeMonth: string,
) {
  const months = [...new Set(rows.map((row) => row.month))]
    .filter((month) => !activeMonth || month <= activeMonth)
    .sort((left, right) => right.localeCompare(left))
    .slice(0, 3);
  const rowByMonth = new Map(
    rows
      .filter((row) => row.category === category)
      .map((row) => [row.month, row]),
  );

  return months.map((month) => {
    const row = rowByMonth.get(month);

    return {
      amountLabel: row
        ? moneyFromCentsForMonthlyReference(row.debitTotalCents)
        : moneyFromCentsForMonthlyReference(0),
      month,
    };
  });
}

function categoryOptions(rows: ChargeInspectorCategoryMonthlySummary[]) {
  return [...new Set(rows.map((row) => row.category))].sort();
}

function transactionRowsByCategory(chargeInspector: ChargeInspectorReview) {
  return new Map(
    chargeInspector.categorySummary.map((category) => [
      category.category,
      category.evidenceRows,
    ]),
  );
}

function categoryLabel(
  category: string,
  rows: ChargeInspectorCategoryMonthlySummary[],
) {
  return rows.find((row) => row.category === category)?.label ?? titleCase(category);
}

function decimalStringToCents(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
}

function moneyFromCentsForSnapshot(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100);
}

function moneyFromCentsForMonthlyReference(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    style: "currency",
  }).format(cents / 100);
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
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

function SaveIcon({ className }: { className: string }) {
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
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
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
