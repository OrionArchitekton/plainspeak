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

Load the input page and frozen demo on desktop and mobile. The privacy notice must appear before any submit. An authorized synthetic live explanation should render all result sections; malformed text/oversized documents should return 400, request bodies over 128 KiB should return 413 before JSON parsing or quota use, and errors must omit provider details. Successful and error API responses request no-store caching. Check rate-limit behavior when configured: outages or malformed limiter results must return 503 without a model call. Never infer spend safety from per-IP limits. Watch request status/error counts and provider spend, without capturing documents or response bodies.

The app does not persist documents; the provider and hosting stack have their own handling. Do not market this as zero retention, offline, professional advice or suitable for regulated medical records. The model can be wrong; validate against original text.

For the liability-exception regression, repeat the unchanged fictional request and compare the returned and rendered result against `evals/README.md`. Keep private request/response and screenshot evidence. Verify the exception's meaning in every restated cap, including paraphrases; keyword matches alone are insufficient. A prompt instruction and one live result cannot guarantee general factual completeness. Do not capture real customer documents for this check.

For refund-branch and payment-based-cap regressions, repeat the workshop and subscription fixtures at their original reading levels and situations. Review every generated explanation and impact point against the criteria in `evals/README.md`; do not count source text visible in the input form as generated coverage. Retain the exact submitted request, response and desktop/mobile rendering privately. Wait for the result animation to settle before screenshots; scroll the submit button into view and verify that exactly one actual request was sent before retrying an uncertain browser action. Use the public alias for public-app verification; do not create deployment-protection bypass tokens for this check.

## Rollback

Use Vercel's deployment history to restore the previously approved deployment after checking environment compatibility, or stop the local server with Ctrl+C. Stop external access if spend or privacy handling is unclear. No document database migration is involved. Preserve any rate-limit store settings separately; do not delete shared stores. Before selling a hosted tier, add and test authentication, enforceable quotas, billing/cancellation, spend limits and support terms under a separate implementation review.
