import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import type { ReportReviewSample } from "@/data/report-review-sample";
import type {
  ManualAssetValue,
  ManualDebtValue,
  ManualProfilePresetId,
  ManualProfileScalarField,
  ManualProfileValues,
} from "@/lib/report-review/manual-profile";
import type {
  GoalPlanningRow,
  GoalPlanningSummary,
} from "@/lib/report-review/goal-planning";
import {
  defaultMoneyArrangement,
  hideMoneyBlock,
  isDefaultMoneyArrangement,
  isMoneyBlockId,
  MONEY_BLOCK_LABELS,
  MONEY_BLOCK_SHOW_EVENT,
  moveMoneyBlock,
  showMoneyBlock,
  type MoneyBlockId,
} from "@/lib/report-review/money-arrangement";
import type { ReportReviewScreenId } from "@/lib/report-review/report-review-screens";

import {
  MoneyBalanceDetails,
  MoneySpendingDetail,
} from "./asset-portfolio-section";
import { AssetLiabilityBreakdown } from "./asset-liability-breakdown";
import { AtAGlanceSection } from "./at-a-glance-section";
import { ChargeInspectorSection } from "./charge-inspector-section";
import { EducationSection } from "./education-section";
import { EvidenceSection } from "./evidence-section";
import { FindingsSection } from "./findings-section";
import {
  GoalPlanningScreen,
  type GoalMoveDirection,
} from "./goal-planning-screen";
import type { ManualRequestState } from "./manual-input-section";
import {
  MoneyArrangeControls,
  MoneyArrangeItem,
  MoneyHiddenSections,
} from "./money-arrangement-section";
import { MoneyHero } from "./money-hero";
import { OverviewSection } from "./overview-section";
import { ReportSections } from "./report-sections";
import { ReviewDisclosure } from "./shared";
import { ThingsToLookAtSection } from "./things-to-look-at-section";
import { SnapshotSupportDetails } from "./snapshot-screen";
import { SnapshotViewProvider } from "./snapshot-view-context";

export function ReportReviewScreenPanel({
  activeScreen,
  aiEnabled,
  errorMessage,
  generatedAt,
  goalPlanningAsOfMonth,
  goalRows,
  onAddAsset,
  onAddDebt,
  onAddGoal,
  onAssetUpdate,
  onDebtUpdate,
  onGoalMove,
  onGoalRemove,
  onGoalUpdate,
  onRemoveAsset,
  onRemoveDebt,
  onSubmit,
  onUpdate,
  onValuesReset,
  report,
  requestState,
  selectedPreset,
  sourceById,
  topGoalSummary,
  values,
}: {
  activeScreen: ReportReviewScreenId;
  aiEnabled: boolean;
  errorMessage: string;
  generatedAt: string;
  goalPlanningAsOfMonth: string;
  goalRows: GoalPlanningRow[];
  onAddAsset: () => string;
  onAddDebt: () => string;
  onAddGoal: () => void;
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
  onGoalMove: (id: string, direction: GoalMoveDirection) => void;
  onGoalRemove: (id: string) => void;
  onGoalUpdate: <T extends keyof GoalPlanningRow>(
    id: string,
    field: T,
    value: GoalPlanningRow[T],
  ) => void;
  onRemoveAsset: (id: string) => void;
  onRemoveDebt: (id: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (
    field: ManualProfileScalarField,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onValuesReset: (
    nextValues: ManualProfileValues,
    nextPreset: ManualProfilePresetId | "custom",
  ) => void;
  report: ReportReviewSample;
  requestState: ManualRequestState;
  selectedPreset: ManualProfilePresetId | "custom";
  sourceById: Map<string, ReportReviewSample["evidenceSources"][number]>;
  topGoalSummary: GoalPlanningSummary | null;
  values: ManualProfileValues;
}) {
  // In-session Money arrangement (Phase 5.5.6): session-only presentation
  // state — never stored or sent; a reload restores the default order. Hooks
  // live above the screen early-returns so they run on every render.
  const [moneyArrangement, setMoneyArrangement] = useState(
    defaultMoneyArrangement,
  );
  const [arrangeMode, setArrangeMode] = useState(false);
  const [arrangeLiveMessage, setArrangeLiveMessage] = useState("");

  // Deep links into a hidden block (revealAnchor / hash navigation) ask for
  // the block back through a bubbling CustomEvent, so hidden content stays
  // reachable from every existing link without threading state into the DOM
  // helpers.
  useEffect(() => {
    function onShowRequest(event: Event) {
      const detail = (event as CustomEvent<unknown>).detail;
      if (isMoneyBlockId(detail)) {
        setMoneyArrangement((current) => showMoneyBlock(current, detail));
      }
    }

    window.addEventListener(MONEY_BLOCK_SHOW_EVENT, onShowRequest);
    return () =>
      window.removeEventListener(MONEY_BLOCK_SHOW_EVENT, onShowRequest);
  }, []);

  if (activeScreen === "goals") {
    return (
      <GoalPlanningScreen
        asOfMonth={goalPlanningAsOfMonth}
        goalRows={goalRows}
        onAddGoal={onAddGoal}
        onGoalMove={onGoalMove}
        onGoalRemove={onGoalRemove}
        onGoalUpdate={onGoalUpdate}
      />
    );
  }

  if (activeScreen === "learn") {
    return (
      <>
        <EducationSection
          decisionReadiness={report.decisionReadiness}
          findings={report.findings}
        />
        <EvidenceSection sources={report.evidenceSources} />
      </>
    );
  }

  // Money screen: question-first narrative. Net-worth hero leads, then the
  // detail disclosures follow in the order the consumer needs them. The
  // SnapshotViewProvider lets the hero chart drive month selection in the
  // spending detail disclosure. Since Phase 5.5.6 the blocks below the hero
  // render from the in-session arrangement (default order shown here); the
  // hero and arrange controls stay pinned.
  //
  // Narrative order (Phase 5.5.1 skeleton, 5.5.6 default arrangement):
  //   1. Net-worth hero (chart + composition + tiles)
  //   1a. Asset & liability grouped breakdown (own / owe by category)
  //   1b. Things to look at (deterministic observations)
  //   1c. At-a-glance answers (Q1–Q4) — mobile only here, keeping the
  //       question-first order; on lg+ they render in the sticky right rail
  //       (see the shell) and this copy is hidden.
  //   2. This month's spending disclosure  ← monthly table content
  //   3. Charge Inspector disclosure
  //   4. Report & findings disclosure
  //   5. Balance details disclosure  ← asset/liability lists + profile inputs
  //   6. Review support disclosure
  const hasReport = hasReportContent(report);

  // Rendered inside the Balance details disclosure when there is report content,
  // or on its own (with its editable-values empty state) when there is not.
  // Defined once so the two branches cannot drift on the shared prop set.
  const balanceDetails = (
    <MoneyBalanceDetails
      decisionReadiness={report.decisionReadiness}
      errorMessage={errorMessage}
      hasReportContent={hasReport}
      onAddAsset={onAddAsset}
      onAddDebt={onAddDebt}
      onAssetUpdate={onAssetUpdate}
      onDebtUpdate={onDebtUpdate}
      onRemoveAsset={onRemoveAsset}
      onRemoveDebt={onRemoveDebt}
      onPortfolioSubmit={onSubmit}
      onProfileSubmit={onSubmit}
      onProfileUpdate={onUpdate}
      onValuesReset={onValuesReset}
      portfolio={report.assetPortfolio}
      requestState={requestState}
      selectedPreset={selectedPreset}
      sourceById={sourceById}
      topGoalSummary={topGoalSummary}
      values={values}
    />
  );

  // Every movable Money block, keyed for the in-session arrangement. `null`
  // means the block does not render for this report state (no-report mode has
  // no detail disclosures), so it is skipped by the arrangement UI too. The
  // net-worth hero and the arrange controls stay pinned above this stack.
  const moneyBlockContent: Record<MoneyBlockId, ReactNode | null> = {
    breakdown: <AssetLiabilityBreakdown portfolio={report.assetPortfolio} />,
    "things-to-look-at": <ThingsToLookAtSection report={report} />,
    // Mobile-only in the narrative: on lg+ the answers render in the sticky
    // right rail (see the shell). The wrapper hides the block and its arrange
    // controls on lg+, so desktop users only arrange what desktop shows.
    "at-a-glance": (
      <AtAGlanceSection summaryMetrics={report.summaryMetrics} />
    ),
    "spending-detail": hasReport ? (
      <ReviewDisclosure
        summary={
          <div id="spending-detail" className="scroll-mt-28">
            <h3 className="text-sm font-semibold text-seed-950">
              This month's spending
            </h3>
            <p className="mt-0.5 text-xs text-earth-600">
              Monthly income, expenses, and category targets for this session.
            </p>
          </div>
        }
        variant="panel"
      >
        <div className="border-t border-stone-200 p-4">
          <MoneySpendingDetail
            chargeInspector={report.chargeInspector}
            values={values}
          />
        </div>
      </ReviewDisclosure>
    ) : null,
    "charge-inspector": hasReport ? (
      <ReviewDisclosure
        summary={
          // The fragment target lives on the always-visible summary, not on
          // the disclosure body, so native fragment navigation to
          // #charge-inspector does not open a closed <details> before React
          // hydrates (which would cause an `open` hydration mismatch).
          <div id="charge-inspector" className="scroll-mt-28">
            <h3 className="text-sm font-semibold text-seed-950">
              Charge Inspector
            </h3>
            <p className="mt-0.5 text-xs text-earth-600">
              Recurring-charge review for the current transaction source.
            </p>
          </div>
        }
        variant="panel"
      >
        <div className="border-t border-stone-200 p-4">
          <ChargeInspectorSection review={report.chargeInspector} />
        </div>
      </ReviewDisclosure>
    ) : null,
    "report-findings": hasReport ? (
      <ReviewDisclosure
        summary={
          <div id="report-findings-details" className="scroll-mt-28">
            <h3 className="text-sm font-semibold text-seed-950">
              Report &amp; findings
            </h3>
            <p className="mt-0.5 text-xs text-earth-600">
              Structured answers, evidence levels, and findings for this
              session.
            </p>
          </div>
        }
        variant="panel"
      >
        <div className="space-y-4 border-t border-stone-200 p-4">
          <OverviewSection generatedAt={generatedAt} report={report} />
          <ReportSections sections={report.sections} sourceById={sourceById} />
          <FindingsSection aiEnabled={aiEnabled} findings={report.findings} />
        </div>
      </ReviewDisclosure>
    ) : null,
    "balance-details": hasReport ? (
      <ReviewDisclosure
        summary={
          <div id="portfolio" className="scroll-mt-28">
            <h3 className="text-sm font-semibold text-seed-950">
              Balance details
            </h3>
            <p className="mt-0.5 text-xs text-earth-600">
              Editable asset and liability balances, profile inputs, and
              decision details.
            </p>
          </div>
        }
        variant="panel"
      >
        <div className="border-t border-stone-200 p-4">{balanceDetails}</div>
      </ReviewDisclosure>
    ) : (
      balanceDetails
    ),
    "review-support": (
      <SnapshotSupportDetails
        dataCompleteness={report.dataCompleteness}
        dataMode={report.dataMode}
        reconciliation={report.sourceReconciliation}
        selectedPreset={selectedPreset}
        showDataCompleteness={hasReport}
        sources={report.dataSources}
      />
    ),
  };

  const presentIds = moneyArrangement.order.filter(
    (id) => moneyBlockContent[id] !== null,
  );
  const visibleIds = presentIds.filter(
    (id) => !moneyArrangement.hidden.includes(id),
  );
  const hiddenPresentIds = presentIds.filter((id) =>
    moneyArrangement.hidden.includes(id),
  );

  function moveBlock(id: MoneyBlockId, direction: "up" | "down") {
    // Swap only with neighbours the user can actually see right now. The
    // mobile-only at-a-glance block stays in the DOM on desktop (`lg:hidden`),
    // and swapping with an invisible neighbour made the first click look like
    // a no-op. Reading `offsetParent` inside the event handler keeps this in
    // sync with whatever CSS hides (display: none) without hard-coding a
    // breakpoint, and runs client-side only — no hydration concern.
    const movableIds = presentIds.filter((block) => {
      const host = document.querySelector(`[data-money-block="${block}"]`);
      return !(host instanceof HTMLElement) || host.offsetParent !== null;
    });
    const next = moveMoneyBlock(moneyArrangement, id, direction, movableIds);
    if (next === moneyArrangement) {
      return;
    }
    setMoneyArrangement(next);
    const nextVisible = next.order.filter(
      (block) => movableIds.includes(block) && !next.hidden.includes(block),
    );
    setArrangeLiveMessage(
      `${MONEY_BLOCK_LABELS[id]} moved to position ${
        nextVisible.indexOf(id) + 1
      } of ${nextVisible.length}.`,
    );
  }

  function hideBlock(id: MoneyBlockId) {
    setMoneyArrangement((current) => hideMoneyBlock(current, id));
    setArrangeLiveMessage(
      `${MONEY_BLOCK_LABELS[id]} hidden. Restore it from the hidden sections list.`,
    );
  }

  function showBlock(id: MoneyBlockId) {
    setMoneyArrangement((current) => showMoneyBlock(current, id));
    setArrangeLiveMessage(`${MONEY_BLOCK_LABELS[id]} shown again.`);
  }

  function resetArrangement() {
    setMoneyArrangement(defaultMoneyArrangement());
    setArrangeLiveMessage("Section order reset to the default arrangement.");
  }

  function exitArrangeMode() {
    setArrangeMode(false);
    setArrangeLiveMessage("Done arranging sections.");
  }

  return (
    <SnapshotViewProvider>
      <MoneyHero report={report} topGoalSummary={topGoalSummary} />
      <MoneyArrangeControls
        arrangeMode={arrangeMode}
        isDefault={isDefaultMoneyArrangement(moneyArrangement)}
        liveMessage={arrangeLiveMessage}
        onEnter={() => setArrangeMode(true)}
        onExit={exitArrangeMode}
        onReset={resetArrangement}
      />
      {moneyArrangement.order.map((id) => {
        const content = moneyBlockContent[id];
        if (content === null) {
          return null;
        }
        const visibleIndex = visibleIds.indexOf(id);
        return (
          <MoneyArrangeItem
            arrangeMode={arrangeMode}
            blockId={id}
            canMoveDown={
              visibleIndex >= 0 && visibleIndex < visibleIds.length - 1
            }
            canMoveUp={visibleIndex > 0}
            hidden={moneyArrangement.hidden.includes(id)}
            key={id}
            mobileOnly={id === "at-a-glance"}
            onEnterArrange={() => setArrangeMode(true)}
            onHide={hideBlock}
            onMove={moveBlock}
          >
            {content}
          </MoneyArrangeItem>
        );
      })}
      {arrangeMode ? (
        <>
          <MoneyHiddenSections
            hiddenIds={hiddenPresentIds}
            onShow={showBlock}
          />
          {/* Second Done at the end of the stack so a long page never forces a
              scroll back to the top bar to finish arranging. */}
          <div className="flex justify-end">
            <button
              className="inline-flex min-h-8 items-center rounded-md bg-seed-700 px-3 text-xs font-semibold text-white shadow-sm outline-none hover:bg-seed-800 focus:ring-2 focus:ring-seed-500"
              data-testid="money-arrange-done-bottom"
              onClick={exitArrangeMode}
              type="button"
            >
              Done
            </button>
          </div>
        </>
      ) : null}
    </SnapshotViewProvider>
  );
}

function hasReportContent(report: ReportReviewSample) {
  return report.summaryMetrics.length > 0 || report.sections.length > 0;
}
