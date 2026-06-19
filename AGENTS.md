# LittleSeed Money Landing Guidance

## Repository Role

This repository contains the public LittleSeed Money landing experience,
brand/content surfaces, and the private report-review UI used to validate
financial report structure and platform integration.

Product meaning, roadmap intent, AI guardrails, phase scope, PR acceptance, and
the canonical engineering log live in:

```text
../littleseed-money-product-docs
```

Do not duplicate canonical policy text here. Keep this file focused on landing
workflow, brand/UX constraints, and report-review integration rules.

## Required Product Context

Before substantial landing, content, brand, or report-review work, verify
product-docs:

```bash
test -d ../littleseed-money-product-docs
```

Read core docs:

- `../littleseed-money-product-docs/docs/AI_DEVELOPMENT_GUARDRAILS.md`
- `../littleseed-money-product-docs/docs/PHASE_SCOPE_LOCK.md`
- `../littleseed-money-product-docs/docs/PR_ACCEPTANCE_CHECKLIST.md`
- `../littleseed-money-product-docs/docs/00_NAMING_AND_BRAND.md`
- `../littleseed-money-product-docs/docs/01_PRODUCT_MANIFESTO.md`
- `../littleseed-money-product-docs/docs/02_VISION.md`
- `../littleseed-money-product-docs/docs/03_PRODUCT_REQUIREMENTS.md`
- `../littleseed-money-product-docs/docs/04_ROADMAP.md`
- `../littleseed-money-product-docs/docs/18_DESIGN_SYSTEM.md`
- `../littleseed-money-product-docs/docs/19_CONTENT_DESIGN_AND_CHANNEL_COPY.md`
- `../littleseed-money-product-docs/docs/20_FINANCIAL_REPORT_UX.md`
- `../littleseed-money-product-docs/docs/24_WEB_APP_UX_STANDARDS.md`

Read local engineering standards:

- `docs/CODING_STANDARDS.md`

Add task-specific docs:

- Financial model claims or disclaimers: `06_FINANCIAL_MODELS`,
  `07_EVIDENCE_BASED_GUIDANCE`, `13_MODEL_RISK_AND_COMPLIANCE`
- AI explanations or coaching copy: `08_AI_ROADMAP`,
  `17_FINANCIAL_COACHING_KNOWLEDGE_FRAMEWORK`,
  `22_AI_COACH_AND_WORKSPACE_REQUIREMENTS`
- Platform API contracts or report-review integration:
  `10_PLATFORM_ARCHITECTURE`, `14_TARGET_ARCHITECTURE`
- Education, publishing, or dev blog: `11_MOVEMENT_AND_EDUCATION`,
  `12_PUBLISHING_PLAN`, `21_CONTENT_AND_DEV_BLOG_SYSTEM`
- Charge Inspector or CSV transaction inspection:
  `25_CHARGE_INSPECTOR_WEDGE`, `26_WEDGE_FIRST_ROADMAP_PROPOSAL`

If product-docs is unavailable, ask for the relevant documents instead of
guessing brand, product, compliance, or user-facing requirements.

## Start-of-Work Check

Before editing:

1. Run `git status --short` in this repo.
2. Run `git status --short` in `../littleseed-money-product-docs` when product
   meaning, roadmap, content, brand, AI, report UX, or compliance may affect
   the task.
3. Inspect relevant local diffs before relying on changed files.
4. Before creating a new branch, check whether the current branch is an
   unmerged PR branch and whether uncommitted or untracked files overlap the
   planned files.
5. Do not create a new branch from an unmerged work branch when the next task is
   likely to touch the same files. Wait for merge, rebase from the merged base,
   or ask the user for explicit stacked-branch approval.
6. Untracked files may be ignored only after confirming they do not overlap the
   planned work or collide with the target base branch.
7. Do not overwrite unrelated user changes.

Before non-trivial work, give the user a short pre-brief: what will change,
affected surface/docs, expected benefit, risks/boundaries, and verification
path.

## Repository Map

- `app/page.tsx`: public landing page.
- `app/private/report-review`: private dynamic report-review surface.
- `components`: shared landing and report-review UI.
- `lib/report-review`: platform parsing, mapping, sample/manual data, and API
  request helpers.
- `data/report-review-sample.ts`: sample report-review fallback data.
- `public/brand`: brand marks and social assets.
- `tailwind.config.ts` and `app/globals.css`: brand styling.

## Landing and Brand Rules

- Keep copy clear, calm, trustworthy, and education-first.
- Do not overstate product readiness, financial outcomes, AI capability, or
  automation.
- Preserve the education boundary: no individualized legal, tax, or investment
  advice.
- Keep public claims consistent with product-docs.
- Prefer visible assumptions and limitations over confident-sounding claims.
- Keep AI language grounded in calculated results; AI is not the source of
  truth.
- Preserve accessibility, responsive behavior, readable contrast, and existing
  brand assets unless product-docs justifies a change.

## Report-Review Rules

`/private/report-review` is a validation workspace, not a public consumer
promise.

- Keep it dynamic and safe to load without a platform API.
- Do not persist user-entered or sample financial profiles from this repo.
- Preserve clear connection notices for platform data, manual platform data,
  and sample fallback data.
- Parse platform responses strictly enough to catch contract drift.
- Distinguish reported, calculated, missing, uncertain, assumed, and
  evidence-backed values.
- Do not treat missing optional financial values as zero.
- Keep disclaimers and limitation text visible with calculated report output.
- Check platform docs and code before changing API request/response
  expectations.

## Engineering Log and Sync

Canonical log:

```text
../littleseed-money-product-docs/docs/ENGINEERING_LOG.md
```

For non-trivial PRs:

1. Update or explicitly check the canonical log.
2. Check whether product-docs or platform needs matching changes.
3. Record sync status and verification in the PR body.

Do not create a landing-local engineering log.

## Verification

```bash
npm install
npm run dev
npm run lint
npm run build
```

`npm run lint` currently runs `tsc --noEmit`. Use it for TypeScript changes.
Use `npm run build` before accepting non-trivial UI, routing, metadata, or
integration changes.

For private report-review API integration:

```bash
LITTLESEED_PLATFORM_API_URL=http://127.0.0.1:8000 npm run dev
```

When `LITTLESEED_PLATFORM_API_URL` is unset or the platform request fails,
`/private/report-review` must fall back to sample data and clearly show the
connection state.

Visually inspect `/` after substantial landing changes and
`/private/report-review` after report-review changes, including responsive
states and sample fallback.

## Business Decision Escalation

Ask the user before finalizing metric definitions, thresholds, sensitive-data
inputs, guidance priorities, referral triggers, compliance boundaries,
user-facing claims, paid vendor commitments, roadmap scope changes, or
backward-incompatible platform contracts.
