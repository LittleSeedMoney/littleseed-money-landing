export type ReportReviewScreenId = "money" | "goals" | "learn";

export type ReportReviewScreen = {
  id: ReportReviewScreenId;
  label: string;
  legacyAnchors: string[];
};

export const reportReviewScreens: ReportReviewScreen[] = [
  {
    id: "money",
    label: "Money",
    legacyAnchors: [
      // former Snapshot surface
      "snapshot",
      "data-sources",
      "inputs",
      "manual-input",
      "portfolio",
      "snapshot-completeness",
      "validation-checklist",
      // former Report surface (now a Money detail disclosure)
      "report",
      "overview",
      "sections",
      "findings",
      // former Charge Inspector surface (now a Money detail disclosure)
      "charge-inspector",
    ],
  },
  {
    id: "goals",
    label: "Goals",
    legacyAnchors: ["saving-goal-draft"],
  },
  {
    id: "learn",
    label: "Learn",
    // former Education + Evidence surfaces, merged
    legacyAnchors: ["education", "evidence"],
  },
];

/**
 * DOM element id that a legacy hash should reveal within its resolved screen.
 * The 3-tab IA folds several old surfaces into the Money screen; deep-linking
 * to one of them should open/scroll its section, not just select the tab.
 * Returns null when the hash targets a whole screen (no sub-section to reveal).
 */
export function reportReviewRevealTargetForHash(hash: string): string | null {
  const id = hash.replace(/^#/, "");
  const map: Record<string, string> = {
    // former Report surface -> Money "Report & findings" disclosure
    report: "report-findings-details",
    overview: "report-findings-details",
    sections: "report-findings-details",
    findings: "report-findings-details",
    // former Charge Inspector surface -> Money disclosure (inner section id)
    "charge-inspector": "charge-inspector",
    // former Snapshot surface -> the portfolio snapshot section
    snapshot: "portfolio",
    portfolio: "portfolio",
    inputs: "portfolio",
    "manual-input": "portfolio",
    "data-sources": "portfolio",
    "snapshot-completeness": "portfolio",
    "validation-checklist": "portfolio",
  };
  return map[id] ?? null;
}

export function reportReviewScreenFromHash(hash: string): ReportReviewScreenId {
  const id = hash.replace(/^#/, "");
  const screen = reportReviewScreens.find(
    (item) => item.id === id || item.legacyAnchors.includes(id),
  );
  return screen?.id ?? "money";
}

export function reportReviewScreenFromKeyboard(
  currentScreen: ReportReviewScreenId,
  key: string,
): ReportReviewScreenId | null {
  const currentIndex = reportReviewScreens.findIndex(
    (screen) => screen.id === currentScreen,
  );
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const lastIndex = reportReviewScreens.length - 1;

  if (key === "ArrowRight" || key === "ArrowDown") {
    return reportReviewScreens[(safeIndex + 1) % reportReviewScreens.length].id;
  }

  if (key === "ArrowLeft" || key === "ArrowUp") {
    return reportReviewScreens[
      (safeIndex - 1 + reportReviewScreens.length) %
        reportReviewScreens.length
    ].id;
  }

  if (key === "Home") {
    return reportReviewScreens[0].id;
  }

  if (key === "End") {
    return reportReviewScreens[lastIndex].id;
  }

  return null;
}
