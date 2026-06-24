const {
  runReportReviewAiEvalSuite,
} = require("../lib/report-review/ai/eval-harness.ts");

const providerMode =
  process.env.LITTLESEED_REPORT_REVIEW_AI_EVAL_PROVIDER === "openai"
    ? "openai"
    : "fixture";

runReportReviewAiEvalSuite({ providerMode })
  .then((summary) => {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

    if (summary.failed > 0) {
      process.exitCode = 1;
    }
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
