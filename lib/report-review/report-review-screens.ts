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
