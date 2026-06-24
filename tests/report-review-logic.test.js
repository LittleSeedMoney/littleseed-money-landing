const assert = require("node:assert/strict");
const test = require("node:test");

const {
  MANUAL_PROFILE_FIELD_REQUIREMENTS,
  MANUAL_PROFILE_PRESETS,
  OPTIONAL_DECIMAL_FIELDS,
  OPTIONAL_INTEGER_FIELDS,
  OPTIONAL_POSITIVE_DECIMAL_FIELDS,
  REQUIRED_DECIMAL_FIELDS,
  REQUIRED_INTEGER_FIELDS,
  REQUIRED_SELECT_FIELDS,
  buildManualProfileRequest,
  defaultManualProfileValues,
  manualProfilePresetValues,
  ManualProfileValidationError,
} = require("../lib/report-review/manual-profile.ts");
const {
  reportReviewSample,
} = require("../data/report-review-sample.ts");
const {
  REPORT_REVIEW_VALIDATION_CHECKLIST,
} = require("../lib/report-review/validation-checklist.ts");
const {
  chargeInspectorEmptyReview,
  chargeInspectorFallbackReview,
  chargeInspectorFindingTypeLabels,
  chargeInspectorSampleReview,
  isChargeInspectorEmpty,
  mapPlatformChargeInspectorReview,
  summarizeChargeInspectorReview,
  visibleChargeInspectorFindings,
} = require("../lib/report-review/charge-inspector.ts");
const {
  chargeInspectorSampleCsv,
} = require("../lib/report-review/charge-inspector-sample-csv.ts");
const {
  parseChargeInspectorReviewResponse,
} = require("../lib/report-review/platform-charge-inspector-response.ts");
const {
  parseWorkspaceReportResponse,
} = require("../lib/report-review/platform-workspace-response.ts");
const {
  mapPlatformReport,
} = require("../lib/report-review/platform-report.ts");
const {
  educationTopicAnchor,
  resolveEducationTopic,
  uniqueTopicIds,
} = require("../lib/report-review/education-topics.ts");
const {
  calculateSavingGoalDraft,
  defaultSavingGoalDraftValues,
  formatSavingGoalDraftMoney,
} = require("../lib/report-review/saving-goal-draft.ts");
const {
  approvedKnowledgeArtifactIdsForFinding,
  buildFindingContextPack,
} = require("../lib/report-review/ai/context-pack.ts");
const {
  approvedKnowledgeArtifacts,
} = require("../lib/report-review/ai/knowledge-artifacts.ts");
const {
  parseReportReviewAiDraft,
} = require("../lib/report-review/ai/provider.ts");
const {
  loadReportReviewAiEvalCases,
  runReportReviewAiEvalSuite,
} = require("../lib/report-review/ai/eval-harness.ts");
const {
  explainReportReviewFinding,
  parseReportReviewAiRequest,
  ReportReviewAiRequestError,
} = require("../lib/report-review/ai/report-review-ai.ts");
const {
  reportReviewScreenFromKeyboard,
  reportReviewScreenFromHash,
  reportReviewScreens,
} = require("../lib/report-review/report-review-screens.ts");
const {
  joinClasses,
} = require("../components/report-review/class-names.ts");

function classListIncludes(className, token) {
  return className.split(/\s+/).includes(token);
}

test("manual profile omits blank user target months", () => {
  const values = defaultManualProfileValues();

  const request = buildManualProfileRequest(values);

  assert.equal(request.userTargetMonths, undefined);
  assert.equal(request.profile.monthly_take_home_income, "5200.00");
});

test("report review class names resolve Tailwind utility conflicts", () => {
  const className = joinClasses(
    "rounded-lg border border-stone-200 bg-white shadow-sm",
    "rounded-md border-seed-300 p-3 shadow-none",
  );

  assert.equal(classListIncludes(className, "rounded-lg"), false);
  assert.equal(classListIncludes(className, "rounded-md"), true);
  assert.equal(classListIncludes(className, "border-stone-200"), false);
  assert.equal(classListIncludes(className, "border-seed-300"), true);
  assert.equal(classListIncludes(className, "shadow-sm"), false);
  assert.equal(classListIncludes(className, "shadow-none"), true);
});

test("report-review AI context pack stays bounded to the selected finding", () => {
  const finding = reportReviewSample.findings[0];
  const contextPack = buildFindingContextPack({
    targetId: finding.id,
  });

  assert.equal(contextPack.version, "coach_context_pack.v0");
  assert.equal(contextPack.authority, "server");
  assert.equal(contextPack.target.id, finding.id);
  assert.deepEqual(contextPack.finding.evidenceSourceIds, finding.evidenceSourceIds);
  assert.ok(contextPack.allowedQuestionTypes.includes("follow_up"));
  assert.deepEqual(
    contextPack.knowledgeArtifacts.map((artifact) => artifact.id),
    ["knowledge.debt_cost_context.v0"],
  );
  assert.ok(contextPack.excludedData.includes("raw transaction rows"));
  assert.ok(contextPack.excludedData.includes("saved AI conversation history"));
  assert.equal(contextPack.versions.corpus, "knowledge_corpus.fixture.v0");
  assert.equal(
    contextPack.versions.sourceMap,
    "report_review_context_source_map.v0",
  );
});

test("report-review AI approved corpus loader reads collector-shaped JSONL", () => {
  const artifacts = approvedKnowledgeArtifacts({
    artifactIds: ["knowledge.debt_cost_context.v0"],
  });

  assert.equal(artifacts.length, 1);
  assert.equal(artifacts[0].id, "knowledge.debt_cost_context.v0");
  assert.equal(artifacts[0].reviewStatus, "approved");
  assert.equal(artifacts[0].sourcePath.endsWith(".jsonl"), true);
  assert.ok(artifacts[0].prohibitedUses.length > 0);
});

test("report-review AI source map covers every approved corpus artifact", () => {
  const mappedArtifactIds = new Set();

  for (const finding of reportReviewSample.findings) {
    const artifactIds = approvedKnowledgeArtifactIdsForFinding(finding.id);
    assert.ok(artifactIds.length > 0);

    const artifacts = approvedKnowledgeArtifacts({ artifactIds });
    assert.deepEqual(
      artifacts.map((artifact) => artifact.id),
      artifactIds,
    );

    for (const artifactId of artifactIds) {
      mappedArtifactIds.add(artifactId);
    }
  }

  assert.deepEqual(
    approvedKnowledgeArtifacts()
      .map((artifact) => artifact.id)
      .sort(),
    [...mappedArtifactIds].sort(),
  );
});

test("report-review AI source map fails closed for unmapped targets", () => {
  assert.throws(
    () => approvedKnowledgeArtifactIdsForFinding("unmapped-finding"),
    /No approved knowledge artifacts are mapped/,
  );
});

test("report-review AI request parser rejects client-supplied context", () => {
  const finding = reportReviewSample.findings[0];

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        evidenceSources: reportReviewSample.evidenceSources,
        finding,
        questionType: "explain_finding",
        surface: "report_review",
        targetId: finding.id,
        targetType: "finding",
        userMessage: null,
      }),
    /evidenceSources must not be supplied/,
  );
});

test("report-review AI request parser rejects raw data leakage", () => {
  const finding = reportReviewSample.findings[0];

  assert.throws(
    () =>
      parseReportReviewAiRequest({
        questionType: "explain_finding",
        rawTransactions: [{ amount: "12.00", merchant: "Example" }],
        surface: "report_review",
        targetId: finding.id,
        targetType: "finding",
        userMessage: null,
      }),
    /rawTransactions must not be supplied/,
  );
});

test("report-review AI request parser accepts target-only payload", () => {
  const finding = reportReviewSample.findings[0];

  const request = parseReportReviewAiRequest({
    questionType: "explain_finding",
    surface: "report_review",
    targetId: finding.id,
    targetType: "finding",
    userMessage: null,
  });

  assert.equal(request.targetId, finding.id);
  assert.equal(request.questionType, "explain_finding");
});

test("report-review AI explanation rejects unsupported targets", async () => {
  await assert.rejects(
    () =>
      explainReportReviewFinding({
        questionType: "explain_finding",
        surface: "report_review",
        targetId: "unsupported-finding",
        targetType: "finding",
        userMessage: null,
      }),
    /targetId is not supported/,
  );
});

test("report-review AI explanation returns validated fixture answer", async () => {
  const finding = reportReviewSample.findings[0];
  const answer = await explainReportReviewFinding({
    questionType: "explain_finding",
    surface: "report_review",
    targetId: finding.id,
    targetType: "finding",
    userMessage: null,
  });

  assert.equal(answer.validation.status, "passed");
  assert.equal(answer.validation.fallbackUsed, false);
  assert.equal(answer.versions.contextPack, "coach_context_pack.v0");
  assert.equal(answer.versions.prompt, "report_review_explain.v0");
  assert.equal(answer.sources.some((source) => source.id === finding.id), true);
  assert.doesNotMatch(answer.answer, /you should/i);
});

test("report-review AI missing-context answers validate across findings", async () => {
  for (const finding of reportReviewSample.findings) {
    const answer = await explainReportReviewFinding({
      questionType: "missing_context",
      surface: "report_review",
      targetId: finding.id,
      targetType: "finding",
      userMessage: null,
    });

    assert.equal(answer.validation.status, "passed", finding.id);
    assert.equal(answer.validation.fallbackUsed, false, finding.id);
    assert.doesNotMatch(answer.answer, /tax treatment/i);
  }
});

test("report-review AI follow-up allows non-advisory hold phrasing", async () => {
  const finding = reportReviewSample.findings[0];
  const answer = await explainReportReviewFinding({
    questionType: "follow_up",
    surface: "report_review",
    targetId: finding.id,
    targetType: "finding",
    userMessage: "Does this still hold if income changes?",
  });

  assert.equal(answer.validation.status, "passed");
  assert.equal(answer.validation.fallbackUsed, false);
  assert.doesNotMatch(answer.answer, /income changes/i);
});

test("report-review AI follow-up refuses action ranking requests", async () => {
  const finding = reportReviewSample.findings[0];
  const answer = await explainReportReviewFinding({
    questionType: "follow_up",
    surface: "report_review",
    targetId: finding.id,
    targetType: "finding",
    userMessage: "What should I do first and can you rank the actions?",
  });

  assert.equal(answer.validation.status, "fallback");
  assert.equal(answer.validation.fallbackUsed, true);
  assert.match(answer.answer, /cannot answer/i);
  assert.match(answer.limitations.join(" "), /not investment, tax, legal/i);
});

test("report-review AI provider draft parser rejects malformed output", () => {
  assert.throws(
    () =>
      parseReportReviewAiDraft({
        answer: "Missing structured arrays.",
        evidence: [],
        limitations: [],
        sources: [{ id: "bad", title: "Bad", type: "unsupported" }],
      }),
    /supported source type/,
  );
});

test("report-review AI eval harness passes deterministic fixture cases", async () => {
  const summary = await runReportReviewAiEvalSuite({ providerMode: "fixture" });

  assert.equal(summary.suiteVersion, "report_review_ai_eval.v0");
  assert.equal(summary.failed, 0);
  assert.equal(summary.passed, summary.total);
  assert.ok(summary.total >= 10);
  assert.ok(
    summary.results.some(
      (result) =>
        result.id === "validator_rejects_action_ranking_answer" &&
        result.validation.status === "fallback",
    ),
  );
  assert.equal(JSON.stringify(summary).includes("You should pay this debt"), false);
});

test("report-review AI eval cases cover required boundary categories", () => {
  const cases = loadReportReviewAiEvalCases();
  const caseIds = new Set(cases.map((testCase) => testCase.id));

  assert.ok(caseIds.has("allowed_explain_finding"));
  assert.ok(caseIds.has("allowed_bounded_follow_up"));
  assert.ok(caseIds.has("refuses_action_ranking_follow_up"));
  assert.ok(caseIds.has("refuses_llm_calculation_follow_up"));
  assert.ok(caseIds.has("refuses_tax_legal_product_follow_up"));
  assert.ok(caseIds.has("rejects_raw_transaction_context"));
  assert.ok(caseIds.has("validator_rejects_missing_evidence"));
});

test("saving goal draft calculates the baseline arithmetic", () => {
  const summary = calculateSavingGoalDraft(defaultSavingGoalDraftValues());

  assert.equal(summary.goalName, "Emergency reserve top-up");
  assert.equal(summary.remainingAmount, 3000);
  assert.equal(summary.progressPercent, 80);
  assert.equal(summary.monthsAtCurrentContribution, 6);
  assert.equal(summary.monthlyNeededForTarget, 500);
  assert.equal(summary.status, "pace_fits_horizon");
  assert.equal(summary.statusLabel, "Pace fits entered horizon");
});

test("saving goal draft keeps blank target horizon missing", () => {
  const values = defaultSavingGoalDraftValues();
  values.targetMonths = "";

  const summary = calculateSavingGoalDraft(values);

  assert.equal(summary.targetMonths, null);
  assert.equal(summary.monthlyNeededForTarget, null);
  assert.equal(summary.status, "estimate_only");
  assert.deepEqual(summary.validationMessages, []);
});

test("saving goal draft caps progress when current savings exceed target", () => {
  const values = defaultSavingGoalDraftValues();
  values.currentSaved = "16000.00";

  const summary = calculateSavingGoalDraft(values);

  assert.equal(summary.remainingAmount, 0);
  assert.equal(summary.progressPercent, 100);
  assert.equal(summary.monthsAtCurrentContribution, 0);
  assert.equal(summary.monthlyNeededForTarget, 0);
  assert.equal(summary.status, "reached");
});

test("saving goal draft treats zero contribution as horizon-only context", () => {
  const values = defaultSavingGoalDraftValues();
  values.monthlyContribution = "0";

  const summary = calculateSavingGoalDraft(values);

  assert.equal(summary.monthsAtCurrentContribution, null);
  assert.equal(summary.monthlyNeededForTarget, 500);
  assert.equal(summary.status, "horizon_only");
});

test("saving goal draft requires contribution or horizon when both are absent", () => {
  const values = defaultSavingGoalDraftValues();
  values.monthlyContribution = "0";
  values.targetMonths = "";

  const summary = calculateSavingGoalDraft(values);

  assert.equal(summary.status, "needs_contribution_or_horizon");
  assert.equal(summary.monthsAtCurrentContribution, null);
  assert.equal(summary.monthlyNeededForTarget, null);
  assert.deepEqual(summary.validationMessages, []);
});

test("saving goal draft rejects a non-positive target amount", () => {
  const values = defaultSavingGoalDraftValues();
  values.targetAmount = "0";

  const summary = calculateSavingGoalDraft(values);

  assert.equal(summary.status, "needs_target");
  assert.equal(summary.remainingAmount, null);
  assert.match(summary.validationMessages.join(" "), /greater than 0/);
});

test("saving goal draft rejects an invalid optional horizon", () => {
  const values = defaultSavingGoalDraftValues();
  values.targetMonths = "0";

  const summary = calculateSavingGoalDraft(values);

  assert.equal(summary.status, "invalid_input");
  assert.equal(summary.monthlyNeededForTarget, null);
  assert.match(summary.validationMessages.join(" "), /Target horizon/);
});

test("saving goal draft money formatting preserves entered cents", () => {
  assert.equal(formatSavingGoalDraftMoney(3000), "$3,000");
  assert.equal(formatSavingGoalDraftMoney(3000.5), "$3,000.50");
  assert.equal(formatSavingGoalDraftMoney(750.125), "$750.13");
  assert.equal(formatSavingGoalDraftMoney(null), "Missing");
});

test("saving goal draft stays inside the product boundary", () => {
  const summary = calculateSavingGoalDraft(defaultSavingGoalDraftValues());
  const copy = [...summary.assumptions, ...summary.limitations].join(" ");

  assert.match(copy, /in-session draft/);
  assert.match(copy, /No bank connection/);
  assert.match(copy, /Does not compare this goal/);
  assert.doesNotMatch(copy, /you should/i);
  assert.doesNotMatch(copy, /credit card/i);
});

test("charge inspector sample covers every current finding type", () => {
  const summary = summarizeChargeInspectorReview(chargeInspectorSampleReview);

  assert.equal(summary.reviewedTransactionCount, 18);
  assert.equal(summary.totalFindings, 4);
  assert.equal(summary.recurringCount, 1);
  assert.equal(summary.duplicateCount, 1);
  assert.equal(summary.bankFeeCount, 1);
  assert.equal(summary.priceIncreaseCount, 1);
  assert.deepEqual(
    chargeInspectorSampleReview.findings.map((finding) => finding.type).sort(),
    Object.keys(chargeInspectorFindingTypeLabels).sort(),
  );
});

test("charge inspector sample CSV keeps the platform contract fixture shape", () => {
  const rows = chargeInspectorSampleCsv.split("\n");

  assert.equal(rows.length, 19);
  assert.match(rows[0], /Posting Date,Description,Amount/);
  assert.match(chargeInspectorSampleCsv, /Streamly Premium/);
  assert.match(chargeInspectorSampleCsv, /Market Street Coffee/);
  assert.match(chargeInspectorSampleCsv, /Monthly Service Fee/);
  assert.match(chargeInspectorSampleCsv, /FitPlan App/);
});

test("charge inspector platform parser accepts the review contract", () => {
  const parsed = parseChargeInspectorReviewResponse(
    chargeInspectorPlatformPayload(),
  );

  assert.equal(parsed.schema_version, "charge_inspector_review_v0");
  assert.equal(parsed.source, "sample_csv");
  assert.equal(parsed.reviewed_transaction_count, 18);
  assert.equal(parsed.findings.recurring_charges[0].merchant_name, "Streamly Premium");
  assert.equal(parsed.evidence_transactions.length, 8);
});

test("charge inspector platform mapper builds UI findings from contract evidence", () => {
  const review = mapPlatformChargeInspectorReview(
    parseChargeInspectorReviewResponse(chargeInspectorPlatformPayload()),
  );
  const summary = summarizeChargeInspectorReview(review);

  assert.equal(review.dataMode, "platform-sample");
  assert.equal(review.sourceLabel, "Platform sample CSV review");
  assert.deepEqual(summary, {
    totalFindings: 4,
    reviewedTransactionCount: 18,
    recurringCount: 1,
    duplicateCount: 1,
    bankFeeCount: 1,
    priceIncreaseCount: 1,
  });
  assert.deepEqual(
    review.findings.map((finding) => finding.type).sort(),
    Object.keys(chargeInspectorFindingTypeLabels).sort(),
  );
  assert.deepEqual(
    review.findings.find((finding) => finding.type === "price_increase")
      .evidenceRows.map((row) => row.postedDate),
    ["2026-04-21", "2026-05-21"],
  );
  assert.match(review.limitations.join(" "), /charge_inspector_review_v0/);
});

test("charge inspector maps linked-account and mixed platform sources", () => {
  for (const { source, mode, label } of [
    {
      source: "linked_account",
      mode: "linked-account",
      label: "Platform linked transaction review",
    },
    {
      source: "mixed",
      mode: "mixed",
      label: "Platform mixed transaction review",
    },
  ]) {
    const payload = chargeInspectorPlatformPayload();
    payload.source = source;

    const review = mapPlatformChargeInspectorReview(
      parseChargeInspectorReviewResponse(payload),
    );

    assert.equal(review.dataMode, mode);
    assert.equal(review.sourceLabel, label);
  }
});

test("charge inspector recurring explanation uses the platform cadence", () => {
  const payload = chargeInspectorPlatformPayload();
  payload.findings.recurring_charges[0].cadence = "weekly";

  const review = mapPlatformChargeInspectorReview(
    parseChargeInspectorReviewResponse(payload),
  );
  const recurring = review.findings.find(
    (finding) => finding.type === "recurring_charge",
  );

  assert.equal(recurring.cadenceLabel, "Weekly");
  assert.match(recurring.explanation, /3 weekly rows/);
  assert.doesNotMatch(recurring.explanation, /monthly debit rows/);
});

test("charge inspector findings can be hidden without mutating the review", () => {
  const firstFindingId = chargeInspectorSampleReview.findings[0].id;
  const visibleFindings = visibleChargeInspectorFindings(
    chargeInspectorSampleReview,
    [firstFindingId],
  );

  assert.equal(visibleFindings.length, 3);
  assert.equal(
    visibleFindings.some((finding) => finding.id === firstFindingId),
    false,
  );
  assert.equal(chargeInspectorSampleReview.findings.length, 4);
});

test("charge inspector empty review keeps a safe no-finding state", () => {
  const summary = summarizeChargeInspectorReview(chargeInspectorEmptyReview);

  assert.equal(isChargeInspectorEmpty(chargeInspectorEmptyReview), true);
  assert.deepEqual(summary, {
    totalFindings: 0,
    reviewedTransactionCount: 0,
    recurringCount: 0,
    duplicateCount: 0,
    bankFeeCount: 0,
    priceIncreaseCount: 0,
  });
  assert.deepEqual(
    visibleChargeInspectorFindings(chargeInspectorSampleReview, [
      ...chargeInspectorSampleReview.findings.map((finding) => finding.id),
    ]),
    [],
  );
  assert.match(
    chargeInspectorEmptyReview.emptyState.body,
    /No transaction upload/,
  );
  assert.match(
    chargeInspectorEmptyReview.emptyState.checks.join(" "),
    /does not prove every transaction is correct/,
  );
});

test("charge inspector fallback review is distinct from a no-finding review", () => {
  const summary = summarizeChargeInspectorReview(chargeInspectorFallbackReview);

  assert.equal(isChargeInspectorEmpty(chargeInspectorFallbackReview), true);
  assert.equal(chargeInspectorFallbackReview.dataMode, "fallback");
  assert.equal(
    chargeInspectorFallbackReview.sourceLabel,
    "Charge Inspector temporarily unavailable",
  );
  assert.deepEqual(summary, {
    totalFindings: 0,
    reviewedTransactionCount: 0,
    recurringCount: 0,
    duplicateCount: 0,
    bankFeeCount: 0,
    priceIncreaseCount: 0,
  });
  assert.match(
    chargeInspectorFallbackReview.emptyState.body,
    /unavailable for this session/,
  );
  assert.match(
    chargeInspectorFallbackReview.emptyState.checks.join(" "),
    /does not mean a transaction review found no issues/,
  );
});

test("charge inspector copy stays inside review-only boundaries", () => {
  const copy = [
    chargeInspectorSampleReview.sourceLabel,
    ...chargeInspectorSampleReview.limitations,
    chargeInspectorSampleReview.emptyState.title,
    chargeInspectorSampleReview.emptyState.body,
    ...chargeInspectorSampleReview.emptyState.checks,
    chargeInspectorFallbackReview.sourceLabel,
    ...chargeInspectorFallbackReview.limitations,
    chargeInspectorFallbackReview.emptyState.title,
    chargeInspectorFallbackReview.emptyState.body,
    ...chargeInspectorFallbackReview.emptyState.checks,
    ...chargeInspectorSampleReview.findings.flatMap((finding) => [
      finding.title,
      finding.summary,
      finding.explanation,
      ...finding.limitations,
      ...finding.suggestedReviewSteps,
      ...finding.evidenceRows.flatMap((row) => [
        row.merchantName,
        row.detail,
      ]),
    ]),
  ].join(" ");

  assert.match(copy, /review prompts/);
  assert.match(copy, /No account connection/);
  assert.doesNotMatch(
    copy,
    /\b(definitely|wasteful|cancel|dispute|guaranteed|you should)\b/i,
  );
});

test("report review screen hash mapping preserves legacy section links", () => {
  assert.deepEqual(
    reportReviewScreens.map((screen) => screen.id),
    ["snapshot", "report", "charge-inspector", "education"],
  );
  assert.equal(reportReviewScreenFromHash("#snapshot"), "snapshot");
  assert.equal(reportReviewScreenFromHash("#inputs"), "snapshot");
  assert.equal(reportReviewScreenFromHash("#manual-input"), "snapshot");
  assert.equal(reportReviewScreenFromHash("#findings"), "report");
  assert.equal(reportReviewScreenFromHash("#portfolio"), "snapshot");
  assert.equal(reportReviewScreenFromHash("#saving-goal-draft"), "snapshot");
  assert.equal(reportReviewScreenFromHash("#charge-inspector"), "charge-inspector");
  assert.equal(reportReviewScreenFromHash("#evidence"), "education");
  assert.equal(reportReviewScreenFromHash("#unknown"), "report");
});

test("report review keyboard navigation follows the tab order", () => {
  assert.equal(
    reportReviewScreenFromKeyboard("report", "ArrowRight"),
    "charge-inspector",
  );
  assert.equal(reportReviewScreenFromKeyboard("report", "ArrowLeft"), "snapshot");
  assert.equal(
    reportReviewScreenFromKeyboard("education", "ArrowRight"),
    "snapshot",
  );
  assert.equal(
    reportReviewScreenFromKeyboard("snapshot", "ArrowLeft"),
    "education",
  );
  assert.equal(reportReviewScreenFromKeyboard("charge-inspector", "Home"), "snapshot");
  assert.equal(
    reportReviewScreenFromKeyboard("charge-inspector", "End"),
    "education",
  );
  assert.equal(reportReviewScreenFromKeyboard("charge-inspector", "Tab"), null);
});

test("report review sample exposes charge inspector review data", () => {
  assert.equal(
    reportReviewSample.chargeInspector.sourceLabel,
    "Sample CSV review fixture",
  );
  assert.equal(reportReviewSample.chargeInspector.findings.length, 4);
  assert.deepEqual(
    reportReviewSample.dataSources.map((source) => [
      source.id,
      source.kind,
      source.status,
    ]),
    [
      ["manual-profile", "manual", "active"],
      ["csv-transactions", "csv", "available"],
      ["linked-accounts", "linked-account", "future"],
    ],
  );
  assert.deepEqual(
    reportReviewSample.sourceReconciliation.accountMatching.map((rule) => [
      rule.id,
      rule.confidence,
    ]),
    [
      ["account-high-confidence", "high"],
      ["account-medium-confidence", "medium"],
      ["account-low-confidence", "low"],
    ],
  );
  assert.deepEqual(
    reportReviewSample.sourceReconciliation.transactionMatching.map((rule) => [
      rule.id,
      rule.confidence,
    ]),
    [
      ["transaction-high-confidence", "high"],
      ["transaction-medium-confidence", "medium"],
      ["transaction-low-confidence", "low"],
    ],
  );
});

test("manual profile presets expose the expected review scenarios", () => {
  assert.deepEqual(
    MANUAL_PROFILE_PRESETS.map((preset) => preset.id),
    [
      "sample",
      "low_cash_guidance",
      "three_month_boundary",
      "required_only",
    ],
  );
});

test("manual profile field requirements identify required and optional inputs", () => {
  const requirements = Object.entries(MANUAL_PROFILE_FIELD_REQUIREMENTS);
  const expectedRequiredFields = [
    ...REQUIRED_DECIMAL_FIELDS,
    ...REQUIRED_INTEGER_FIELDS,
    ...REQUIRED_SELECT_FIELDS,
  ].sort();
  const expectedOptionalFields = [
    ...OPTIONAL_DECIMAL_FIELDS,
    ...OPTIONAL_POSITIVE_DECIMAL_FIELDS,
    ...OPTIONAL_INTEGER_FIELDS,
  ].sort();
  const scalarFields = Object.keys(defaultManualProfileValues())
    .filter((field) => field !== "assets" && field !== "debts")
    .sort();
  const requiredFields = requirements
    .filter(([, requirement]) => requirement === "required")
    .map(([field]) => field)
    .sort();
  const optionalFields = requirements
    .filter(([, requirement]) => requirement === "optional")
    .map(([field]) => field)
    .sort();
  const labeledFields = requirements.map(([field]) => field).sort();

  assert.deepEqual(requiredFields, expectedRequiredFields);
  assert.deepEqual(optionalFields, expectedOptionalFields);
  assert.deepEqual(labeledFields, scalarFields);
});

test("report review validation checklist covers every preset", () => {
  assert.deepEqual(
    REPORT_REVIEW_VALIDATION_CHECKLIST.map((item) => item.presetId),
    MANUAL_PROFILE_PRESETS.map((preset) => preset.id),
  );
});

test("report review validation checklist includes human-verifiable cases", () => {
  for (const item of REPORT_REVIEW_VALIDATION_CHECKLIST) {
    assert.ok(item.focus.length > 0);
    assert.ok(item.inputChecks.length >= 2);
    assert.ok(item.expectedResults.length >= 2);
    assert.ok(item.boundary.length > 0);
  }

  const requiredOnlyCase = REPORT_REVIEW_VALIDATION_CHECKLIST.find(
    (item) => item.presetId === "required_only",
  );

  assert.ok(
    requiredOnlyCase.expectedResults.some((result) =>
      result.includes(
        "omits optional income, dependents, and user target months",
      ),
    ),
  );
  assert.ok(
    requiredOnlyCase.inputChecks.some((check) =>
      check.includes("Fields labeled Optional"),
    ),
  );
  assert.ok(
    requiredOnlyCase.boundary.includes("Missing information must stay missing"),
  );
});

test("manual profile presets return independent value copies", () => {
  const first = manualProfilePresetValues("sample");
  first.assets[0].balance = "1.00";
  first.debts[0].name = "Changed";

  const second = manualProfilePresetValues("sample");

  assert.equal(second.assets[0].balance, "12000.00");
  assert.equal(second.debts[0].name, "Student loan");
});

test("low-cash preset maps a guidance-trace review input", () => {
  const values = manualProfilePresetValues("low_cash_guidance");

  const request = buildManualProfileRequest(values);

  assert.equal(request.profile.assets.cash, "1500.00");
  assert.equal(request.userTargetMonths, "3");
});

test("three-month boundary preset maps exactly three months of required outflows", () => {
  const values = manualProfilePresetValues("three_month_boundary");

  const request = buildManualProfileRequest(values);
  const monthlyDebtPayments = request.profile.debts.reduce(
    (total, debt) => total + Number(debt.monthly_payment),
    0,
  );
  const monthlyRequiredOutflows =
    Number(request.profile.monthly_housing_cost) +
    Number(request.profile.monthly_non_housing_essential_expenses) +
    monthlyDebtPayments;

  assert.equal(request.profile.monthly_housing_cost, "1800.00");
  assert.equal(request.profile.monthly_non_housing_essential_expenses, "900.00");
  assert.deepEqual(
    request.profile.debts.map((debt) => debt.monthly_payment),
    ["250.00", "420.00", "100.00"],
  );
  assert.equal(
    request.profile.assets.cash,
    (monthlyRequiredOutflows * 3).toFixed(2),
  );
  assert.equal(request.userTargetMonths, "3");
});

test("required-only preset omits optional profile context", () => {
  const values = manualProfilePresetValues("required_only");

  const request = buildManualProfileRequest(values);

  assert.equal("gross_annual_income" in request.profile, false);
  assert.equal("dependents" in request.profile, false);
  assert.deepEqual(request.profile.debts, []);
  assert.equal(request.profile.income_pattern, "mostly_stable");
  assert.equal(request.profile.job_stability, "high");
  assert.equal(request.profile.monthly_investment_contribution, "500.00");
  assert.equal(request.profile.assets.cash, "12000.00");
  assert.equal(request.profile.assets.retirement, "45000.00");
  assert.equal(request.userTargetMonths, undefined);
});

test("manual profile aggregates asset rows into platform asset buckets", () => {
  const values = defaultManualProfileValues();
  values.assets = [
    {
      id: "checking",
      name: "Checking",
      category: "cash",
      balance: "1500.25",
    },
    {
      id: "savings",
      name: "Savings",
      category: "cash",
      balance: "2499.75",
    },
    {
      id: "retirement",
      name: "401(k)",
      category: "retirement",
      balance: "10000",
    },
    {
      id: "brokerage",
      name: "Brokerage",
      category: "brokerage",
      balance: "500",
    },
    {
      id: "other",
      name: "Other asset",
      category: "other",
      balance: "75.50",
    },
  ];
  values.debts = [];

  const request = buildManualProfileRequest(values);

  assert.deepEqual(request.profile.assets, {
    cash: "4000.00",
    retirement: "10000.00",
    brokerage: "500.00",
    other: "75.50",
  });
  assert.deepEqual(request.profile.debts, []);
});

test("manual profile requires at least one asset row", () => {
  const values = defaultManualProfileValues();
  values.assets = [];

  assert.throws(
    () => buildManualProfileRequest(values),
    ManualProfileValidationError,
  );
});

test("manual profile maps multiple liabilities and omits zero-balance rows", () => {
  const values = defaultManualProfileValues();
  values.debts = [
    {
      id: "credit-card",
      name: "Rewards card",
      debtType: "credit_card",
      balance: "1200.00",
      annualInterestRate: "24.99",
      monthlyPayment: "80.00",
      interestTaxAdvantaged: false,
    },
    {
      id: "student-loan",
      name: "Federal student loan",
      debtType: "student_loan",
      balance: "18000.00",
      annualInterestRate: "5.25",
      monthlyPayment: "250.00",
      interestTaxAdvantaged: true,
    },
    {
      id: "unused-line",
      name: "Unused line",
      debtType: "other",
      balance: "0",
      annualInterestRate: "0",
      monthlyPayment: "0",
      interestTaxAdvantaged: false,
    },
  ];

  const request = buildManualProfileRequest(values);

  assert.deepEqual(request.profile.debts, [
    {
      name: "Rewards card",
      debt_type: "credit_card",
      balance: "1200.00",
      annual_interest_rate: "24.99",
      monthly_payment: "80.00",
      interest_tax_advantaged: false,
    },
    {
      name: "Federal student loan",
      debt_type: "student_loan",
      balance: "18000.00",
      annual_interest_rate: "5.25",
      monthly_payment: "250.00",
      interest_tax_advantaged: true,
    },
  ]);
});

test("manual profile rejects zero-balance liability with APR or payment", () => {
  const values = defaultManualProfileValues();
  values.debts = [
    {
      id: "stale-debt",
      name: "Stale debt",
      debtType: "other",
      balance: "0",
      annualInterestRate: "7.5",
      monthlyPayment: "0",
      interestTaxAdvantaged: false,
    },
  ];

  assert.throws(
    () => buildManualProfileRequest(values),
    ManualProfileValidationError,
  );
});

test("manual profile carries positive user target months", () => {
  const values = defaultManualProfileValues();
  values.userTargetMonths = "2.5";

  const request = buildManualProfileRequest(values);

  assert.equal(request.userTargetMonths, "2.5");
});

test("manual profile rejects non-positive and partial user target months", () => {
  for (const value of ["0", "-1", "2abc"]) {
    const values = defaultManualProfileValues();
    values.userTargetMonths = value;

    assert.throws(
      () => buildManualProfileRequest(values),
      ManualProfileValidationError,
    );
  }
});

test("workspace parser tolerates omitted optional EFT trace fields", () => {
  const parsed = parseWorkspaceReportResponse(workspacePayload());

  assert.equal(
    parsed.workspace_snapshot.inputs.emergency_fund_target.user_target_months,
    null,
  );
  assert.equal(parsed.workspace_snapshot.eft_result.model_version, "");
  assert.equal(parsed.workspace_snapshot.eft_result.user_selected_target, null);
  assert.deepEqual(parsed.workspace_snapshot.eft_result.evidence_source_ids, []);
  assert.deepEqual(parsed.workspace_snapshot.eft_result.guidance_rules, []);
  assert.equal(parsed.workspace_snapshot.eft_result.guidance_rule_version, "");
});

test("workspace parser accepts matched guidance rule trace", () => {
  const payload = workspacePayload({
    eftResult: {
      guidance_rules: [guidanceRulePayload()],
    },
  });

  const parsed = parseWorkspaceReportResponse(payload);

  assert.deepEqual(parsed.workspace_snapshot.eft_result.guidance_rules, [
    guidanceRulePayload(),
  ]);
});

test("workspace parser accepts user-selected target comparison", () => {
  const payload = workspacePayload({
    emergencyFundTarget: {
      user_target_months: "2",
    },
    eftResult: {
      model_version: "emergency_fund_target_v0",
      evidence_source_ids: ["cfpb_emergency_fund_guide"],
      guidance_rule_version: "guidance_rule_registry_v0",
      user_selected_target: {
        target_months: "2.00",
        target_amount: "6000.00",
        gap_amount: "1000.00",
        alignment_to_baseline: "below_baseline",
      },
    },
  });

  const parsed = parseWorkspaceReportResponse(payload);

  assert.equal(
    parsed.workspace_snapshot.inputs.emergency_fund_target.user_target_months,
    "2",
  );
  assert.deepEqual(parsed.workspace_snapshot.eft_result.user_selected_target, {
    target_months: "2.00",
    target_amount: "6000.00",
    gap_amount: "1000.00",
    alignment_to_baseline: "below_baseline",
  });
});

test("workspace parser rejects malformed user-selected target values", () => {
  const payload = workspacePayload({
    eftResult: {
      user_selected_target: {
        target_months: { value: "2.00" },
        target_amount: "6000.00",
        gap_amount: "1000.00",
        alignment_to_baseline: "below_baseline",
      },
    },
  });

  assert.throws(
    () => parseWorkspaceReportResponse(payload),
    /user_selected_target\.target_months must be a string, number, or null/,
  );
});

test("education topic resolver returns registered display metadata", () => {
  const topic = resolveEducationTopic("emergency_fund.target_range");

  assert.deepEqual(topic, {
    id: "emergency_fund.target_range",
    title: "Emergency fund target range",
    concept: "Emergency fund target ranges and liquid cash context.",
    status: "pending",
  });
});

test("education topic resolver falls back for unknown platform topics", () => {
  const topic = resolveEducationTopic("future_topic.sample_case");

  assert.equal(topic.id, "future_topic.sample_case");
  assert.equal(topic.title, "Future Topic Sample Case");
  assert.equal(topic.status, "pending");
  assert.match(topic.concept, /does not have landing-side display metadata/);
});

test("education topic anchors preserve stable topic ids", () => {
  assert.equal(
    educationTopicAnchor("debt.interest_cost"),
    "education-topic-debt.interest_cost",
  );
});

test("uniqueTopicIds deduplicates topics while preserving first-seen order", () => {
  assert.deepEqual(
    uniqueTopicIds([
      ["debt.interest_cost", "cash_flow.monthly_deficit"],
      ["debt.interest_cost", "emergency_fund.target_range"],
      [],
      ["cash_flow.monthly_deficit", "net_worth.assets_and_liabilities"],
    ]),
    [
      "debt.interest_cost",
      "cash_flow.monthly_deficit",
      "emergency_fund.target_range",
      "net_worth.assets_and_liabilities",
    ],
  );
});

test("platform report mapper builds user-selected target comparison", () => {
  const mapped = mapWorkspacePayload({
    emergencyFundTarget: {
      user_target_months: "2",
    },
    eftResult: {
      model_version: "emergency_fund_target_v0",
      evidence_source_ids: ["cfpb_emergency_fund_guide"],
      guidance_rules: [guidanceRulePayload()],
      guidance_rule_version: "guidance_rule_registry_v0",
      assumptions: ["Baseline assumption."],
      limitations: ["Baseline limitation."],
      user_selected_target: {
        target_months: "2.00",
        target_amount: "6000.00",
        gap_amount: "1000.00",
        alignment_to_baseline: "below_baseline",
      },
    },
  });

  assert.equal(mapped.profileName, "Test profile");
  assert.equal(mapped.dataMode, "Test Platform API");
  assert.deepEqual(mapped.connectionNotice, {
    tone: "seed",
    message: "Loaded for mapper tests.",
  });
  assert.equal(mapped.chargeInspector.sourceLabel, "No transaction review source");
  assert.deepEqual(mapped.chargeInspector.findings, []);
  assert.deepEqual(
    mapped.dataSources.map((source) => [
      source.id,
      source.kind,
      source.status,
    ]),
    [
      ["manual-profile", "sample", "active"],
      ["csv-transactions", "csv", "empty"],
      ["linked-accounts", "linked-account", "future"],
    ],
  );
  assert.match(
    mapped.sourceReconciliation.summary,
    /account-level sources/,
  );
  assert.match(
    mapped.sourceReconciliation.resolution
      .map((rule) => rule.value)
      .join(" "),
    /CSV as backfill/,
  );

  const decision = mapped.decisionReadiness;
  assert.deepEqual(decision.evidenceSourceIds, ["cfpb_emergency_fund_guide"]);
  assert.deepEqual(decision.guidanceRules, [
    {
      id: "eft.cash_below_lower_target_range",
      allowedPhrasing:
        "Your cash currently covers less than the lower end of a typical emergency-fund range.",
      trigger:
        "current_months_covered Less Than target_months_range.min_months",
      evidenceSourceIds: [
        "cfpb_emergency_fund_guide",
        "fdic_money_smart_your_savings",
      ],
      requiredGuards: [
        "monthly_essential_expenses",
        "cash_liquid_balance",
      ],
      ruleVersion: "guidance_rule_registry_v0",
    },
  ]);
  assert.equal(decision.guidanceRuleVersion, "guidance_rule_registry_v0");
  assert.equal(decision.modelVersion, "emergency_fund_target_v0");
  assert.deepEqual(decision.assumptions, ["Baseline assumption."]);
  assert.deepEqual(decision.limitations, ["Baseline limitation."]);
  assert.deepEqual(decision.userSelectedTarget, {
    targetMonths: "2 months",
    targetAmount: "$6,000",
    gapAmount: "$1,000",
    alignmentLabel: "Below baseline",
    alignmentDetail:
      "This preference is below the source-backed baseline range, so the baseline range remains visible for comparison.",
  });

  assert.deepEqual(
    itemById(decision.availableInputs, "user_target_months"),
    {
      id: "user_target_months",
      label: "User-selected target",
      value: "2 months",
      provenance: "user-entered",
      detail:
        "Optional preference target; it does not replace the baseline range.",
    },
  );
});

test("platform report data sources reflect linked and mixed transaction modes", () => {
  for (const { source, kind, label } of [
    {
      source: "linked_account",
      kind: "linked-account",
      label: "Platform linked transaction review",
    },
    {
      source: "mixed",
      kind: "mixed",
      label: "Platform mixed transaction review",
    },
  ]) {
    const chargeInspectorPayload = chargeInspectorPlatformPayload();
    chargeInspectorPayload.source = source;
    const chargeInspector = mapPlatformChargeInspectorReview(
      parseChargeInspectorReviewResponse(chargeInspectorPayload),
    );
    const mapped = mapPlatformReport(
      parseWorkspaceReportResponse(workspacePayload()),
      {
        profileName: "Test profile",
        dataMode: "Test Platform API",
        connectionMessage: "Loaded for mapper tests.",
        chargeInspector,
      },
    );
    const transactionSource = itemById(mapped.dataSources, "csv-transactions");

    assert.equal(transactionSource.kind, kind);
    assert.equal(transactionSource.label, label);
    assert.equal(transactionSource.status, "active");
  }
});

test("platform report mapper preserves missing EFT values", () => {
  const mapped = mapWorkspacePayload({
    emergencyFundTarget: {
      monthly_essential_expenses: null,
      cash_liquid_balance: null,
      income_pattern: null,
      user_target_months: undefined,
    },
    eftResult: {
      target_months_range: null,
      target_amount_range: null,
      current_months_covered: null,
      gap_amount_range: null,
      missing_context: [
        "monthly_essential_expenses",
        "cash_liquid_balance",
        "surprise_context",
      ],
    },
  });

  const decision = mapped.decisionReadiness;
  assert.equal(decision.guidanceRuleVersion, "Unknown");
  assert.equal(decision.modelVersion, "Unknown");
  assert.equal(decision.userSelectedTarget, null);
  assert.equal(
    decision.availableInputs.some((item) => item.id === "user_target_months"),
    false,
  );
  assert.deepEqual(
    itemById(decision.availableInputs, "emergency_eligible_cash"),
    {
      id: "emergency_eligible_cash",
      label: "Emergency-eligible cash",
      value: "Missing",
      provenance: "missing",
    },
  );
  assert.deepEqual(itemById(decision.availableInputs, "income_pattern"), {
    id: "income_pattern",
    label: "Income pattern",
    value: "Missing",
    provenance: "missing",
  });
  assert.deepEqual(itemById(decision.resultMetrics, "current_months_covered"), {
    id: "current_months_covered",
    label: "Current coverage",
    value: "Missing",
    provenance: "missing",
    detail: "Reported liquid cash divided by required monthly outflows.",
  });
  assert.deepEqual(itemById(decision.resultMetrics, "target_months_range"), {
    id: "target_months_range",
    label: "Baseline months",
    value: "Missing",
    provenance: "missing",
    detail: "Educational range; not a single required number.",
  });
  assert.deepEqual(itemById(decision.resultMetrics, "gap_amount_range"), {
    id: "gap_amount_range",
    label: "Gap range",
    value: "Missing",
    provenance: "missing",
    detail: "Target amount range minus reported liquid cash, floored at zero.",
  });
  assert.deepEqual(decision.missingInputs, [
    {
      id: "monthly_essential_expenses",
      label: "Monthly Essential Expenses",
      whyItMatters:
        "Required monthly outflows are needed to translate target months into dollars.",
    },
    {
      id: "cash_liquid_balance",
      label: "Cash Liquid Balance",
      whyItMatters:
        "Emergency-eligible cash is needed before the model can compare current reserves with a target.",
    },
    {
      id: "surprise_context",
      label: "Surprise Context",
      whyItMatters:
        "This context is preserved as missing instead of being converted into a zero-dollar assumption.",
    },
  ]);
});

test("platform report mapper falls back for unknown user-target alignment", () => {
  const mapped = mapWorkspacePayload({
    emergencyFundTarget: {
      user_target_months: "7",
    },
    eftResult: {
      user_selected_target: {
        target_months: "7.00",
        target_amount: "21000.00",
        gap_amount: "16000.00",
        alignment_to_baseline: "custom_case",
      },
    },
  });

  assert.deepEqual(mapped.decisionReadiness.userSelectedTarget, {
    targetMonths: "7 months",
    targetAmount: "$21,000",
    gapAmount: "$16,000",
    alignmentLabel: "Custom Case",
    alignmentDetail:
      "This preference target is calculated separately from the source-backed baseline range.",
  });
});

test("platform report mapper summarizes cash flow and completeness labels", () => {
  const mapped = mapWorkspacePayload({
    report: {
      cash_flow: {
        monthly_surplus_after_investing: "-125.40",
      },
      data_completeness: {
        status: "partial",
        explanation: "Some optional context is unavailable.",
        missing_context: ["gross_annual_income"],
        potentially_unmeasured_categories: ["insurance_gap"],
      },
    },
  });

  const monthlyCashFlow = itemById(mapped.summaryMetrics, "monthly_cash_flow");
  assert.equal(monthlyCashFlow.value, "$125 short");
  assert.equal(
    monthlyCashFlow.detail,
    "After living expenses, debt payments, and contributions.",
  );
  assert.equal(monthlyCashFlow.provenance, "calculated");
  assert.equal(
    itemById(mapped.summaryMetrics, "data_completeness").value,
    "Partial",
  );
  assert.equal(
    itemById(mapped.summaryMetrics, "data_completeness").provenance,
    "missing",
  );
  assert.deepEqual(mapped.dataCompleteness, {
    status: "Partial",
    explanation: "Some optional context is unavailable.",
    uncertainty: [],
    missingContext: ["Gross Annual Income"],
    potentiallyUnmeasuredCategories: ["Insurance Gap"],
  });
});

test("platform report mapper maps portfolio totals and provenance", () => {
  const mapped = mapWorkspacePayload({
    report: {
      net_worth: {
        gross_assets: "9500.00",
        total_liabilities: "1500.00",
        net_worth: "8000.00",
        liquid_net_worth: "5000.00",
      },
    },
    assets: [
      {
        asset_id: "checking",
        name: "Checking",
        category: "cash",
        balance: "3500.00",
        liquidity: "liquid",
        provenance: "user_entered",
        emergency_fund_eligible: true,
      },
      {
        asset_id: "brokerage",
        name: "Brokerage",
        category: "taxable_brokerage",
        balance: "6000.00",
        liquidity: "market_exposed",
        provenance: "reference_data",
        emergency_fund_eligible: false,
      },
    ],
    liabilities: [
      {
        liability_id: "credit_card",
        name: "Credit card",
        category: "credit_card",
        balance: "1500.00",
        provenance: "estimated",
      },
    ],
  });

  assert.equal(
    itemById(mapped.assetPortfolio.totals, "emergency_eligible_cash").value,
    "$3,500",
  );
  assert.deepEqual(mapped.assetPortfolio.assets, [
    {
      id: "checking",
      name: "Checking",
      category: "Cash",
      value: "$3,500",
      liquidity: "Liquid",
      provenance: "user-entered",
      emergencyEligible: true,
    },
    {
      id: "brokerage",
      name: "Brokerage",
      category: "Taxable Brokerage",
      value: "$6,000",
      liquidity: "Market Exposed",
      provenance: "source-backed",
      emergencyEligible: false,
    },
  ]);
  assert.deepEqual(mapped.assetPortfolio.liabilities, [
    {
      id: "credit_card",
      name: "Credit card",
      category: "Credit Card",
      value: "$1,500",
      liquidity: "Debt",
      provenance: "estimated",
      emergencyEligible: false,
    },
  ]);
});

test("report review data preserves the workspace report when charge inspector fails", async () => {
  const platformReportModulePath = require.resolve(
    "../lib/report-review/platform-report.ts",
  );
  const previousPlatformApiUrl = process.env.LITTLESEED_PLATFORM_API_URL;
  const previousFetch = globalThis.fetch;
  const previousConsoleError = console.error;
  const calls = [];

  process.env.LITTLESEED_PLATFORM_API_URL = "http://platform.test";
  delete require.cache[platformReportModulePath];
  const { getReportReviewData } = require("../lib/report-review/platform-report.ts");

  globalThis.fetch = async (url) => {
    const urlText = String(url);
    calls.push(urlText);

    if (urlText.endsWith("/v1/phase3/workspace-report")) {
      return jsonResponse(workspacePayload());
    }

    if (urlText.endsWith("/v1/phase3/charge-inspector-review")) {
      return jsonResponse({ error: "temporary unavailable" }, 503);
    }

    return jsonResponse({ error: "not found" }, 404);
  };
  console.error = () => {};

  try {
    const report = await getReportReviewData();

    assert.equal(report.profileName, "Platform sample profile");
    assert.equal(report.dataMode, "Platform API");
    assert.equal(report.chargeInspector.dataMode, "fallback");
    assert.equal(
      report.chargeInspector.sourceLabel,
      "Charge Inspector temporarily unavailable",
    );
    assert.deepEqual(report.chargeInspector.findings, []);
    assert.equal(calls.length, 2);
    assert.ok(
      calls.some((url) => url.endsWith("/v1/phase3/workspace-report")),
    );
    assert.ok(
      calls.some((url) =>
        url.endsWith("/v1/phase3/charge-inspector-review"),
      ),
    );
  } finally {
    if (previousPlatformApiUrl === undefined) {
      delete process.env.LITTLESEED_PLATFORM_API_URL;
    } else {
      process.env.LITTLESEED_PLATFORM_API_URL = previousPlatformApiUrl;
    }
    if (previousFetch === undefined) {
      delete globalThis.fetch;
    } else {
      globalThis.fetch = previousFetch;
    }
    console.error = previousConsoleError;
    delete require.cache[platformReportModulePath];
  }
});

function chargeInspectorPlatformPayload() {
  const evidence = [
    transactionPayload("txn-streamly-1", 2, "2026-03-08", "Streamly Premium", "15.99"),
    transactionPayload("txn-streamly-2", 3, "2026-04-08", "Streamly Premium", "15.99"),
    transactionPayload("txn-streamly-3", 4, "2026-05-09", "Streamly Premium", "15.99"),
    transactionPayload("txn-coffee-1", 5, "2026-05-14", "Market Street Coffee", "8.25"),
    transactionPayload("txn-coffee-2", 6, "2026-05-14", "Market Street Coffee", "8.25"),
    transactionPayload(
      "txn-bank-fee",
      7,
      "2026-05-31",
      "Neighborhood Bank Monthly Service Fee",
      "12.00",
    ),
    transactionPayload("txn-fitplan-1", 9, "2026-04-21", "FitPlan App", "10.00"),
    transactionPayload("txn-fitplan-2", 10, "2026-05-21", "FitPlan App", "12.50"),
  ];

  return {
    schema_version: "charge_inspector_review_v0",
    review_id: "landing-sample-charge-review",
    csv_format: "chase_checking",
    source: "sample_csv",
    parser_schema_version: "charge_inspector_csv_parse_result_v0",
    detector_versions: {
      recurring_charge: "recurring_charge_detector_v0",
      duplicate_charge: "duplicate_charge_detector_v0",
      bank_fee: "bank_fee_detector_v0",
      price_increase: "price_increase_detector_v0",
    },
    reviewed_transaction_count: 18,
    parse_error_count: 0,
    findings: {
      recurring_charges: [
        {
          finding_id: "possible_recurring_charge_sample",
          merchant_name: "Streamly Premium",
          currency: "USD",
          typical_amount: "15.99",
          min_amount: "15.99",
          max_amount: "15.99",
          occurrence_count: 3,
          first_seen_date: "2026-03-08",
          last_seen_date: "2026-05-09",
          cadence: "monthly",
          evidence_transaction_ids: [
            "txn-streamly-1",
            "txn-streamly-2",
            "txn-streamly-3",
          ],
          evidence_source_row_numbers: [2, 3, 4],
          explanation:
            "This looks like a recurring charge because a similar debit amount appeared monthly.",
          limitations: ["Review the transaction evidence before acting."],
        },
      ],
      duplicate_charges: [
        {
          finding_id: "possible_duplicate_charge_sample",
          merchant_name: "Market Street Coffee",
          currency: "USD",
          amount: "8.25",
          occurrence_count: 2,
          posted_date: "2026-05-14",
          evidence_transaction_ids: ["txn-coffee-1", "txn-coffee-2"],
          evidence_source_row_numbers: [5, 6],
          explanation:
            "This looks like a possible duplicate charge because matching rows appeared.",
          limitations: ["Two matching rows can still be separate purchases."],
        },
      ],
      bank_fees: [
        {
          finding_id: "possible_bank_fee_sample",
          fee_type: "monthly_service_fee",
          merchant_name: "Neighborhood Bank Monthly Service Fee",
          currency: "USD",
          amount: "12.00",
          occurrence_count: 1,
          posted_date: "2026-05-31",
          evidence_transaction_ids: ["txn-bank-fee"],
          evidence_source_row_numbers: [7],
          explanation:
            "This looks like a possible bank fee because the description includes fee language.",
          limitations: ["This does not determine whether the fee is avoidable."],
        },
      ],
      price_increases: [
        {
          finding_id: "possible_price_increase_sample",
          merchant_name: "FitPlan App",
          currency: "USD",
          previous_amount: "10.00",
          increased_amount: "12.50",
          increase_amount: "2.50",
          increase_percent: "25.00",
          previous_posted_date: "2026-04-21",
          increased_posted_date: "2026-05-21",
          cadence: "monthly",
          occurrence_count: 2,
          evidence_transaction_ids: ["txn-fitplan-1", "txn-fitplan-2"],
          evidence_source_row_numbers: [9, 10],
          explanation:
            "This looks like a possible price increase because a monthly debit rose.",
          limitations: ["Plan changes, taxes, or fees can change amounts."],
        },
      ],
    },
    evidence_transactions: evidence,
    parse_errors: [],
    limitations: [
      "Findings are deterministic review prompts, not ranked actions or financial advice.",
      "No account connection, continuous monitoring, merchant contact, or stored transaction history is introduced.",
    ],
  };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
    status,
  });
}

function transactionPayload(id, rowNumber, postedDate, merchantName, amount) {
  return {
    transaction_id: id,
    source: "sample_csv",
    source_row_number: rowNumber,
    posted_date: postedDate,
    merchant_name: merchantName,
    original_description: merchantName,
    amount,
    direction: "debit",
    currency: "USD",
    transaction_type: "DEBIT_CARD",
  };
}

function mapWorkspacePayload(overrides = {}) {
  return mapPlatformReport(
    parseWorkspaceReportResponse(workspacePayload(overrides)),
    {
      profileName: "Test profile",
      dataMode: "Test Platform API",
      connectionMessage: "Loaded for mapper tests.",
    },
  );
}

function itemById(items, id) {
  const item = items.find((candidate) => candidate.id === id);
  assert.ok(item, `Expected item with id ${id}`);
  return item;
}

function guidanceRulePayload() {
  return {
    rule_id: "eft.cash_below_lower_target_range",
    trigger: {
      metric: "current_months_covered",
      operator: "less_than",
      threshold_ref: "target_months_range.min_months",
      threshold_value: null,
    },
    allowed_phrasing:
      "Your cash currently covers less than the lower end of a typical emergency-fund range.",
    evidence_source_ids: [
      "cfpb_emergency_fund_guide",
      "fdic_money_smart_your_savings",
    ],
    required_guards: [
      "monthly_essential_expenses",
      "cash_liquid_balance",
    ],
    rule_version: "guidance_rule_registry_v0",
  };
}

function workspacePayload(overrides = {}) {
  return {
    report: reportPayload(overrides.report),
    workspace_snapshot: {
      inputs: {
        emergency_fund_target: {
          monthly_essential_expenses: "3000.00",
          cash_liquid_balance: "5000.00",
          income_pattern: "mostly_stable",
          dependents: 0,
          job_stability: "high",
          ...(overrides.emergencyFundTarget ?? {}),
        },
        assets: overrides.assets ?? [],
        liabilities: overrides.liabilities ?? [],
      },
      eft_result: {
        applicability: "applicable",
        target_months_range: {
          min_months: "3",
          max_months: "6",
        },
        target_amount_range: {
          min_amount: "9000.00",
          max_amount: "18000.00",
        },
        current_months_covered: "1.67",
        gap_amount_range: {
          min_amount: "4000.00",
          max_amount: "13000.00",
        },
        missing_context: [],
        assumptions: [],
        limitations: [],
        education_topics: ["emergency_fund.target_range"],
        ...(overrides.eftResult ?? {}),
      },
    },
  };
}

function reportPayload(overrides = {}) {
  const base = {
    report_schema_version: "financial_health_report_v0_3",
    report_status: "complete",
    calculated_at: "2026-06-17T00:00:00Z",
    disclaimer: {
      text: "Educational review only.",
    },
    sections: [],
    findings: [],
    evidence_sources: [],
    data_completeness: {
      status: "complete",
      explanation: "Complete enough for this parser test.",
      missing_context: [],
      potentially_unmeasured_categories: [],
    },
    report_context: {
      uncertainty: [],
    },
    net_worth: {
      gross_assets: "0.00",
      total_liabilities: "0.00",
      net_worth: "0.00",
      liquid_net_worth: "0.00",
    },
    cash_flow: {
      monthly_required_outflows: "3000.00",
      monthly_surplus_after_investing: "0.00",
    },
    debt_risk: {
      total_debt_balance: "0.00",
      confirmed_high_interest_balance: "0.00",
    },
    long_term_contribution: {
      known_monthly_total_contribution: "0.00",
    },
  };

  return {
    ...base,
    ...overrides,
    disclaimer: {
      ...base.disclaimer,
      ...(overrides.disclaimer ?? {}),
    },
    data_completeness: {
      ...base.data_completeness,
      ...(overrides.data_completeness ?? {}),
    },
    report_context: {
      ...base.report_context,
      ...(overrides.report_context ?? {}),
    },
    net_worth: {
      ...base.net_worth,
      ...(overrides.net_worth ?? {}),
    },
    cash_flow: {
      ...base.cash_flow,
      ...(overrides.cash_flow ?? {}),
    },
    debt_risk: {
      ...base.debt_risk,
      ...(overrides.debt_risk ?? {}),
    },
    long_term_contribution: {
      ...base.long_term_contribution,
      ...(overrides.long_term_contribution ?? {}),
    },
  };
}
