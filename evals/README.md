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

`verification-cases.json` contains three actual unsuccessful responses from
production merge 5ea5739 and three source-preserving positive controls. They are
fictional, offline evidence, not live answers. The bounded harness is
`node --experimental-strip-types evals/run-verification.mjs --dry-run`; with
explicit provider/key-use authority, pass `--output-dir` pointing to a new private
directory. It makes six audit calls without retries and records latency, tokens,
raw audits and protocol outcomes. Inspect meaning manually. Rejection caused by
invalid/truncated output is not semantic success; accepting accurate controls does
not prove simplification quality. Three full local two-call requests and the final
unchanged public-app requests remain separate acceptance surfaces.

The app and evaluator share the single named audit response format and validation.
Inspect each draft unit's source evidence and source coverage. Successful checks
are compact; reasons and exact quotes are emitted for defects only, with at most
six defects and 160 characters each for quote and reason. A list of reviewed IDs
or a bare positive judgment cannot pass. Quote presence is a structural check,
not proof that the claimed defect exists. Context may reference reproduced
boilerplate; it cannot substitute for operative rule coverage.
Retain the provider's returned model identity, raw content blocks and usage in the
private evaluation receipts. The first cloud run's six fenced outputs all failed
the wire protocol, and their internal judgments incorrectly passed all three bad
answers. A parser-only change would not repair that semantic failure. The revised
format must be measured against the same unchanged cases before any release.
Revision a977aa9 also failed: two reports truncated at 2,000 tokens, the bad
warranty answer passed, and accurate controls were refused. The compact report
and clarified decision scopes must address both report size and actual semantic
decisions. Distinguish uncertainty from a negative causal finding, equivalent
exceptions from contradictory outcomes, and source-established procedures from
plausible extra prerequisites. Do not change the fixtures to obtain a pass.

When separately approved, `run-build-prototype.mjs --vercel-build-only` runs the
same bounded evaluation with Vercel's existing production configuration, followed
by three compiled POST-handler requests. It always stops build publication. This
is an alternative to local key access, not an automatic CI step. Its synthetic
receipt frames can be reconstructed with the exported `decodeBuildReceipts`;
missing/conflicting frames fail validation. See the operator runbook for the
exact target, approval, call ceiling and public-alias checks. Full deployed HTTP
and desktop/mobile proof remain mandatory.

The cloud runner stops before the three full requests if any of the six audit
protocol expectations fails. All audit receipts remain available; the decoder
then intentionally reports the full collection as incomplete. This early stop
saves calls but does not establish semantic success, even when every protocol
expectation passes. Review the actual reasons before release.

An explicit `--audits-only` build-only invocation caps a partial-budget run at six
audit calls, with no app calls even on success. Its `auditBatchComplete` field is
separate from the intentionally incomplete full collection. It cannot replace
the required full two-call app measurements or consumer readback.

The 1a5d32a isolated-claim experiment failed and was removed. Free-text outcome
labels could not safely be compared as literal strings; the model also still
missed the bad subscription exception. Keep those failed receipts and the
known four-of-six compact-audit result. The candidate is not release-ready.

The financial-exception candidate uses the same configured model with bounded
manual thinking before its compact audit: a 2,048-token thinking target inside a
4,096-token total audit output ceiling. Draft output remains capped at 2,000.
Thinking and auto tool selection do not change any fixture or expected outcome.
A completed named audit remains mandatory. Inspect actual quoted defects and
accurate controls, and require the full two-call request measurements within
the shared deadline before admitting deployment. No retry or resampling is implied.
