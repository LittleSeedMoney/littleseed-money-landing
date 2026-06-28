# CLAUDE.md — littleseed-money-landing

작업 규칙은 [AGENTS.md](./AGENTS.md)를 따른다 (Claude·Codex 공통 정본).

## PR 리뷰

"PR 리뷰 해줘" 요청 시 공통 워크플로 정본을 그대로 따른다:
[../littleseed-money-product-docs/docs/PR_REVIEW_PLAYBOOK.md](../littleseed-money-product-docs/docs/PR_REVIEW_PLAYBOOK.md)

landing 고유 사항만 아래에 둔다.

### 검증 명령 (Step 1 · 검증 결과 섹션)

```bash
npm test          # node --test (auto-discovery, NOT `node --test tests`)
npm run lint      # tsc --noEmit
npm run build     # next build
```

- Node 22.22.2. 테스트 러너는 `node --test` + `sucrase/register/ts`.
- `@/` alias는 Next.js에선 되지만 테스트 러너에선 안 됨 — 테스트가 로드하는
  파일은 상대 경로로 import.

### 확인할 계약 (제품안전 4번 — schema/contract drift)

- `ManualProfileValues`, `ManualProfileRequest`, `ManualAssetValue`,
  `ManualDebtValue`
- 플랫폼 API 요청/응답 (`platform-workspace-response.ts`,
  `platform-report.ts`)
- 라우트 핸들러 요청/응답 형태
- 플랫폼 계약과 backward-incompatible 변경은 매칭 플랫폼 PR이 sync 확인되지 않는
  한 must block.

### Phase 범위

landing 표면별 phase 매핑을 이 파일에 하드코딩하지 않는다. 정본은
[../littleseed-money-product-docs/docs/PHASE_SCOPE_LOCK.md](../littleseed-money-product-docs/docs/PHASE_SCOPE_LOCK.md)이며,
phase scope 판단은 항상 그 문서를 읽어서 한다.

### report-review 규칙

`/private/report-review`는 검증 워크스페이스이지 공개 약속이 아니다. 상세 규칙은
[AGENTS.md](./AGENTS.md)의 "Report-Review Rules" 참조.

### 색상 팔레트

- `seed-*`: 50–950 (full range)
- `earth-*`: 50–900 only — **earth-950 없음**, `seed-950` 사용.
