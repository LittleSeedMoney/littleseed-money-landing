# LittleSeed Money Landing Guidance

This repository contains the public LittleSeed Money landing experience, brand
assets, education-facing content, and the private report-review UI used to
validate financial report structure and platform integration.

## Required Product Context

Before substantial work, read product requirements from the sibling private
product-docs repository at:

```text
../littleseed-money-product-docs
```

From the landing repository root, verify it with:

```bash
test -d ../littleseed-money-product-docs && ls ../littleseed-money-product-docs/docs
```

Do not search only for a generic name such as `product-docs`; the repository is
named `littleseed-money-product-docs`. If the exact sibling path is missing,
look one directory up for `littleseed-money-product-docs` before asking the
user for documents.

Read these core documents before substantial landing, brand, content, or
report-review work:

- `docs/00_NAMING_AND_BRAND.md`
- `docs/01_PRODUCT_MANIFESTO.md`
- `docs/02_VISION.md`
- `docs/03_PRODUCT_REQUIREMENTS.md`
- `docs/04_ROADMAP.md`
- `docs/18_DESIGN_SYSTEM.md`
- `docs/19_CONTENT_DESIGN_AND_CHANNEL_COPY.md`
- `docs/20_FINANCIAL_REPORT_UX.md`
- `docs/21_CONTENT_AND_DEV_BLOG_SYSTEM.md`
- `docs/24_WEB_APP_UX_STANDARDS.md`

Also read task-specific documents when the work touches that area:

- Public claims about financial models, evidence, calculations, or disclaimers:
  `docs/06_FINANCIAL_MODELS.md`, `docs/07_EVIDENCE_BASED_GUIDANCE.md`,
  `docs/13_MODEL_RISK_AND_COMPLIANCE.md`
- AI explanations, coaching, or generated guidance copy:
  `docs/08_AI_ROADMAP.md`,
  `docs/17_FINANCIAL_COACHING_KNOWLEDGE_FRAMEWORK.md`,
  `docs/22_AI_COACH_AND_WORKSPACE_REQUIREMENTS.md`
- Platform API contracts, private report-review integration, service
  boundaries, deployment, or infrastructure:
  `docs/10_PLATFORM_ARCHITECTURE.md`, `docs/14_TARGET_ARCHITECTURE.md`
- Education, movement pages, lessons, publishing, dev blog, or content systems:
  `docs/11_MOVEMENT_AND_EDUCATION.md`, `docs/12_PUBLISHING_PLAN.md`,
  `docs/17_FINANCIAL_COACHING_KNOWLEDGE_FRAMEWORK.md`,
  `docs/21_CONTENT_AND_DEV_BLOG_SYSTEM.md`

If a document has changed locally, read its diff as well as the file. If a new
product-docs file appears and its title or contents match the task scope, read
it before proceeding and consider whether this `AGENTS.md` checklist should be
updated.

If the product-docs repository is unavailable, ask for the relevant documents
instead of guessing brand, product, compliance, or user-facing requirements.

## Start-of-Work Check

Before starting implementation or review:

1. Run `git status --short` in `littleseed-money-landing`.
2. Run `git status --short` in `../littleseed-money-product-docs` when product
   requirements, roadmap, content, brand, AI, report UX, or compliance may
   affect the task.
3. If either repository has uncommitted changes, inspect the relevant diffs
   before assuming the docs or code are current.
4. Do not overwrite unrelated user changes.
5. When product-docs changed, treat those documents as the source of product
   meaning and check whether landing copy, report-review UI, or platform
   integration contracts need updates.

## Development Pre-Brief

Before non-trivial implementation, give the user a short pre-brief before
editing code or docs. Include:

- What will be developed or changed.
- Which repository, module, API contract, UI surface, or document is likely to
  be affected.
- The expected benefit or product/developer impact.
- Material risk factors, trade-offs, scope boundaries, or assumptions.
- The planned verification path.

For small mechanical fixes, one concise paragraph is enough. For larger
cross-repository or user-facing work, use bullets. If the scope changes
materially during development, update the user before continuing.

## Repository Map

- `app/page.tsx`: public landing page.
- `app/layout.tsx`: app metadata and root layout.
- `app/private/report-review`: private, dynamic report-review surface.
- `components`: shared landing components and report-review UI sections.
- `lib/report-review`: platform response parsing, mapping, sample/manual
  report data loading, and API request helpers.
- `data/report-review-sample.ts`: sample report-review data shown when the
  platform API is unavailable.
- `public/brand`: brand marks, social images, and profile/cover assets.
- `tailwind.config.ts` and `app/globals.css`: brand colors, typography, and
  global styling.

## Development Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

`npm run lint` currently runs `tsc --noEmit`. Use it as the lightweight local
type-check gate. Use `npm run build` before accepting non-trivial UI, routing,
metadata, or integration changes.

For private report-review API integration:

```bash
LITTLESEED_PLATFORM_API_URL=http://127.0.0.1:8000 npm run dev
```

`LITTLESEED_PLATFORM_API_URL` is server-side only. When it is unset or the
platform request fails, `/private/report-review` must fall back to sample data
and clearly show the connection state.

## Landing and Brand Standards

LittleSeed Money should feel clear, calm, trustworthy, and education-first.

- Keep the core promise grounded in understanding, comparison, and wise growth.
- Do not overstate product readiness, financial outcomes, AI capability, or
  platform automation.
- Preserve the educational boundary: the app does not provide individualized
  legal, tax, or investment advice.
- Keep public copy consistent with the brand language in product-docs.
- Prefer visible assumptions, transparent limitations, and plain-language
  explanations over confident-sounding claims.
- Make AI supporting language specific and grounded in calculated results; AI
  is not the brand boundary or the product's source of truth.
- Keep accessibility, responsive behavior, and readable contrast in scope for
  every UI change.
- Reuse the existing seed/earth palette, display/body type choices, and brand
  assets unless the design-system docs justify a change.

## Report-Review Standards

The private report-review surface is a validation workspace, not a public
consumer promise.

- Keep `/private/report-review` dynamic and safe to load without a platform API.
- Do not persist user-entered or sample financial profiles from this repository.
- Preserve clear connection notices for platform data, manual platform data,
  and sample fallback data.
- Keep platform response parsing strict enough to catch contract drift, but map
  platform data into UI-friendly copy and sections.
- Distinguish reported values, calculated values, missing values, uncertainty,
  assumptions, limitations, and evidence sources.
- Do not treat missing optional financial values as zero.
- Keep disclaimers and limitation text visible when showing calculated report
  output.
- When changing API request or response expectations, check platform docs and
  the corresponding platform code before updating this repository.

## Git and Pull Request Workflow

Treat commit, push, and pull request as separate steps:

- A commit records a coherent local change in the branch history.
- A push publishes local commits to the GitHub remote.
- A pull request asks to review and merge one branch into another branch.

For non-trivial public, application, integration, or documentation changes,
prefer a branch-based workflow:

```text
create feature branch
-> implement change
-> add or update focused tests or fixtures when useful
-> run relevant verification
-> commit
-> push branch
-> open pull request
-> review CI and feedback
-> merge
```

Avoid pushing directly to `main` unless the user explicitly asks for it or the
change is a small repository-maintenance task where direct push is clearly
acceptable.

## Cross-Repository Sync

When landing work changes product meaning, public messaging, roadmap wording,
report UX, platform API assumptions, compliance boundaries, or user-facing
claims, check whether product-docs should be updated in the same work item.

If product-docs should change but cannot be updated in the same turn or branch,
record that as an explicit follow-up in the final response. Do not let stale
cross-repo checklist items remain implicit.

## Verification

Before accepting changes:

- Run `npm run lint` for TypeScript changes.
- Run `npm run build` for non-trivial UI, routing, metadata, or integration
  changes.
- Visually inspect `/` after substantial landing changes.
- Visually inspect `/private/report-review` after report-review changes,
  including the sample fallback state when the platform API is unavailable.
- Validate responsive behavior for meaningful layout changes.
- If tests are not added because the change is docs-only, asset-only,
  copy-only, or otherwise not meaningfully testable, state that explicitly.

## Business Decision Escalation

Continue ordinary engineering work autonomously. Ask the user before finalizing
metric definitions with multiple valid interpretations, health thresholds,
sensitive-data inputs, guidance priorities, referral triggers, compliance
boundaries, user-facing claims, paid vendor commitments, roadmap scope changes,
or backward-incompatible platform contracts.

State the decision, recommend one option, show alternatives and impact, then
continue any work that is not blocked by that choice.
