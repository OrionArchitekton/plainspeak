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

The audit now records one completed `record_audit` tool response containing source
coverage and a compact evidence-backed check for every draft unit. Reasons are
reserved for at most six decisive defects, with an exact quoted fragment and
reason each limited to 160 characters. The server checks quotes against their
referenced source/draft units; it does not infer whether a complaint is true.
Non-operative context may cite reproduced boilerplate or have no references.
This is a response format only: the application executes no tool and
makes no follow-up model call. Free-text or fenced JSON, missing/extra/wrong tool
calls, incomplete output and invalid evidence fail closed. The evaluator uses
the same request builder, response reader and report validator as the app. A
complete valid report still requires semantic review; structure cannot establish
whether its reasons are true. Coverage is collective; each impact needs only its
own applicable conditions, and equivalent paraphrases are valid. Preserving
uncertainty is different from asserting a negative causal fact. An inspection or
approval prerequisite requires source support. The initial cloud prototype wrongly approved all
three preserved bad answers inside fenced text. Do not deploy by merely removing
those fences or treating those protocol refusals as accurate rejection.

Before production, run the six fictional audit cases in
`evals/fixtures/verification-cases.json` using `node --experimental-strip-types
evals/run-verification.mjs --dry-run` first. A live run requires explicitly approved
provider usage and the existing server key supplied securely in the process
environment; never paste or persist it. Use `--output-dir` with a new private
receipt directory. The harness runs at most six audit calls, no retries, 50 seconds
and 2,000 output tokens per call. It records actual usage/latency and raw fictional
audits privately. Truncation or malformed output is a protocol failure, not proof
of semantic rejection. Inspect each audit against its source and preserved bad
answer; source-preserving positive controls test false rejection, not prose quality.
The harness creates a new private output directory and refuses existing paths.
Individual case receipts are written once; the aggregate is written once after
all six calls. An interrupted run retains its case receipts and must not be
automatically repeated to replace missing aggregate evidence.

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

## Optional build-only cloud prototype

Use this only with explicit authority for the exact reviewed commit and a fresh
12-call ceiling. It is an alternative when the existing write-only credentials
cannot be supplied to a local runtime. Never execute it from default CI or a timer.

In the existing Plainspeak project, override the build command for one test build
only: `pnpm build && node --experimental-strip-types evals/run-build-prototype.mjs
--vercel-build-only`. Use the production environment so the existing configured
key/model are injected by Vercel, and disable domain assignment with
`--prod --skip-domain`. Do not change project settings or environment values.
Verify the team, project, approved commit, clean upload and current public alias
before submitting; identify the one job with unique metadata and retain its URL.

The runner makes six audit calls through the existing bounded harness and invokes
the compiled POST handler for the original three requests, at most two calls each.
It retains all six audits and stops before full requests if any audit protocol
expectation fails. This is an intentionally incomplete full collection; decode
with `allowIncomplete` to inspect the preserved batch, without repeating it.
The limiter is disabled only inside this isolated test process to avoid touching
shared counters. Neither the key nor other project credentials are exported.
Synthetic receipts are redacted and split into bounded integrity-checked frames
in test build logs. Collect authenticated log events, decode their receipt frames
with `decodeBuildReceipts`, retain the results privately and inspect every answer.
The default decoder requires the complete record set; explicit `allowIncomplete`
decoding labels a partial collection as incomplete. A failed audit subprocess
retains completed individual case receipts as partial evidence. Missing or
conflicting frames cannot establish a result. Preserve a partial run;
never resubmit an uncertain job or repeat its calls without new authority.

For an isolated-claim comparison, each non-question draft check records a compact
scenario and source/local outcomes before the final verdict. Supported claims
require matching outcomes. Probe strings are limited to 60 characters. The
model's choice and interpretation of a scenario remain semantic judgments.

The runner exits unsuccessfully even when collection succeeds, intentionally
preventing publication. The expected Vercel state is ERROR for this test job, not
READY. Verify that the original public alias still points to its captured baseline.

When only six authorized calls remain, append `--audits-only` to the explicit
build-only runner invocation. This mode is capped at six audit calls and never
invokes the application, even if all audits pass. Decode with `allowIncomplete`:
`auditBatchComplete` records the six-case phase; the full request collection is
intentionally incomplete. Successful audit-only results do not admit release;
full two-call app timing/behavior and subsequent consumer proof are still needed.
A test build is not a release, a model pass or a browser check. Review protocol,
semantic outcomes, token usage and two-call timings before admitting a normal
release. Default builds still use the ordinary build command and no live test calls.
