# Fictional content regressions

These evaluations require semantic comparison of actual responses with the unchanged source documents. Prompt-contract tests protect generation instructions; they do not prove model accuracy. Retain real submitted requests, responses and rendered captures. A passing case does not establish general completeness. Do not substitute keyword-based automatic verdicts.

## Liability exception

Submit `fixtures/liability-exception.json` through the deployed app without changing the document, reading level or situation. This is a fictional content evaluation; run it only with authorized provider usage.

The original live result incorrectly described liability as capped at a maximum of $360 without retaining the deliberate-misconduct exception. That result fails this case.

Acceptance requires direct comparison of the returned explanation and rendered page with the fixture:

- Both the plain explanation and at least one impact point must explain the liability cap and its deliberate-misconduct exception. Omitting the cap or the entire liability clause fails this case.
- Every restated liability cap must keep its deliberate-misconduct exception in the same sentence or impact point. Include paraphrases such as "the most the provider would have to pay" or "maximum payment" when checking.
- The exception must actually apply to deliberate misconduct. An exception for late fees alongside a statement that misconduct remains capped fails. An exception mentioned only in a question also fails.
- Equivalent plain-language wording is valid, including that deliberate misconduct is outside or excluded from the cap. No contradictory unconditional maximum may appear elsewhere.
- Verify the other material terms: $180/month, $75 plus parts with prior written approval, 10 calendar days' written cancellation notice, refunds for unused prepaid full months within 14 days, and no automatic renewal.
- Retain a private capture of the actual submitted request, HTTP response and rendered result. A cached sample, prompt-text assertion or fabricated reference answer cannot establish live success.

This requires content review; there is no keyword-based automatic PASS. One passing fictional case does not establish general factual completeness.

## Workshop refunds

Repeat `fixtures/workshop-refunds.json` unchanged, including the child reading level and situation. The prior result omitted the ordinary timely-cancellation refund rule and said five days was too late for any refund while explaining overrides only elsewhere. It also assumed a full $240 had been paid.

- The generated plain explanation must cover the $240 total ($60 deposit included, $180 remaining due seven calendar days before start), both ordinary cancellation branches, the $12 deduction and the overriding exceptions. A generic statement that cancellation rules exist fails; personalization must not remove the early-cancellation branch.
- Written cancellation received at least seven calendar days before start refunds payments less $12. A later ordinary cancellation is non-refundable, subject to the Studio-cancellation and qualifying-evacuation overrides. Each restated no-refund rule must retain those overrides in the same explanation sentence or impact point, even if another point explains them.
- Studio cancellation refunds all amounts actually paid, including the booking fee. Do not promise $240 without a document-established payment amount. If applying a reader-reported payment, explicitly keep the calculation conditional on that report; do not present it as verified.
- The evacuation override refunds all payments including the booking fee only for an official order preventing event-day venue access AND written notice before scheduled start. Bad weather alone and a change of mind do not qualify. Both conditions must stay with any description of that override.
- Refunds due are paid within ten business days after a valid request, not ten calendar days or a ten-day deadline for requesting a refund.
- In the generated plain explanation as well as impact points, a late-cancellation outcome must retain its documented overrides locally. Bad weather or a change of mind does not activate the evacuation override; it must not be described as eliminating an otherwise timely ordinary-cancellation refund. Preserve these distinctions even when discussing the reader's late-cancellation scenario.
- Keep the seven-calendar-day deadline relative to the scheduled start; do not replace it with a computed date-only cutoff. The ordinary cancellation and evacuation notices must be written, but the source does not require the separate refund request to use a particular method. Do not add that requirement or describe Studio cancellation as removing the general refund-processing terms.
- Compare generated sections, not the input form. Review every restatement, including personalized points and any calculations. Correct wording in a question or a different point does not repair a contradictory unconditional statement.

## Subscription payment-based cap

Repeat `fixtures/subscription-liability.json` unchanged, including the detailed reading level and situation. The prior response correctly distinguished the separate exceptions but repeatedly called the ordinary formula a "$90 cap" despite an unknown payment history.

- Preserve $30/month, the 23:59 UTC cutoff on the calendar day before next billing, and access through the current paid period after cancellation.
- Ordinary mid-month cancellation is not refundable; the duplicate amount is refunded in full only if reported within thirty calendar days of that charge. Keep the reporting condition with the exception.
- Every cap restatement must retain the subscription-fees-actually-paid formula for the three months preceding the claim, and its fraud and unauthorized-confidential-disclosure exceptions. An ordinary-mistake point may explicitly limit itself to ordinary liability, but must not imply its cap also covers the exceptional cases.
- No payment history is supplied. Do not invent a fixed $90 cap, including in headings or impact points. A truthful illustration is valid only if each numeric restatement explicitly remains conditional on its assumed payments within the three-month reference period; it must not be renamed the actual cap. If fewer fees were actually paid, the formula produces a different amount. Judge the meaning, not the presence of the characters `90`.
- Lost profits remain a separate exclusion, with the narrower exception for loss directly caused by provider fraud. Unauthorized disclosure without fraud removes the liability cap but does not remove the lost-profits exclusion. Do not merge the two sets of exceptions or promise an automatic recovery.
- Keep actual request, response and rendered evidence. Transport success, prompt-text assertions and a saved reference answer cannot establish this case's outcome.

## Warranty regression

Repeat `fixtures/warranty-exclusions.json` unchanged at the plain reading level and original situation. Retain twelve months from delivery and manufacturing-defect coverage including **both parts and labor**, with repair/replacement at the provider's choice. Preserve the original-cartridge/intact-original-seal-at-failure carve-back and refilled-cartridge exclusion. Third-party repair excludes only damage it caused; prior repair followed by a leak does not establish that the events are causally related or unrelated. Preserve the documented shipping reimbursement up to $20 only after a confirmed manufacturing defect, and the $35 inspection fee only when no manufacturing defect is found AND prior written consent was given. Do not turn possible inspection/dispute procedures into source-established facts. Inspect the actual response and settled desktop/mobile render; omission of covered parts and labor is a regression even if exclusions are retained.

## Independent audit prototype

verification-cases.json preserves the three bad production answers and three
accurate controls, with their original source requests. Do not edit fixtures or
labels to obtain a pass. Malformed, truncated or unavailable output is not a
semantic rejection. Every defect must be genuine; positive controls reproduce
the source and preserve impact qualifications, rather than proving simplification
quality. All original acceptance criteria above remain in force.

The evaluator and app share the pinned Opus 4.6 audit builder and response reader,
with thinking disabled, one forced report and a 2,000-token output cap. The draft
retains its configured model and its own 2,000-token cap. No new key/environment
setting is needed. A model change is a hypothesis, not evidence of accuracy.

Run `node --experimental-strip-types evals/run-verification.mjs --dry-run` without
provider calls. Explicit live use needs approved existing-key/provider authority
and `--output-dir NEW_PRIVATE_PATH`; an existing leaf is rejected before calls.
The harness makes exactly six attempts, no retries, at most 50 seconds each, and
retains input hashes, returned model identity, raw reports, usage and latency.
Unknown usage is not zero. Checks of references/quotes/format do not establish
whether a semantic judgment is true.

The audit compares collective source coverage and each unit's local conditions.
Other paragraphs and questions cannot cure an unconditional claim. It must not
assume independent causes are exclusive, confuse due with paid, invent a mandatory
inspection, or turn unknown causation into a negative causal claim. Reasons and
quoted defects stay bounded; full affirmative per-unit evidence is still required.

For cloud measurements, use the nonpublishing build runner in the operator
runbook. First select audits-only for six calls. After every actual audit passes
protocol and manual semantic review, requests-only invokes the three unchanged
compiled requests at that identical source head for at most six further calls.
Bind both native jobs and receipts; cumulative prototype use remains at most 12.
Each phase alone is incomplete full evidence. No repeated audits or automatic
publication is implied. Failed and partial results must remain preserved.

After all audit, paired timing/behavior and source checks pass, the existing
conditional release authority can admit an ordinary production deployment. Then
repeat the original three public-app requests once each and inspect the actual
responses and settled desktop/mobile UI. A 200 must be accurate; a refusal must
be clear and contain no draft. No deadline/provider failure passes the gate.
