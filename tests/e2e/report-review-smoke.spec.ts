import { expect, type Page, test } from "@playwright/test";

import { reportReviewSample } from "../../data/report-review-sample";

const reportReviewPath = "/private/report-review";

// 3-tab IA: former Snapshot/Report/Charge Inspector all live under Money;
// Education + Evidence merge into Learn. Legacy hashes resolve to these three.
const smokeScreens = [
  {
    hash: "money",
    heading: "This month's spending",
    screen: "money",
    tab: "Money",
  },
  {
    hash: "goals",
    heading: "Goal planning workspace",
    screen: "goals",
    tab: "Goals",
  },
  {
    hash: "learn",
    heading: "Education topics",
    screen: "learn",
    tab: "Learn",
  },
] as const;

const editableProfileFields = [
  "Age",
  "Monthly take-home income",
  "Monthly housing cost",
  "Other monthly essentials",
  "Monthly discretionary expenses",
  "Monthly investing contribution",
  "Income pattern",
  "Job stability",
  "Risk tolerance",
  "Expected years in current location",
  "Emergency target",
] as const;

test.describe("private report review smoke", () => {
  test("deep links render the critical screens without page-level horizontal overflow", async ({
    page,
  }) => {
    for (const screen of smokeScreens) {
      await page.goto(`${reportReviewPath}#${screen.hash}`);

      const panel = page.locator(`#report-review-screen-${screen.screen}`);

      await expect(panel).toBeVisible();
      await expect(
        panel.getByRole("heading", { exact: true, name: screen.heading }),
      ).toBeVisible();
      await expect(page.getByRole("tab", { name: screen.tab })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(page).toHaveURL(new RegExp(`#${screen.hash}$`));

      await expectNoPageHorizontalOverflow(page, screen.hash);
    }
  });

  test("legacy snapshot, input, and report links open the Money screen", async ({
    page,
  }) => {
    for (const legacyHash of [
      "snapshot",
      "inputs",
      "manual-input",
      "portfolio",
      "report",
      "charge-inspector",
    ]) {
      await page.goto(`${reportReviewPath}#${legacyHash}`);

      const panel = page.locator("#report-review-screen-money");

      await expect(panel).toBeVisible();
      await expect(
        panel.getByRole("heading", {
          exact: true,
          name: "This month's spending",
        }),
      ).toBeVisible();
      await expect(page.getByRole("tab", { name: "Money" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(page).toHaveURL(new RegExp(`#${legacyHash}$`));
    }
  });

  test("legacy saving goal link opens the goals screen", async ({ page }) => {
    await page.goto(`${reportReviewPath}#saving-goal-draft`);

    const panel = page.locator("#report-review-screen-goals");

    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole("heading", {
        exact: true,
        name: "Goal planning workspace",
      }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Goals" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page).toHaveURL(/#saving-goal-draft$/);
  });

  test("at-a-glance answers restate the four questions and deep-link to provenance", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#money`);

    // At-a-glance renders twice for responsive placement (mobile narrative vs
    // desktop rail); exactly one is displayed per viewport. Target the visible one.
    const atAGlance = page.locator('[data-testid="at-a-glance"]:visible');
    await expect(atAGlance).toHaveCount(1);
    await expect(atAGlance).toBeVisible();

    // The sample carries all four question metrics, in fixed order.
    const rows = atAGlance.getByTestId("at-a-glance-row");
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(0)).toContainText("Money left this month");
    await expect(rows.nth(0)).toContainText("$1,280 left");
    await expect(rows.nth(1)).toContainText("3.46 months");
    await expect(rows.nth(2)).toContainText("$35,000 debt");
    await expect(rows.nth(3)).toContainText("$33,000");

    // The debt-pressure provenance control opens the Report & findings
    // disclosure and reveals that metric's full card (nested in a collapsed
    // <details>).
    const metricCard = page.locator("#metric-debt_pressure");
    await expect(metricCard).not.toBeInViewport();
    await rows
      .nth(2)
      .getByTestId("at-a-glance-provenance-link")
      .click();
    await expect(metricCard).toBeVisible();
    await expect(metricCard).toBeInViewport();
  });

  test("money layout offers the left section navigator on wide viewports", async ({
    page,
    viewport,
  }) => {
    test.skip(
      !viewport || viewport.width < 1280,
      "left navigator only renders at xl (>=1280px)",
    );
    await page.goto(`${reportReviewPath}#money`);

    const nav = page.getByRole("navigation", { name: "On this page" });
    await expect(nav).toBeVisible();

    // Jumping to a collapsed disclosure opens it and scrolls it into view.
    const balance = page.locator("#portfolio");
    await expect(balance.locator("xpath=ancestor::details[1]")).toHaveJSProperty(
      "open",
      false,
    );
    await nav.getByRole("button", { name: "Balance details" }).click();
    await expect(balance.locator("xpath=ancestor::details[1]")).toHaveJSProperty(
      "open",
      true,
    );
    await expect(balance).toBeInViewport();
  });

  test("report findings show the AI explanation disabled state by default", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#report`);

    // Report & findings is a Money detail disclosure. Deep-linking to #report
    // auto-opens it; ensure it is open without toggling it back closed.
    await ensureReportFindingsOpen(page);

    const firstFinding = page.getByTestId("report-finding-card").first();
    await firstFinding.locator("> summary").click();

    await expect(
      firstFinding.getByText("AI explanation unavailable"),
    ).toBeVisible();
    await expect(
      firstFinding.getByRole("button", { name: "Explain" }),
    ).toBeDisabled();
  });

  test("portfolio groups edit independently and save back to read mode", async ({
    page,
  }) => {
    const reportWithLinkedAccounts = {
      ...reportReviewSample,
      assetPortfolio: {
        ...reportReviewSample.assetPortfolio,
        assets: [
          ...reportReviewSample.assetPortfolio.assets,
          {
            category: "Cash",
            emergencyEligible: true,
            id: "linked-savings",
            liquidity: "Cash",
            name: "Linked savings account",
            provenance: "linked-account",
            value: "$2,400",
          },
        ],
        liabilities: [
          ...reportReviewSample.assetPortfolio.liabilities,
          {
            category: "Auto loan",
            emergencyEligible: false,
            id: "linked-auto-loan",
            liquidity: "Debt",
            name: "Linked auto loan",
            provenance: "linked-account",
            value: "$8,400",
          },
        ],
      },
    };
    let reportRequestCount = 0;

    await page.route("**/private/report-review/workspace-report", async (route) => {
      reportRequestCount += 1;
      const responseReport =
        reportRequestCount === 1 ? reportWithLinkedAccounts : reportReviewSample;

      await route.fulfill({
        contentType: "application/json",
        json: { report: responseReport },
        status: 200,
      });
    });

    await page.goto(`${reportReviewPath}#snapshot`);

    // Asset/liability lists and profile inputs live in the Balance details
    // disclosure, collapsed by default in the question-first IA.
    await ensureBalanceDetailsOpen(page);
    // Profile inputs are further tucked into a nested collapsed disclosure.
    await page.getByText("Your profile inputs", { exact: true }).click();

    const profileCard = page.locator(
      'form[aria-labelledby="profile-values-heading"]',
    );

    await expect(profileCard).toBeVisible();
    await expect(
      profileCard.getByRole("button", { name: "Save profile" }),
    ).toHaveCount(0);
    await expect(profileCard.locator("input, select")).toHaveCount(0);
    await expect(page.getByText("Scenario presets")).toHaveCount(0);

    for (const label of editableProfileFields) {
      await expect(
        profileCard.getByRole("button", { name: `Edit ${label}` }),
      ).toBeVisible();
    }

    await profileCard
      .getByRole("button", { name: "Edit Monthly take-home income" })
      .click();

    await expect(profileCard.getByRole("button", { name: "Save profile" }))
      .toBeVisible();
    await expect(profileCard.locator("input, select")).toHaveCount(1);
    const takeHomeIncomeInput = profileCard.getByRole("spinbutton", {
      name: "Monthly take-home income",
    });
    await expect(takeHomeIncomeInput).toBeVisible();
    await expect(takeHomeIncomeInput).toBeFocused();
    await expect(takeHomeIncomeInput).toHaveAttribute("required", "");
    await expect(page.getByText("Fields marked * build the request"))
      .toHaveCount(0);
    await expect(profileCard.getByText("Gross annual income")).toHaveCount(0);
    await expect(profileCard.getByText("Dependents")).toHaveCount(0);

    await takeHomeIncomeInput.fill("5300");
    await profileCard.getByRole("button", { name: "Save profile" }).click();

    await expect(
      profileCard.getByRole("button", { name: "Save profile" }),
    ).toHaveCount(0);
    await expect(profileCard.locator("input, select")).toHaveCount(0);
    await expect(profileCard.getByText("$5,300")).toBeVisible();

    const assetsSection = page.locator(
      'section[aria-describedby="assets-snapshot-description"]',
    );
    const liabilitiesSection = page.locator(
      'section[aria-describedby="liabilities-snapshot-description"]',
    );

    await expect(assetsSection.getByText("Linked savings account"))
      .toBeVisible();
    await expect(assetsSection.locator("ul > li")).toHaveCount(5);
    await expect(
      assetsSection.getByRole("button", { name: "Edit Linked savings account" }),
    ).toHaveCount(0);
    await expect(liabilitiesSection.getByText("Linked auto loan")).toBeVisible();
    await expect(liabilitiesSection.locator("ul > li")).toHaveCount(4);
    await expect(
      liabilitiesSection.getByRole("button", { name: "Edit Linked auto loan" }),
    ).toHaveCount(0);

    await expect(page.getByRole("button", { name: "Edit assets" }))
      .toHaveCount(0);
    await expect(assetsSection.getByRole("button", { name: "Add asset" }))
      .toBeVisible();
    await assetsSection
      .getByRole("button", { name: "Edit Cash and cash equivalents" })
      .click();
    await expect(assetsSection.getByRole("button", { name: "Save asset" }))
      .toBeVisible();
    const assetNameInput = assetsSection.getByLabel("Asset name");
    await expect(assetNameInput).toBeFocused();
    await expect(assetNameInput).toHaveValue("Cash and cash equivalents");
    await expect(assetsSection.locator("form")).toHaveCount(1);
    await expect(liabilitiesSection.locator("form")).toHaveCount(0);
    await assetsSection.getByLabel("Balance").fill("13000");
    await assetsSection.getByRole("button", { name: "Save asset" }).click();
    await expect(assetsSection.getByRole("button", { name: "Save asset" }))
      .toHaveCount(0);
    await expect(assetsSection.getByText("$13,000")).toBeVisible();
    await expect(assetsSection.getByText("Linked savings account"))
      .toBeVisible();
    await expect(liabilitiesSection.getByText("Linked auto loan")).toBeVisible();

    await assetsSection.getByRole("button", { name: "Add asset" }).click();
    await expect(assetsSection.getByRole("button", { name: "Save asset" }))
      .toBeVisible();
    await expect(assetsSection.getByLabel("Asset name")).toBeFocused();
    await expect(assetsSection.getByLabel("Asset name")).toHaveValue("New asset");
    await assetsSection.getByRole("button", { name: "Cancel" }).click();
    await expect(assetsSection.getByText("New asset")).toHaveCount(0);

    await expect(page.getByRole("button", { name: "Edit liabilities" }))
      .toHaveCount(0);
    await expect(
      liabilitiesSection.getByRole("button", { name: "Add liability" }),
    ).toBeVisible();
    await liabilitiesSection
      .getByRole("button", { name: "Edit Student loan" })
      .click();
    await expect(
      liabilitiesSection.getByRole("button", { name: "Save liability" }),
    ).toBeVisible();
    const liabilityNameInput = liabilitiesSection.getByLabel("Liability name");
    await expect(liabilityNameInput).toBeFocused();
    await expect(liabilityNameInput).toHaveValue("Student loan");
    await expect(assetsSection.locator("form")).toHaveCount(0);

    await liabilitiesSection.getByRole("button", { name: "Cancel" }).click();

    await liabilitiesSection
      .getByRole("button", { name: "Add liability" })
      .click();
    await expect(
      liabilitiesSection.getByRole("button", { name: "Save liability" }),
    ).toBeVisible();
    await expect(liabilitiesSection.getByLabel("Liability name")).toBeFocused();
    await expect(liabilitiesSection.getByLabel("Liability name"))
      .toHaveValue("New liability");

    const conditionalLiability = liabilitiesSection
      .locator("form label")
      .filter({ hasText: /^Liability name\b/ })
      .last();
    await expect(conditionalLiability).toContainText("* if balance > 0");
    await expect(conditionalLiability.locator("input")).not.toHaveAttribute(
      "required",
      "",
    );

    await liabilitiesSection
      .getByRole("button", { name: "Save liability" })
      .click();

    await expect(
      liabilitiesSection.getByRole("button", { name: "Edit Student loan" }),
    ).toBeVisible();
    await expect(
      liabilitiesSection.getByRole("button", { name: "Save liability" }),
    ).toHaveCount(0);
  });

  test("money hero degrades to a single-point net worth when the report has no trend", async ({
    page,
  }) => {
    // A user-entered / platform report carries portfolio totals but no
    // month-by-month net-worth history, so the chart cannot be shown.
    const trendlessReport = {
      ...reportReviewSample,
      assetPortfolio: {
        ...reportReviewSample.assetPortfolio,
        netWorthTrend: undefined,
        netWorthTarget: undefined,
      },
    };
    await page.route(
      "**/private/report-review/workspace-report",
      async (route) => {
        await route.fulfill({
          contentType: "application/json",
          json: { report: trendlessReport },
          status: 200,
        });
      },
    );

    await page.goto(`${reportReviewPath}#snapshot`);

    // The sample loads with a trend, so the chart is present first.
    await expect(page.getByTestId("net-worth-chart")).toBeVisible();

    // Save a manual edit to swap in the trend-less report.
    await ensureBalanceDetailsOpen(page);
    await page.getByText("Your profile inputs", { exact: true }).click();
    const profileCard = page.locator(
      'form[aria-labelledby="profile-values-heading"]',
    );
    await profileCard
      .getByRole("button", { name: "Edit Monthly take-home income" })
      .click();
    await profileCard
      .getByRole("spinbutton", { name: "Monthly take-home income" })
      .fill("5300");
    await profileCard.getByRole("button", { name: "Save profile" }).click();

    // The hero degrades gracefully: no chart, but the current net worth and
    // composition remain with an honest note about the missing trend.
    await expect(page.getByTestId("net-worth-chart")).toHaveCount(0);
    const composition = page.getByTestId("money-hero-composition");
    await expect(composition).toBeVisible();
    await expect(composition).toContainText("$33,000");
    await expect(page.getByTestId("money-hero-no-trend-note")).toBeVisible();
    // No selectable month targets remain without a chart.
    await expect(page.getByTestId("net-worth-chart-month")).toHaveCount(0);
  });

  test("money hero shows an empty state when the report has no portfolio totals", async ({
    page,
  }) => {
    // A report with no trend and no total-assets/total-liabilities metrics
    // cannot compute net worth or the own/owe composition at all.
    const totalslessReport = {
      ...reportReviewSample,
      assetPortfolio: {
        ...reportReviewSample.assetPortfolio,
        netWorthTrend: undefined,
        netWorthTarget: undefined,
        totals: reportReviewSample.assetPortfolio.totals.filter(
          (metric) =>
            metric.id !== "total_assets" && metric.id !== "total_liabilities",
        ),
      },
    };
    await page.route(
      "**/private/report-review/workspace-report",
      async (route) => {
        await route.fulfill({
          contentType: "application/json",
          json: { report: totalslessReport },
          status: 200,
        });
      },
    );

    await page.goto(`${reportReviewPath}#snapshot`);
    await expect(page.getByTestId("net-worth-chart")).toBeVisible();

    await ensureBalanceDetailsOpen(page);
    await page.getByText("Your profile inputs", { exact: true }).click();
    const profileCard = page.locator(
      'form[aria-labelledby="profile-values-heading"]',
    );
    await profileCard
      .getByRole("button", { name: "Edit Monthly take-home income" })
      .click();
    await profileCard
      .getByRole("spinbutton", { name: "Monthly take-home income" })
      .fill("5300");
    await profileCard.getByRole("button", { name: "Save profile" }).click();

    // With no totals, the hero falls back to the empty prompt — no chart and
    // no composition bar.
    await expect(page.getByTestId("money-hero-empty")).toBeVisible();
    await expect(page.getByTestId("money-hero-composition")).toHaveCount(0);
    await expect(page.getByTestId("net-worth-chart")).toHaveCount(0);
  });

  test("snapshot monthly tab supports category targets and transaction overrides", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#snapshot`);

    // The net-worth hero chart replaced the old monthly mixed chart as the
    // month selector; every month on the chart has monthly transaction detail
    // (the trend ends at the latest data month). The asset-type breakdown stays
    // as cards inside the Balance details disclosure.
    await ensureBalanceDetailsOpen(page);
    await expect(page.getByTestId("snapshot-asset-breakdown")).toBeVisible();
    await expect(page.getByTestId("snapshot-monthly-mixed-chart"))
      .toHaveCount(0);
    await expect(page.getByTestId("net-worth-chart-month")).toHaveCount(3);

    // Selecting a chart month opens the "This month's spending" disclosure that
    // holds the monthly table.
    await page.locator(
      '[data-testid="net-worth-chart-month"][data-month="2026-04"]',
    ).click();

    const monthlyTab = page.getByTestId("snapshot-monthly-tab");
    await expect(monthlyTab).toBeVisible();
    await expect(
      page.getByTestId("snapshot-expense-month-table-current")
        .getByRole("heading", { name: "Selected month (2026-04)" }),
    ).toBeVisible();

    await page.locator(
      '[data-testid="net-worth-chart-month"][data-month="2026-05"]',
    ).click();
    await expect(monthlyTab).toContainText("Income 2026-05");
    await expect(monthlyTab).toContainText("Expenses 2026-05");
    await expect(monthlyTab).toContainText("Current assets");
    const currentMonthTable = page.getByTestId(
      "snapshot-expense-month-table-current",
    );
    await expect(currentMonthTable.getByRole("heading", {
      name: "Current month (2026-05)",
    })).toBeVisible();
    await expect(
      page.getByTestId("snapshot-expense-month-table-previous")
        .getByRole("heading", { name: "Previous month (2026-04)" }),
    ).toBeVisible();

    const subscriptionsRow = currentMonthTable
      .locator(
        '[data-testid="snapshot-expense-category-row"][data-category="subscriptions"]',
      );
    await subscriptionsRow
      .getByRole("button", { name: "Edit Subscriptions target" })
      .click();
    const targetReferenceList = currentMonthTable.getByTestId(
      "snapshot-expense-target-reference-list",
    );
    await expect(targetReferenceList).toContainText("Previous");
    await expect(
      targetReferenceList.getByTestId(
        "snapshot-expense-target-reference-transaction",
      ),
    ).toHaveCount(3);
    await expect(targetReferenceList).toContainText("2026-05");
    await expect(targetReferenceList).toContainText("2026-04");
    await expect(targetReferenceList).toContainText("$15.99");
    await targetReferenceList
      .getByTestId("snapshot-expense-target-preset-fill")
      .click();
    await expect(
      subscriptionsRow.getByTestId("snapshot-expense-category-target"),
    ).toHaveValue("15.99");

    const groceriesRow = currentMonthTable
      .locator(
        '[data-testid="snapshot-expense-category-row"][data-category="groceries"]',
      );

    await expect(groceriesRow).toContainText("$130.56");
    await expect(groceriesRow).toContainText("No target");
    await groceriesRow
      .getByRole("button", { name: "Edit Groceries target" })
      .click();
    await expect(
      groceriesRow.getByTestId("snapshot-expense-category-target"),
    ).toBeVisible();
    const groceriesTargetReferenceRow = currentMonthTable.locator(
      '[data-testid="snapshot-expense-target-reference-row"][data-category="groceries"]',
    );
    await expect(groceriesTargetReferenceRow).toBeVisible();
    await expect(groceriesTargetReferenceRow).toContainText(
      "Previous monthly totals",
    );
    await expect(groceriesTargetReferenceRow).toContainText("2026-04");
    await expect(groceriesTargetReferenceRow).toContainText("$0");
    await groceriesRow
      .getByTestId("snapshot-expense-category-target")
      .fill("140");
    await expect(
      groceriesRow.getByTestId("snapshot-expense-category-target"),
    ).toHaveValue("140");
    await groceriesRow
      .getByTestId("snapshot-expense-category-target-apply")
      .click();
    await expect(groceriesRow).toContainText("$140");
    await expect(
      groceriesRow.getByTestId("snapshot-expense-category-target-value"),
    ).toHaveAttribute("data-status", "within-target");
    await expect(
      groceriesRow.getByTestId("snapshot-expense-category-target-status-cue"),
    ).toBeVisible();
    await expect(groceriesRow).not.toContainText("Within target");

    await groceriesRow
      .getByTestId("snapshot-expense-category-toggle")
      .click();
    const transactionList = currentMonthTable.getByTestId(
      "snapshot-expense-transaction-list-row",
    );
    await expect(transactionList).toBeVisible();
    await expect(
      transactionList.getByTestId("snapshot-expense-transaction-row"),
    ).toHaveCount(2);
    await expect(
      transactionList.getByTestId(
        "snapshot-expense-transaction-override-boundary",
      ),
    ).toContainText("apply only to this browser session");
    const firstCategorySelect = transactionList
      .getByTestId("snapshot-expense-transaction-category")
      .first();
    await expect(firstCategorySelect).toHaveValue("groceries");
    const firstCategorySave = transactionList
      .getByTestId("snapshot-expense-transaction-category-apply")
      .first();
    await expect(firstCategorySave).toBeDisabled();
    await firstCategorySelect.selectOption("dining");
    await expect(firstCategorySelect).toHaveValue("dining");
    await expect(firstCategorySave).toBeEnabled();
    await firstCategorySave.click();
    await expect(firstCategorySave).toBeDisabled();
    await expect(groceriesRow).toContainText("$54.12");
    const diningRow = currentMonthTable.locator(
      '[data-testid="snapshot-expense-category-row"][data-category="dining"]',
    );
    await expect(diningRow).toContainText("$92.94");
    await diningRow.getByTestId("snapshot-expense-category-toggle").click();
    await expect(
      currentMonthTable.getByTestId("snapshot-expense-transaction-list-row"),
    ).toContainText("Applied as Dining for this session");
    await expect(
      groceriesRow.getByTestId("snapshot-expense-category-target-value"),
    ).toHaveAttribute("data-status", "within-target");
    await expect(
      groceriesRow.getByTestId("snapshot-expense-category-target-status-cue"),
    ).toBeVisible();
  });

  test("goals screen priority order drives the snapshot preview", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#goals`);

    const goalRows = page.getByTestId("goal-planning-row");

    await expect(goalRows).toHaveCount(4);
    await expect(goalRows.first()).toContainText("Emergency fund");
    await expect(goalRows.first()).toContainText("Priority 1");
    await expect(goalRows.first()).toContainText("$8,000");

    await goalRows.nth(2).getByRole("button", { name: "Move up" }).click();
    await expect(goalRows.nth(1)).toContainText("Wedding fund");
    await goalRows.nth(1).getByRole("button", { name: "Move up" }).click();
    await expect(goalRows.first()).toContainText("Wedding fund");
    await expect(goalRows.first()).toContainText("Priority 1");

    await clickTab(page, "Money");

    // The goal preview lives in the Balance details Overview, collapsed by default.
    await ensureBalanceDetailsOpen(page);
    const goalPreview = page.getByTestId("snapshot-goal-preview");
    await expect(goalPreview).toBeVisible();
    await expect(goalPreview).toContainText("User priority #1");
    await expect(goalPreview).toContainText("Wedding fund");
    await expect(goalPreview).toContainText("In-session goal");
  });

  test("screen tabs support click, keyboard movement, and hash updates", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#goals`);

    // Wait for the initial hash sync to settle before switching tabs, so the
    // tab click's replaceState isn't racing hydration.
    await expect(page.getByRole("tab", { name: "Goals" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await clickTab(page, "Money");
    await expect(
      page.getByRole("heading", { name: "This month's spending" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/#money$/);

    const moneyTab = page.getByRole("tab", { name: "Money" });
    await moneyTab.focus();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Goals" })).toBeFocused();
    await expect(page.getByRole("tab", { name: "Goals" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page).toHaveURL(/#goals$/);

    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab", { name: "Money" })).toBeFocused();
    await expect(page).toHaveURL(/#money$/);

    await page.keyboard.press("End");
    await expect(page.getByRole("tab", { name: "Learn" })).toBeFocused();
    await expect(page).toHaveURL(/#learn$/);

    await page.keyboard.press("Home");
    await expect(page.getByRole("tab", { name: "Money" })).toBeFocused();
    await expect(page).toHaveURL(/#money$/);
  });

  test("charge inspector can hide one finding and restore from the banner", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#charge-inspector`);
    await ensureChargeInspectorOpen(page);

    await expect(
      page.getByTestId("charge-inspector-monthly-spending-summary"),
    ).toHaveCount(0);
    await expect(page.getByTestId("charge-inspector-category-summary"))
      .toHaveCount(0);
    await expect(
      page.getByTestId("charge-inspector-budget-automation-review-queue"),
    ).toHaveCount(0);

    const recurringBoard = page.getByTestId(
      "charge-inspector-recurring-payment-board",
    );
    await expect(recurringBoard).toBeVisible();
    await expect(recurringBoard.getByText("Streamly Premium")).toBeVisible();
    await expect(recurringBoard.getByText("3 matched rows")).toBeVisible();
    await expect(recurringBoard.getByText("Around Jun 9, 2026"))
      .toBeVisible();
    await recurringBoard.getByText("Limits").first().click();
    await expect(
      recurringBoard.getByText(
        "A recurring pattern does not mean the charge is unwanted.",
      ),
    ).toBeVisible();

    const findings = chargeInspectorFindings(page);
    await expect(findings.first()).toBeVisible();

    const initialCount = await findings.count();
    expect(initialCount).toBeGreaterThan(0);
    await expect(metricValue(page, "visible")).toHaveText(String(initialCount));
    await expect(metricValue(page, "hidden")).toHaveText("0");

    await page.getByRole("button", { name: "Hide" }).first().click();

    await expect(recurringBoard).toHaveCount(0);
    await expect(findings).toHaveCount(initialCount - 1);
    await expect(metricValue(page, "visible")).toHaveText(
      String(initialCount - 1),
    );
    await expect(metricValue(page, "hidden")).toHaveText("1");
    await expect(page.getByTestId("charge-inspector-restore-banner"))
      .toBeVisible();

    await page.getByTestId("charge-inspector-restore-banner").click();

    await expect(findings).toHaveCount(initialCount);
    await expect(metricValue(page, "visible")).toHaveText(String(initialCount));
    await expect(metricValue(page, "hidden")).toHaveText("0");
  });

  test("charge inspector reviews a user CSV in the current browser session", async ({
    page,
  }) => {
    let submittedCsv = "";
    await page.route(
      "**/private/report-review/charge-inspector-review",
      async (route) => {
        const body = route.request().postDataJSON() as { csvText: string };
        submittedCsv = body.csvText;

        await route.fulfill({
          contentType: "application/json",
          json: { review: uploadedChargeInspectorReview() },
          status: 200,
        });
      },
    );

    await page.goto(`${reportReviewPath}#charge-inspector`);
    await ensureChargeInspectorOpen(page);

    await page.getByTestId("charge-inspector-csv-file").setInputFiles({
      buffer: Buffer.from(
        [
          "Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #",
          "DEBIT,06/01/2026,Uploaded Coffee,-12.50,DEBIT_CARD,100.00,",
          "DEBIT,06/02/2026,Uploaded Cafe,-30.00,DEBIT_CARD,70.00,",
        ].join("\n"),
      ),
      mimeType: "text/csv",
      name: "checking.csv",
    });

    await page.getByRole("button", { name: "Review CSV" }).click();

    await expect(page.getByTestId("charge-inspector-csv-success"))
      .toBeVisible();
    await expect(page.getByText("Platform CSV review")).toBeVisible();
    await expect(metricValue(page, "rows")).toHaveText("2");
    await expect(
      page.getByTestId("charge-inspector-monthly-spending-summary"),
    ).toHaveCount(0);
    await expect(page.getByTestId("charge-inspector-category-summary"))
      .toHaveCount(0);
    await expect(
      page.getByTestId("charge-inspector-budget-automation-review-queue"),
    ).toHaveCount(0);
    await expect(
      page.getByTestId(
        "ai-explanation-panel-charge_inspector_monthly_spending_summary",
      ),
    ).toHaveCount(0);
    await expect(
      page.getByTestId(
        "ai-explanation-disabled-charge_inspector_monthly_spending_summary",
      ),
    ).toHaveCount(0);
    await expect(
      page.getByTestId("ai-explanation-panel-charge_inspector_category_evidence"),
    ).toHaveCount(0);
    await expect(
      page.getByTestId("ai-explanation-disabled-charge_inspector_category_evidence"),
    ).toHaveCount(0);
    await expect(
      page.getByTestId("charge-inspector-recurring-payment-board"),
    ).toHaveCount(0);
    await expect(page.getByTestId("charge-inspector-recurring-empty"))
      .toBeVisible();
    expect(submittedCsv).toContain("Uploaded Coffee");
  });

  test("charge inspector rejects oversized CSV files before upload", async ({
    page,
  }) => {
    let requestCount = 0;
    await page.route(
      "**/private/report-review/charge-inspector-review",
      async (route) => {
        requestCount += 1;

        await route.fulfill({
          contentType: "application/json",
          json: { review: uploadedChargeInspectorReview() },
          status: 200,
        });
      },
    );

    await page.goto(`${reportReviewPath}#charge-inspector`);
    await ensureChargeInspectorOpen(page);

    await page.getByTestId("charge-inspector-csv-file").setInputFiles({
      buffer: Buffer.alloc(250_001, "a"),
      mimeType: "text/csv",
      name: "too-large.csv",
    });

    await page.getByRole("button", { name: "Review CSV" }).click();

    await expect(page.getByTestId("charge-inspector-csv-error")).toHaveText(
      "CSV file must be 250,000 characters or fewer.",
    );
    expect(requestCount).toBe(0);
  });

  test("charge inspector restores after all visible findings are hidden", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#charge-inspector`);
    await ensureChargeInspectorOpen(page);

    const findings = chargeInspectorFindings(page);
    await expect(findings.first()).toBeVisible();

    const initialCount = await findings.count();
    expect(initialCount).toBeGreaterThan(0);

    for (let index = 0; index < initialCount; index += 1) {
      await page.getByRole("button", { name: "Hide" }).first().click();
    }

    await expect(page.getByTestId("charge-inspector-empty-state"))
      .toBeVisible();
    await expect(metricValue(page, "visible")).toHaveText("0");
    await expect(metricValue(page, "hidden")).toHaveText(String(initialCount));

    await page.getByTestId("charge-inspector-restore-empty").click();

    await expect(findings).toHaveCount(initialCount);
    await expect(metricValue(page, "visible")).toHaveText(String(initialCount));
    await expect(metricValue(page, "hidden")).toHaveText("0");
  });
});

function labelFor(page: Page, text: string) {
  return page
    .locator("form label")
    .filter({ hasText: new RegExp(`^${escapeRegExp(text)}\\b`) })
    .first();
}

function chargeInspectorFindings(page: Page) {
  return page.getByTestId("charge-inspector-finding");
}

// The "Report & findings" disclosure auto-opens on #report navigation via a
// reveal effect on rAF; set `open` directly so a toggling click cannot race
// that effect and close it.
async function ensureReportFindingsOpen(page: Page) {
  const details = page
    .locator("details")
    .filter({ has: page.locator("#report-findings-details") })
    .first();
  await details.waitFor();
  await details.evaluate((el: HTMLDetailsElement) => {
    el.open = true;
  });
  await expect(details).toHaveJSProperty("open", true);
}

// Charge Inspector is a Money detail disclosure. Deep-linking to
// #charge-inspector auto-opens it via a reveal effect on rAF; set `open`
// directly so a toggling click cannot race that effect and close it.
async function ensureChargeInspectorOpen(page: Page) {
  const details = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: "Charge Inspector" }) })
    .first();
  await details.waitFor();
  await details.evaluate((el: HTMLDetailsElement) => {
    el.open = true;
  });
  await expect(details).toHaveJSProperty("open", true);
}

// Balance details (asset/liability lists, profile inputs, decision details) is a
// Money detail disclosure, collapsed by default in the question-first IA. Set
// `open` directly rather than clicking the summary: legacy-hash navigation opens
// it via a reveal effect on rAF, and a toggling click can race that and close it.
async function ensureBalanceDetailsOpen(page: Page) {
  const details = page
    .locator("details")
    .filter({ has: page.locator("#portfolio") })
    .first();
  await details.waitFor();
  await details.evaluate((el: HTMLDetailsElement) => {
    el.open = true;
  });
  await expect(details).toHaveJSProperty("open", true);
}

function metricValue(page: Page, metric: "hidden" | "rows" | "visible") {
  return page
    .getByTestId(`charge-inspector-metric-${metric}`)
    .locator("dd");
}

function uploadedChargeInspectorReview() {
  return {
    dataMode: "user-csv",
    emptyState: {
      body:
        "The uploaded CSV review has no findings to display. The browser session remains temporary.",
      checks: [
        "A no-finding state does not prove every transaction is correct.",
        "The view only shows the current in-session review state.",
      ],
      title: "No visible Charge Inspector findings",
    },
    findings: [],
    categorySummary: [
      {
        category: "dining",
        creditTotalLabel: "$0.00",
        creditTransactionCount: 0,
        debitTotalLabel: "$42.50",
        debitTransactionCount: 2,
        evidenceRows: [
          {
            amountLabel: "$12.50",
            directionLabel: "Debit",
            id: "uploaded-dining-1",
            merchantName: "Uploaded Coffee",
            postedDate: "2026-06-01",
            ruleId: "category.dining.coffee.v0",
          },
          {
            amountLabel: "$30.00",
            directionLabel: "Debit",
            id: "uploaded-dining-2",
            merchantName: "Uploaded Cafe",
            postedDate: "2026-06-02",
            ruleId: "category.dining.coffee.v0",
          },
        ],
        label: "Dining",
        limitations: [
          "Category mapping uses deterministic merchant and transaction-type text rules only.",
        ],
        ruleIds: ["category.dining.coffee.v0"],
        transactionCount: 2,
      },
    ],
    categorySummaryVersion: "transaction_category_rules_v0",
    categoryMonthlySummary: [
      {
        category: "dining",
        creditTotalCents: 0,
        creditTotalLabel: "$0.00",
        creditTransactionCount: 0,
        debitTotalCents: 4250,
        debitTotalLabel: "$42.50",
        debitTransactionCount: 2,
        label: "Dining",
        limitations: [
          "Category monthly summary groups deterministic category totals by posted-date month.",
        ],
        month: "2026-06",
        ruleIds: ["category.dining.coffee.v0"],
        transactionCount: 2,
      },
    ],
    categoryMonthlySummaryVersion: "transaction_category_monthly_summary_v0",
    categoryMonthlyBudgetComparison: [],
    categoryMonthlyBudgetComparisonVersion:
      "transaction_category_monthly_budget_comparison_v1",
    limitations: [
      "This review uses only the uploaded CSV rows for the current request.",
      "No account connection, continuous monitoring, or stored transaction history is introduced.",
    ],
    monthlySpendingSummary: [
      {
        creditTotalLabel: "$0.00",
        creditTransactionCount: 0,
        debitTotalLabel: "$42.50",
        debitTransactionCount: 2,
        month: "2026-06",
        netCashFlowLabel: "$42.50 outflow",
        transactionCount: 2,
      },
    ],
    reviewedTransactionCount: 2,
    sourceLabel: "Platform CSV review",
    spendingSummaryVersion: "monthly_spending_summary_v0",
  };
}

async function expectNoPageHorizontalOverflow(page: Page, screen: string) {
  const overflow = await page.evaluate(() => {
    const documentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    );
    const viewportWidth = document.documentElement.clientWidth;

    return {
      documentWidth,
      overflowBy: documentWidth - viewportWidth,
      viewportWidth,
    };
  });

  expect(
    overflow.documentWidth,
    `${screen} overflows the viewport by ${overflow.overflowBy}px`,
  ).toBeLessThanOrEqual(overflow.viewportWidth + 1);
}

async function clickTab(page: Page, name: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const tab = page.getByRole("tab", { name });

    try {
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
      await expect(page.getByRole("tab", { name })).toHaveAttribute(
        "aria-selected",
        "true",
        { timeout: 1_000 },
      );
      return;
    } catch {
      await page.waitForTimeout(50);
    }
  }

  const tab = page.getByRole("tab", { name });
  await tab.focus();
  await page.keyboard.press("Enter");
  await expect(tab).toHaveAttribute("aria-selected", "true");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
