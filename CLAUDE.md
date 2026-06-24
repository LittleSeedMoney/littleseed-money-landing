# Claude Code Guidelines — littleseed-money-landing

## Code Review Workflow

When asked to review a PR, follow this workflow exactly.

### Step 1: Research

1. Fetch PR metadata and diff from GitHub.
2. Check out the branch locally.
3. Run `npm test`, `npm run lint` (`tsc --noEmit`), and `npm run build`. Report actual results — do not assume they pass.

### Step 2: Top-level structured comment

Post a single top-level comment with all of the following sections in order:

```
# PR #N 코드 리뷰 — <PR title>

## 무엇이 바뀌었나
<1-3 sentences on what changed and why it matters>

## 왜 이 방향인가
<Was this the right architectural choice? Could it have been simpler?>

---

## Must (blocking)
<List issues that MUST be resolved before merge. If none, write "없습니다.">

---

## Should (non-blocking)
<List issues worth fixing but not blockers. Label each clearly.>

---

## 나라도 이렇게 짰을까
<Pick 1-3 specific code decisions. Show actual before/after code blocks.
If you would have written it the same way, say so and explain why.>

---

## 제품 안전 / 로드맵 일관성
<See "Product Safety Reviewer" section below. Always include this.>

---

## 검증 결과
<Exact output of npm test / npm run lint / npm run build>

---

## 최종 판단
<머지 권장 / 수정 후 머지 / 머지 반대 — one line with reason>
```

### Step 3: Inline comments

For every must or should issue, also post an inline comment on the specific line(s) in the diff. Use `[must]` or `[should]` prefix. Show before/after code in the comment body.

---

## must / should Distinction

- **must**: Causes a real bug, security issue, data loss, phase scope violation, or contract breakage. Block the PR.
- **should**: Worth fixing — DRY violation, misleading name, missing test path — but not a blocker.

---

## 나라도 이렇게 짰을까 Rules

- Always pick at least one decision and evaluate it honestly.
- If the code is good, say so with a reason — don't manufacture complaints.
- Show actual code. Generic observations without code are not useful.
- Compare to a concrete alternative when you think a different approach is better.

---

## Product Safety Reviewer

For every PR, include a **"제품 안전 / 로드맵 일관성"** section in the top-level comment. Evaluate these five points:

### 1. Phase scope
Does this PR stay within the intended phase boundary?

- **Phase 1**: Public marketing/landing pages only. No private routes, no auth, no data collection.
- **Phase 2**: Private `/private/report-review` surface. Read-only report display. No persistence, no account linking.
- **Phase 3**: Manual input form at `/private/report-review`. In-session state only. No persistence, no account linking, no dashboard.
- **Phase 4**: Private/dev guarded AI explanation prototype inside approved report-review surfaces only. Server-owned context packs, approved knowledge corpus, source/evidence/limitation/version display, no saved AI history, no account linking, no raw transaction prompting, no public chatbot.
- **Future (not yet scoped)**: Persistence, user accounts, saved reports, notifications, billing.

If the PR adds functionality that belongs to a future phase, that is a **must** block.

### 2. Persistence / account linking / security-sensitive behavior
Does the PR introduce any of the following? Each is a **must** block unless explicitly in scope:
- Writing to a database or external store
- Reading/writing user identity tokens or session state
- Storing PII or financial data beyond in-request scope
- OAuth, auth cookies, or account linking
- Hardcoded secrets or credentials
- Server actions that mutate state across requests

### 3. Financial advice
Does the PR display content that could be read as personalized financial advice (e.g., "you should invest X", "this is the right decision for you")?

- Displaying computed values from the platform is allowed.
- Phrasing that advises a specific financial action without a clear disclaimer is a **must** block.

### 4. Schema / contract drift
Does the PR change or extend a type, API shape, or data contract that other components depend on?

Check:
- `ManualProfileValues`, `ManualProfileRequest`, `ManualAssetValue`, `ManualDebtValue`
- Platform API request/response shapes (`platform-workspace-response.ts`, `platform-report.ts`)
- Route handler request/response shapes

If a change breaks backward compatibility with the platform API contract, it is a **must** block unless the platform PR is confirmed as in sync.

### 5. Test meaningfulness
Are the new or changed tests actually exercising the behavior being added?

Red flags:
- Tests that only assert types compile (no runtime assertions)
- Tests that always pass regardless of logic changes
- Zero new tests for new validation paths
- Tests that mock the thing being tested

### Top 5 risks before merge

Always list exactly 5 risks, even if some are low. Format:

```
1. [severity: high/medium/low] <risk description>
2. ...
```

If 2+ risks are high, add a recommendation to address them before merge. If a scope violation is present, set the PR verdict to **머지 반대** and explain why.

---

## Local development

```bash
npm test          # node --test (auto-discovery, NOT node --test tests)
npm run lint      # tsc --noEmit
npm run build     # next build
```

- Node version: 22.22.2
- Test runner: `node --test` with `sucrase/register/ts` for TypeScript
- `@/` path alias works in Next.js but not in the test runner — use relative imports in files loaded by tests

## Color palette

- `seed-*`: 50–950 (full range)
- `earth-*`: 50–900 only — **no `earth-950`**, use `seed-950` instead
