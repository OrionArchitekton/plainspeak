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
calls also receive the shared abort signal. The draft output budget is 2,000 tokens;
the audit output budget is also 2,000 tokens, with thinking disabled.
Expiry or reader disconnection aborts the active provider call and returns a generic no-store error;
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

The generation model remains controlled by ANTHROPIC_MODEL (Sonnet 4.6 by
default); the audit is pinned in source to Opus 4.6. Both calls have a 2,000-token
output ceiling and zero retries. The audit has thinking disabled and returns one
forced record_audit report, never an executed tool or a follow-up call. A shared
55-second budget covers all request work within the 60-second host allowance.
Opus has higher per-token rates; inspect actual latency and usage before release.
A model migration alone cannot establish better decisions or safe paired timing.

At most 24 source sentence/nonempty-line units are admitted before quota or draft
work; a normalized draft over 32 units is refused before auditing. The input page
shows the excerpt limit. These bounds contain per-unit report size; truncation
can still occur and never permits the draft. Monitor 422 refusals separately from
provider/deadline 502 failures. Never log source, draft, audit details or keys.

The audit must account for every source/draft identifier exactly once with valid
references. It emits at most six grounded defects, each quote at most 160
characters and reason at most 256. Quotes may come from referenced source or draft
regardless of defect category. Missing/contradiction defects identify source
rules; contradiction/unsupported defects identify draft claims. Positive checks
remain compact. Any negative, incomplete or malformed audit withholds the draft.
A 200 means the model and structural checks passed, not a factual guarantee.
Context classifications and semantic judgments remain fallible.

Run the unchanged six-case harness only with authorized provider use:
`node --experimental-strip-types evals/run-verification.mjs --dry-run` first,
then `--output-dir NEW_PRIVATE_PATH`. Existing paths are refused. Live calls use
the existing key in process memory, at most six calls, 50 seconds and 2,000 output
tokens per call with no retries. Preserve raw fictional reports and actual usage.
Compare every judgment against its source; malformed output is not semantic
rejection. Accurate controls test false refusals, not simplification quality.

No release is admitted until all six audit decisions are correct, full paired
requests fit the deadline and source review/CI pass. After conditional production
release, repeat the original three requests through the actual public app and
inspect responses and settled desktop/mobile state. Clear refusals must show no
draft. No environment, protection, credential or database change is needed.
Rollback through the prior approved deployment or a normal reviewed source revert.

## Optional build-only cloud prototype

Use only under explicit bounded provider authority for the existing Plainspeak
project and reviewed source head. Never run from ordinary CI or a timer. Override
the build command for one build only:
`pnpm build && node --experimental-strip-types evals/run-build-prototype.mjs
--vercel-build-only --audits-only`. Use production configuration and
`--prod --skip-domain`; do not change project build settings or environment values.
Verify team/project, clean upload, exact source, current alias and cumulative call
ledger before submission. Identify each job with unique recovery metadata.

The audits-only phase makes six unchanged audit calls and never invokes the app.
Inspect all six actual judgments, including the financial exception witnesses,
and their protocol/usage/timing. Only after manual admission of that exact source
may a separate test build replace --audits-only with --requests-only. That phase
makes only three original compiled POST requests, at most two model calls each,
and never repeats audits. Bind both jobs to the identical source head and keep
their combined ceiling at 12 calls. Conflicting flags are rejected. The original
full mode remains available under a separate full 12-call plan, stopping before
requests if any audit protocol expectation fails.

Each phase emits started/finished receipts with its six-call ceiling and phase.
Use decodeBuildReceipts with allowIncomplete for separate phases: auditBatchComplete
and requestBatchComplete describe their own collection, while collectionComplete
remains false without a full combined run. Receipt collection is separate from
semantic acceptance. Require all expected records, exact phase, source identity,
frame integrity and native job metadata; missing evidence never counts as a pass.
Preserve partial/failed results and recover uncertain jobs by unique metadata,
without repeating them or their calls.

The limiter is disabled only in the isolated test process; project counters and
settings remain intact. Existing credentials stay in Vercel. Synthetic receipts
are redacted into bounded integrity-checked build-log frames and retained
privately. The runner always exits unsuccessfully to prevent publication. The
expected native state is ERROR and alias assignment false, even when a phase
collects successfully. Verify the public alias still points to its captured
baseline. Never promote or blindly redeploy a test job. Ordinary builds use the
normal build command and make no live evaluation calls.
