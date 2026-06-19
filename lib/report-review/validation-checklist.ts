import type { ManualProfilePresetId } from "./manual-profile";

export type ReportReviewValidationChecklistItem = {
  presetId: ManualProfilePresetId;
  focus: string;
  inputChecks: string[];
  expectedResults: string[];
  boundary: string;
};

export const REPORT_REVIEW_VALIDATION_CHECKLIST: ReportReviewValidationChecklistItem[] =
  [
    {
      presetId: "sample",
      focus: "Baseline report shape and ordinary sample values.",
      inputChecks: [
        "Sample household preset is selected.",
        "Cash asset row is present and emergency target months is blank.",
        "Student loan, auto loan, and credit-card liabilities are present.",
      ],
      expectedResults: [
        "Report review can render summary metrics, question-led sections, portfolio, findings, education, evidence, and inputs.",
        "Emergency Fund Target shows calculated coverage near the middle of the baseline range.",
        "Connection state clearly labels sample data or user-entered data.",
      ],
      boundary:
        "In-session review only. No account, saved report history, or persisted profile is created.",
    },
    {
      presetId: "low_cash_guidance",
      focus: "Underfunded emergency cash and matched guidance-rule trace.",
      inputChecks: [
        "Low cash coverage preset is selected.",
        "Cash balance uses the low-cash preset value and emergency target months is 3.",
        "Debt rows remain present so required outflows include monthly payments.",
      ],
      expectedResults: [
        "When the platform API is configured, Emergency Fund Target shows current cash below the lower end of the range.",
        "Guidance trace shows approved registry phrasing for cash below the lower target range.",
        "Without the platform API, the screen keeps the fallback notice visible instead of implying user-specific output.",
      ],
      boundary:
        "Observation and education only. The UI must not rank emergency savings above other household priorities.",
    },
    {
      presetId: "three_month_boundary",
      focus: "Lower-bound equality where no below-target rule should fire.",
      inputChecks: [
        "Three-month boundary preset is selected.",
        "Cash balance equals three months of required outflows: housing plus non-housing essentials plus debt payments.",
        "Emergency target months is 3.",
      ],
      expectedResults: [
        "Emergency Fund Target treats exactly three months as within the baseline lower boundary.",
        "No below-lower-target guidance rule is active for the equality case.",
        "Calculation details make the required-outflow basis inspectable.",
      ],
      boundary:
        "Boundary review only. The preset is not a recommendation that three months is sufficient for every household.",
    },
    {
      presetId: "required_only",
      focus: "Missing optional context without converting blanks to zero.",
      inputChecks: [
        "Minimum request preset is selected.",
        "Fields labeled Optional are blank or absent: gross annual income, dependents, user target months, and liabilities.",
        "Sample income pattern, job stability, asset balances, and monthly investing contribution remain intact.",
      ],
      expectedResults: [
        "Request builder omits optional income, dependents, and user target months instead of sending zero values.",
        "Liabilities are omitted as an empty list, not converted into zero-dollar debt facts.",
        "Missing optional context remains visible in the report or decision output where applicable.",
      ],
      boundary:
        "Missing information must stay missing. The UI must not silently infer optional financial context.",
    },
  ];
