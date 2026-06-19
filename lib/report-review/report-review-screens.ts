export type ReportReviewScreenId =
  | "inputs"
  | "report"
  | "portfolio"
  | "charge-inspector"
  | "education";

export type ReportReviewScreen = {
  id: ReportReviewScreenId;
  label: string;
  legacyAnchors: string[];
};

export const reportReviewScreens: ReportReviewScreen[] = [
  {
    id: "inputs",
    label: "Inputs",
    legacyAnchors: ["manual-input", "validation-checklist", "inputs"],
  },
  {
    id: "report",
    label: "Report",
    legacyAnchors: ["overview", "sections", "findings"],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    legacyAnchors: ["portfolio", "saving-goal-draft"],
  },
  {
    id: "charge-inspector",
    label: "Charge Inspector",
    legacyAnchors: ["charge-inspector"],
  },
  {
    id: "education",
    label: "Education",
    legacyAnchors: ["education", "evidence"],
  },
];

export function reportReviewScreenFromHash(hash: string): ReportReviewScreenId {
  const id = hash.replace(/^#/, "");
  const screen = reportReviewScreens.find(
    (item) => item.id === id || item.legacyAnchors.includes(id),
  );
  return screen?.id ?? "report";
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
