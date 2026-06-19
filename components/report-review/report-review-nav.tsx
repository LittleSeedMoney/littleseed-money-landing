"use client";

import { useRef, type KeyboardEvent } from "react";

import {
  reportReviewScreenFromKeyboard,
  reportReviewScreens,
  type ReportReviewScreenId,
} from "@/lib/report-review/report-review-screens";

export function ReportReviewNav({
  activeScreen = "report",
  onScreenSelect,
}: {
  activeScreen?: ReportReviewScreenId;
  onScreenSelect?: (screen: ReportReviewScreenId) => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const controlsPanel = typeof onScreenSelect === "function";

  function selectAndFocusScreen(screen: ReportReviewScreenId) {
    const screenIndex = reportReviewScreens.findIndex(
      (item) => item.id === screen,
    );
    onScreenSelect?.(screen);
    tabRefs.current[screenIndex]?.focus();
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentScreen: ReportReviewScreenId,
  ) {
    const nextScreen = reportReviewScreenFromKeyboard(
      currentScreen,
      event.key,
    );

    if (!nextScreen) {
      return;
    }

    event.preventDefault();
    selectAndFocusScreen(nextScreen);
  }

  return (
    <nav
      aria-label="Report review screens"
      className="min-w-0 max-w-full rounded-lg border border-stone-200 bg-stone-50/80 p-1"
    >
      <div
        className="report-review-tablist flex gap-2 overflow-x-auto"
        role="tablist"
        aria-orientation="horizontal"
      >
        {reportReviewScreens.map((screen, index) => {
          const isActive = screen.id === activeScreen;
          return (
            <button
              aria-controls={
                isActive && controlsPanel
                  ? `report-review-screen-${screen.id}`
                  : undefined
              }
              aria-selected={isActive}
              className={screenTabClass(isActive)}
              data-screen-id={screen.id}
              id={`report-review-tab-${screen.id}`}
              key={screen.id}
              onClick={() => onScreenSelect?.(screen.id)}
              onKeyDown={(event) => handleTabKeyDown(event, screen.id)}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              {screen.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function screenTabClass(isActive: boolean) {
  const base =
    "min-h-9 shrink-0 rounded-md border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-seed-500";
  if (isActive) {
    return `${base} border-seed-700 bg-seed-700 text-white shadow-sm`;
  }
  return `${base} border-transparent text-earth-700 hover:border-stone-200 hover:bg-white hover:text-seed-950`;
}
