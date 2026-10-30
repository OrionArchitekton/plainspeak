---
verified: 2026-10-28
review_after: 2026-11-28
topics: [deployment, privacy, rollback]
references: [package.json, pnpm-lock.yaml, .env.example, app/api/explain/route.ts, app/PlainspeakApp.tsx]
---

# Deploy and operate Plainspeak

This is a source/deploy guide, not a claim that a hosted service has been released. The source is MIT licensed with Dan's approval.

## Local production validation

Use Node.js 22+ and pnpm:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm start --hostname 127.0.0.1
```

Open `http://localhost:3000/?demo=lease`. Check the saved-example label, readable results and the privacy/advice notice. This uses no API key or live model call. For live text, supply your own server-side key in ignored `.env.local` and restart. Use only fictional or redacted input and explicitly approve provider usage first.

## Hosted option: Vercel

1. Fork the approved source into your own account. In Vercel, create a new project and import that repository. Select the Next.js preset; install with `pnpm install --frozen-lockfile`, build with `pnpm build`.
2. Add `ANTHROPIC_API_KEY` as a server-side environment secret for the intended environment, never as `NEXT_PUBLIC_*`. Optionally set `ANTHROPIC_MODEL`. New environment settings apply to a new deployment; see [Vercel's guide](https://vercel.com/docs/environment-variables).
3. Use deployment protection or an authenticated access layer for initial review. Configure provider budget controls. This app has no user authentication, customer billing or monthly quotas.
4. Optionally configure both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or the `KV_REST_API_*` aliases). Do not enable Redis analytics or request-body logging. This stores per-client rate counters/identifiers, not documents. A configured limiter fails closed with 503 if Redis is unavailable. Invalid input is rejected before using a limiter slot. Per-IP limits are still not a budget boundary.
5. Review the host/proxy's log collection and retention, suppress request/response-body capture and keep private material out of test requests. Confirm provider retention terms separately. No database or document volume is needed.
6. Initiate a production deployment only with the operator's approval for that project and hosting/provider costs. A connected Git production branch may deploy automatically on merge; check that setting before merging. Deployment approval does not authorize creating credentials or changing shared environment secrets.

## Consumer validation and monitoring

The explanation function allows 60 seconds. A shared 55-second request deadline
covers body reads, rate-limit lookup and both the draft and audit calls. The
provider client uses a 50-second per-call timeout and no automatic retries; both
calls also receive the shared abort signal. Each output budget is 2,000 tokens.
Expiry aborts the active provider call and returns a generic no-store error;
an audit that cannot complete never permits the draft. Verify the deployed detailed fixture completes,
including responses longer than the former 30-second limit, and monitor platform
timeouts separately from application 502 errors. Do not raise the token budget or
add retry attempts to hide a timeout. A rollback returns to the prior function
configuration; retain its deployment identity before release.

Load the input page and frozen demo on desktop and mobile. The privacy notice must appear before any submit. An authorized synthetic live explanation should render all result sections; malformed text/oversized documents should return 400, request bodies over 128 KiB should return 413 before JSON parsing or quota use, and errors must omit provider details. Successful and error API responses request no-store caching. Check rate-limit behavior when configured: outages or malformed limiter results must return 503 without a model call. Never infer spend safety from per-IP limits. Watch request status/error counts and provider spend, without capturing documents or response bodies.

The app does not persist documents; the provider and hosting stack have their own handling. Do not market this as zero retention, offline, professional advice or suitable for regulated medical records. The model can be wrong; validate against original text.

For the liability-exception regression, repeat the unchanged fictional request and compare the returned and rendered result against `evals/README.md`. Keep private request/response and screenshot evidence. Verify the exception's meaning in every restated cap, including paraphrases; keyword matches alone are insufficient. A prompt instruction and one live result cannot guarantee general factual completeness. Do not capture real customer documents for this check.

For refund-branch and payment-based-cap regressions, repeat the workshop and subscription fixtures at their original reading levels and situations. Review every generated explanation and impact point against the criteria in `evals/README.md`; do not count source text visible in the input form as generated coverage. Retain the exact submitted request, response and desktop/mobile rendering privately. Wait for the result animation to settle before screenshots; scroll the submit button into view and verify that exactly one actual request was sent before retrying an uncertain browser action. Use the public alias for public-app verification; do not create deployment-protection bypass tokens for this check.

## Rollback

Use Vercel's deployment history to restore the previously approved deployment after checking environment compatibility, or stop the local server with Ctrl+C. Stop external access if spend or privacy handling is unclear. No document database migration is involved. Preserve any rate-limit store settings separately; do not delete shared stores. Before selling a hosted tier, add and test authentication, enforceable quotas, billing/cancellation, spend limits and support terms under a separate implementation review.

## Independent explanation audit

The verified flow makes at most two model calls: one draft and one source audit,
with no SDK retries and at most 2,000 output tokens each. A single 55-second budget
covers request reading, the configured limiter and both calls under the existing
60-second host allowance. The first call can consume most of this budget; an audit
that cannot finish is refused. Monitor 422 verification refusals separately from
provider/deadline 502 failures. No failed or unavailable audit permits a draft.

A200 response means the independent model audit passed structural coverage checks;
it is not a guarantee of factual correctness. Context classifications and semantic
judgments remain fallible. Exact source/draft identifiers and evidence references
prevent missing audit rows, not dishonest or mistaken model judgments. The public
privacy/advice notice still applies. Do not log bodies, drafts, audit reasons or
keys, and do not add automatic retries for refusals.

Before production, run the six fictional audit cases in
`evals/fixtures/verification-cases.json` using `node --experimental-strip-types
evals/run-verification.mjs --dry-run` first. A live run requires explicitly approved
provider usage and the existing server key supplied securely in the process
environment; never paste or persist it. Use `--output-dir` with a new private
receipt directory. The harness runs at most six audit calls, no retries,50 seconds
and 2,000 output tokens per call. It records actual usage/latency and raw fictional
audits privately. Truncation or malformed output is a protocol failure, not proof
of semantic rejection. Inspect each audit against its source and preserved bad
answer; source-preserving positive controls test false rejection, not prose quality.

Measure full two-call requests locally or in an authenticated preview before
production. Do not create protection-bypass tokens or export credentials merely
to reach a preview. The protected preview requires an existing Vercel sign-in;
request operator action if unavailable. Complete the reviewed source PR while
access is pending, retain all failed results and withhold production admission
until actual feasibility measurements exist.

After admission, repeat all three unchanged fixtures and inspect the real public
response and desktop/mobile state. A refusal must show the clear error and no
draft, with no silent fallback. Report each accurate explanation or refusal
individually. Roll back through a normal revert/restoration of the previous approved
deployment; no environment, database or protection change is required.
