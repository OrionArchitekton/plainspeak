# Explanation Verification Implementation Plan

> Execute inline in the claimed isolated worktree, following the approved two-call design and one RED/GREEN slice at a time.

**Goal:** Withhold generated explanations unless a separate source comparison produces a structurally complete positive audit.

**Architecture:** A pure audit contract assigns source/draft identifiers and validates an independent model judgment. The existing POST handler generates a draft, audits it, and exposes only an approved draft. One invocation deadline bounds the two calls and pre-call work.

**Tech stack:** Existing Next.js, Anthropic SDK, TypeScript, Vitest; no new dependencies.

- [ ] Slice 1: POST rejects a draft on independent audit rejection, never returns draft content. Add one failing handler test; implement smallest two-call path and strict positive audit shape; update valid provider stubs. Test normal success and preserved malformed-draft rejection. Commit.
- [ ] Slice 2: Audit coverage cannot be passed by omitting source units, duplicated/unknown identifiers, missing evidence, unreviewed impacts, malformed status or reported issues. Add one failing guard at a time in lib/verification.test.ts; implement the pure contract in lib/verification.ts. Exercise at POST seam. Commit.
- [ ] Slice 3: Deadline, truncation and provider rejection abort fail closed with no-store and no extra calls. Fake time at POST seam; implement shared 55-second budget with bounded provider signals and body/limiter waits. Commit.
- [ ] Slice 4: Reuse preserved bad responses as private prototype inputs; measure real independent audit rejection and accurate controls before production. Use existing credential/session access only; never create bypass tokens or export secrets. If access requires new authority, finish all reversible source/review work then name the exact needed access.
- [ ] Final: full tests, TypeScript/build, clean secret scan, diff-fed correctness/adversarial/six-class security review. Document operator latency/usage/rejection/rollback. PR with current-head CI/review, normal merge/deploy only after measured feasibility. Retest unchanged requests once each and inspect returned errors or verified answers plus settled desktop/mobile evidence. Preserve all failures.
