import { defineConfig, devices } from "@playwright/test";

const reportReviewAiEnabled =
  process.env.LITTLESEED_REPORT_REVIEW_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_LITTLESEED_REPORT_REVIEW_AI_ENABLED === "true";
const port =
  process.env.PLAYWRIGHT_PORT ?? (reportReviewAiEnabled ? "3101" : "3100");
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: process.env.CI
    ? [["dot"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        reuseExistingServer: !process.env.CI && !reportReviewAiEnabled,
        timeout: 120_000,
        url: baseURL,
      },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
