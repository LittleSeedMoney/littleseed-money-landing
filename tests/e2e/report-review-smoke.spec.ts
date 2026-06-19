import { expect, type Page, test } from "@playwright/test";

const reportReviewPath = "/private/report-review";

const smokeScreens = [
  {
    hash: "inputs",
    heading: "Manual review inputs",
    tab: "Inputs",
  },
  {
    hash: "report",
    heading: "Financial health report review",
    tab: "Report",
  },
  {
    hash: "portfolio",
    heading: "Personal asset portfolio",
    tab: "Portfolio",
  },
  {
    hash: "charge-inspector",
    heading: "Charge Inspector",
    tab: "Charge Inspector",
  },
] as const;

const requiredManualFields = [
  { control: "input", label: "Age" },
  { control: "input", label: "Monthly take-home income" },
  { control: "select", label: "Income pattern" },
  { control: "input", label: "Monthly housing cost" },
  { control: "input", label: "Other monthly essentials" },
  { control: "input", label: "Monthly discretionary expenses" },
  { control: "input", label: "Monthly investing contribution" },
  { control: "select", label: "Job stability" },
  { control: "select", label: "Risk tolerance" },
  { control: "input", label: "Expected years in current location" },
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

  test("manual inputs expose visible required markers and native required controls", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#inputs`);

    await expect(
      page.getByText("Fields marked * build the request"),
    ).toBeVisible();

    for (const field of requiredManualFields) {
      const label = labelFor(page, field.label);

      await expect(label).toContainText("*");
      await expect(label.locator(field.control)).toHaveAttribute("required", "");
    }

    const optionalIncome = labelFor(page, "Gross annual income");
    await expect(optionalIncome).not.toContainText("*");
    await expect(optionalIncome.locator("input")).not.toHaveAttribute(
      "required",
      "",
    );

    await page.getByRole("button", { name: "Add liability" }).click();

    const conditionalLiability = page
      .locator("form label")
      .filter({ hasText: /^Liability name\b/ })
      .last();
    await expect(conditionalLiability).toContainText("* if balance > 0");
    await expect(conditionalLiability.locator("input")).not.toHaveAttribute(
      "required",
      "",
    );
  });

  test("screen tabs support click, keyboard movement, and hash updates", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#report`);

    await clickTab(page, "Inputs");
    await expect(page.getByRole("heading", { name: "Manual review inputs" }))
      .toBeVisible();
    await expect(page).toHaveURL(/#inputs$/);

    await clickTab(page, "Report");
    const reportTab = page.getByRole("tab", { name: "Report" });
    await reportTab.focus();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Portfolio" })).toBeFocused();
    await expect(page.getByRole("tab", { name: "Portfolio" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page).toHaveURL(/#portfolio$/);

    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab", { name: "Report" })).toBeFocused();
    await expect(page).toHaveURL(/#report$/);

    await page.keyboard.press("Home");
    await expect(page.getByRole("tab", { name: "Inputs" })).toBeFocused();
    await expect(page).toHaveURL(/#inputs$/);

    await page.keyboard.press("End");
    await expect(page.getByRole("tab", { name: "Education" })).toBeFocused();
    await expect(page).toHaveURL(/#education$/);
  });

  test("charge inspector can hide one finding and restore from the banner", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#charge-inspector`);

    const findings = chargeInspectorFindings(page);
    await expect(findings).toHaveCount(4);
    await expect(metricValue(page, "visible")).toHaveText("4");
    await expect(metricValue(page, "hidden")).toHaveText("0");

    await page.getByRole("button", { name: "Hide" }).first().click();

    await expect(findings).toHaveCount(3);
    await expect(metricValue(page, "visible")).toHaveText("3");
    await expect(metricValue(page, "hidden")).toHaveText("1");
    await expect(page.getByTestId("charge-inspector-restore-banner"))
      .toBeVisible();

    await page.getByTestId("charge-inspector-restore-banner").click();

    await expect(findings).toHaveCount(4);
    await expect(metricValue(page, "visible")).toHaveText("4");
    await expect(metricValue(page, "hidden")).toHaveText("0");
  });

  test("charge inspector restores after all visible findings are hidden", async ({
    page,
  }) => {
    await page.goto(`${reportReviewPath}#charge-inspector`);

    for (const _ of [0, 1, 2, 3]) {
      await page.getByRole("button", { name: "Hide" }).first().click();
    }

    await expect(page.getByTestId("charge-inspector-empty-state"))
      .toBeVisible();
    await expect(metricValue(page, "visible")).toHaveText("0");
    await expect(metricValue(page, "hidden")).toHaveText("4");

    await page.getByTestId("charge-inspector-restore-empty").click();

    await expect(chargeInspectorFindings(page)).toHaveCount(4);
    await expect(metricValue(page, "visible")).toHaveText("4");
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
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
