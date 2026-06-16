export type EducationTopic = {
  id: string;
  title: string;
  concept: string;
  status: "ready" | "pending";
  href?: string;
};

const EDUCATION_TOPIC_REGISTRY: Record<string, EducationTopic> = {
  "debt.interest_cost": {
    id: "debt.interest_cost",
    title: "Interest cost",
    concept: "How interest affects borrowing cost.",
    status: "pending",
  },
  "debt.repayment_methods": {
    id: "debt.repayment_methods",
    title: "Repayment methods",
    concept: "General repayment-method concepts and trade-offs.",
    status: "pending",
  },
  "cash_flow.monthly_deficit": {
    id: "cash_flow.monthly_deficit",
    title: "Monthly deficit",
    concept: "Monthly outflows exceeding reported income.",
    status: "pending",
  },
  "cash_flow.investment_contributions": {
    id: "cash_flow.investment_contributions",
    title: "Contribution funding",
    concept: "Contribution funding and available monthly cash.",
    status: "pending",
  },
  "emergency_fund.target_range": {
    id: "emergency_fund.target_range",
    title: "Emergency fund target range",
    concept: "Emergency fund target ranges and liquid cash context.",
    status: "pending",
  },
  "net_worth.assets_and_liabilities": {
    id: "net_worth.assets_and_liabilities",
    title: "Assets and liabilities",
    concept: "Assets, liabilities, and net worth.",
    status: "pending",
  },
  "life_events.financial_context": {
    id: "life_events.financial_context",
    title: "Life-event context",
    concept: "Why major life events change financial interpretation.",
    status: "pending",
  },
};

export function resolveEducationTopic(id: string): EducationTopic {
  return (
    EDUCATION_TOPIC_REGISTRY[id] ?? {
      id,
      title: titleFromTopicId(id),
      concept:
        "This topic was returned by the platform but does not have landing-side display metadata yet.",
      status: "pending",
    }
  );
}

export function educationTopicAnchor(id: string): string {
  return `education-topic-${id}`;
}

export function uniqueTopicIds(topicGroups: string[][]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const group of topicGroups) {
    for (const id of group) {
      if (!seen.has(id)) {
        seen.add(id);
        result.push(id);
      }
    }
  }

  return result;
}

function titleFromTopicId(id: string): string {
  return id
    .split(/[._]/)
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
    .join(" ");
}
