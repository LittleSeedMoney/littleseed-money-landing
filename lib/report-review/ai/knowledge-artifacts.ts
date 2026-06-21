import type { KnowledgeArtifact } from "./types";

export const KNOWLEDGE_CORPUS_VERSION = "knowledge_corpus.fixture.v0";

export const reportReviewKnowledgeArtifacts: KnowledgeArtifact[] = [
  {
    id: "knowledge_cash_flow_pressure_v0",
    title: "Understanding cash-flow pressure",
    sourceType: "littleseed-authored",
    reviewStatus: "approved",
    version: "2026-06-21",
    reviewedOn: "2026-06-21",
    summary:
      "Cash-flow pressure means regular obligations may leave limited room for unexpected costs, goal funding, or changes in income.",
    body:
      "A finding about cash-flow pressure should be explained as an area to review, not as a judgment or a required action. Useful context includes whether income is stable, whether obligations are temporary, what expenses are essential, and whether the current report is missing important household details.",
    allowedUses: [
      "Explain report-review findings in plain language.",
      "Identify missing context that could change the interpretation.",
      "Keep next questions educational and non-ranked.",
    ],
    limitations: [
      "Does not choose a budget, debt, product, tax, or investment action for the user.",
      "Does not rank actions without an approved guidance rule.",
      "Does not calculate new values outside the deterministic report output.",
    ],
  },
  {
    id: "knowledge_debt_cost_context_v0",
    title: "Understanding debt-cost context",
    sourceType: "littleseed-authored",
    reviewStatus: "approved",
    version: "2026-06-21",
    reviewedOn: "2026-06-21",
    summary:
      "Debt cost is easier to interpret when the report can see balances, rates, required payments, income stability, and whether a debt has special tax or legal treatment.",
    body:
      "A debt-related finding can explain why interest rate, required payment, and balance information matter. It should avoid telling the user which debt to pay first, whether to refinance, whether to consolidate, or whether a product is best. Those decisions require approved guidance rules, product boundaries, and often professional context.",
    allowedUses: [
      "Explain why debt fields matter to a report finding.",
      "Name missing debt context in a non-advisory way.",
      "Support refusal when the user asks for ranking, refinancing, product, tax, or legal advice.",
    ],
    limitations: [
      "Does not provide payoff priority ranking.",
      "Does not recommend refinancing, consolidation, balance transfers, or credit products.",
      "Does not provide tax, legal, fiduciary, insolvency, or investment advice.",
    ],
  },
];

export function approvedKnowledgeArtifacts() {
  return reportReviewKnowledgeArtifacts.filter(
    (artifact) => artifact.reviewStatus === "approved",
  );
}
