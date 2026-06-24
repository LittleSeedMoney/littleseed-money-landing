import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { KnowledgeArtifact } from "./types";

export const KNOWLEDGE_CORPUS_VERSION = "knowledge_corpus.fixture.v0";

const CORPUS_FIXTURE_PATH = join(
  process.cwd(),
  "data/knowledge/report-review-corpus.fixture.jsonl",
);

type CorpusRecord = {
  artifact_id: string;
  body: string;
  content_hash: string;
  content_version: string;
  schema_version: string;
  source: {
    source_path: string;
    source_type: KnowledgeArtifact["sourceType"];
  };
  review: {
    reviewed_on: string | null;
    status: KnowledgeArtifact["reviewStatus"];
  };
  title: string;
  summary: string;
  allowed_uses: string[];
  prohibited_uses: string[];
  limitations: string[];
  tags: string[];
};

export function approvedKnowledgeArtifacts({
  artifactIds,
}: {
  artifactIds?: string[];
} = {}) {
  const allowedIds = artifactIds ? new Set(artifactIds) : null;
  return readCorpusRecords()
    .filter((record) => record.review.status === "approved")
    .filter((record) => !allowedIds || allowedIds.has(record.artifact_id))
    .map(toKnowledgeArtifact);
}

function readCorpusRecords() {
  return readFileSync(CORPUS_FIXTURE_PATH, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line, index) => parseCorpusRecord(JSON.parse(line), index));
}

function parseCorpusRecord(value: unknown, index: number): CorpusRecord {
  const record = expectRecord(value, `corpus[${index}]`);
  const source = expectRecord(record.source, `corpus[${index}].source`);
  const review = expectRecord(record.review, `corpus[${index}].review`);

  return {
    allowed_uses: readStringArray(
      record.allowed_uses,
      `corpus[${index}].allowed_uses`,
    ),
    artifact_id: readString(record, "artifact_id", `corpus[${index}]`),
    body: readString(record, "body", `corpus[${index}]`),
    content_hash: readString(record, "content_hash", `corpus[${index}]`),
    content_version: readString(record, "content_version", `corpus[${index}]`),
    limitations: readStringArray(
      record.limitations,
      `corpus[${index}].limitations`,
    ),
    prohibited_uses: readStringArray(
      record.prohibited_uses,
      `corpus[${index}].prohibited_uses`,
    ),
    review: {
      reviewed_on: readNullableString(
        review.reviewed_on,
        `corpus[${index}].review.reviewed_on`,
      ),
      status: readReviewStatus(review.status, `corpus[${index}].review.status`),
    },
    schema_version: readString(record, "schema_version", `corpus[${index}]`),
    source: {
      source_path: readString(
        source,
        "source_path",
        `corpus[${index}].source`,
      ),
      source_type: readSourceType(
        source.source_type,
        `corpus[${index}].source.source_type`,
      ),
    },
    summary: readString(record, "summary", `corpus[${index}]`),
    tags: readStringArray(record.tags, `corpus[${index}].tags`),
    title: readString(record, "title", `corpus[${index}]`),
  };
}

function toKnowledgeArtifact(record: CorpusRecord): KnowledgeArtifact {
  return {
    allowedUses: record.allowed_uses,
    body: record.body,
    contentHash: record.content_hash,
    id: record.artifact_id,
    limitations: record.limitations,
    prohibitedUses: record.prohibited_uses,
    reviewStatus: record.review.status,
    reviewedOn: record.review.reviewed_on ?? "",
    sourcePath: record.source.source_path,
    sourceType: record.source.source_type,
    summary: record.summary,
    tags: record.tags,
    title: record.title,
    version: record.content_version,
  };
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function readString(
  record: Record<string, unknown>,
  field: string,
  label: string,
) {
  const value = record[field];

  if (typeof value !== "string") {
    throw new Error(`${label}.${field} must be text.`);
  }

  return value;
}

function readNullableString(value: unknown, label: string) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${label} must be text or null.`);
  }

  return value;
}

function readStringArray(value: unknown, label: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${label} must be an array of text.`);
  }

  return value as string[];
}

function readReviewStatus(value: unknown, label: string) {
  if (
    value === "approved" ||
    value === "needs-review" ||
    value === "rejected" ||
    value === "stale"
  ) {
    return value;
  }

  throw new Error(`${label} must be a supported review status.`);
}

function readSourceType(value: unknown, label: string) {
  if (
    value === "littleseed-authored" ||
    value === "third-party-approved-summary"
  ) {
    return value;
  }

  throw new Error(`${label} must be a supported source type.`);
}
