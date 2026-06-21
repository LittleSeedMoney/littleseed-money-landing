import { expect, type Page, test } from "@playwright/test";

import { reportReviewSample } from "../../data/report-review-sample";

const reportReviewPath = "/private/report-review";

const smokeScreens = [
  {
    hash: "snapshot",
    heading: "Current portfolio snapshot",
    tab: "Snapshot",
  },
  {
    hash: "report",
    heading: "Financial health report review",
    tab: "Report",
  },
  {
    hash: "charge-inspector",
    heading: "Charge Inspector",
    tab: "Charge Inspector",
  },
  {
    hash: "education",
    heading: "Education topics",
    tab: "Education",
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

      const panel = page.locator(`#report-review-screen-${screen.hash}`);

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

  test("legacy input and portfolio links open the snapshot screen", async ({
    page,
  }) => {
    for (const legacyHash of ["inputs", "manual-input", "portfolio"]) {
      await page.goto(`${reportReviewPath}#${legacyHash}`);

      const panel = page.locator("#report-review-screen-snapshot");

      await expect(panel).toBeVisible();
      await expect(
        panel.getByRole("heading", {
          exact: true,
          name: "Current portfolio snapshot",
        }),
      ).toBeVisible();
      await expect(page.getByRole("tab", { name: "Snapshot" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(page).toHaveURL(new RegExp(`#${legacyHash}$`));
    }
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

    await page.route("**/private/report-review/workspace-report", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: { report: reportWithLinkedAccounts },
        status: 200,
      });
    });

    await page.goto(`${reportReviewPath}#snapshot`);

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
    await expect(
      assetsSection.getByRole("button", { name: "Edit Linked savings account" }),
    ).toHaveCount(0);
    await expect(liabilitiesSection.getByText("Linked auto loan")).toBeVisible();
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

  test("screen tabs support click, keyboard movement, and hash updates", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#report`);

    await clickTab(page, "Snapshot");
    await expect(
      page.getByRole("heading", { name: "Current portfolio snapshot" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/#snapshot$/);

    await clickTab(page, "Report");
    const reportTab = page.getByRole("tab", { name: "Report" });
    await reportTab.focus();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Charge Inspector" }))
      .toBeFocused();
    await expect(
      page.getByRole("tab", { name: "Charge Inspector" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(page).toHaveURL(/#charge-inspector$/);

    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab", { name: "Report" })).toBeFocused();
    await expect(page).toHaveURL(/#report$/);

    await page.keyboard.press("Home");
    await expect(page.getByRole("tab", { name: "Snapshot" })).toBeFocused();
    await expect(page).toHaveURL(/#snapshot$/);

    await page.keyboard.press("End");
    await expect(page.getByRole("tab", { name: "Education" })).toBeFocused();
    await expect(page).toHaveURL(/#education$/);
  });

  test("charge inspector can hide one finding and restore from the banner", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#charge-inspector`);

    const findings = chargeInspectorFindings(page);
    await expect(findings.first()).toBeVisible();

    const initialCount = await findings.count();
    expect(initialCount).toBeGreaterThan(0);
    await expect(metricValue(page, "visible")).toHaveText(String(initialCount));
    await expect(metricValue(page, "hidden")).toHaveText("0");

    await page.getByRole("button", { name: "Hide" }).first().click();

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

  test("charge inspector restores after all visible findings are hidden", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#charge-inspector`);

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

function metricValue(page: Page, metric: "hidden" | "visible") {
  return page
    .getByTestId(`charge-inspector-metric-${metric}`)
    .locator("dd");
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
  const tab = page.getByRole("tab", { name });
  await tab.scrollIntoViewIfNeeded();
  await tab.click();

  try {
    await expect(tab).toHaveAttribute("aria-selected", "true", {
      timeout: 1_000,
    });
  } catch {
    await tab.focus();
    await page.keyboard.press("Enter");
    await expect(tab).toHaveAttribute("aria-selected", "true");
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
