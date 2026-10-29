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
- Compare generated sections, not the input form. Review every restatement, including personalized points and any calculations. Correct wording in a question or a different point does not repair a contradictory unconditional statement.

## Subscription payment-based cap

Repeat `fixtures/subscription-liability.json` unchanged, including the detailed reading level and situation. The prior response correctly distinguished the separate exceptions but repeatedly called the ordinary formula a "$90 cap" despite an unknown payment history.

- Preserve $30/month, the 23:59 UTC cutoff on the calendar day before next billing, and access through the current paid period after cancellation.
- Ordinary mid-month cancellation is not refundable; the duplicate amount is refunded in full only if reported within thirty calendar days of that charge. Keep the reporting condition with the exception.
- Every cap restatement must retain the subscription-fees-actually-paid formula for the three months preceding the claim, and its fraud and unauthorized-confidential-disclosure exceptions. An ordinary-mistake point may explicitly limit itself to ordinary liability, but must not imply its cap also covers the exceptional cases.
- No payment history is supplied. Do not invent a fixed $90 cap or numeric cap illustration from three assumed $30 payments, including in headings or impact points. If fewer fees were actually paid, the formula produces a different amount. This is semantic review, not a ban on the characters `90` in unrelated contexts.
- Lost profits remain a separate exclusion, with the narrower exception for loss directly caused by provider fraud. Unauthorized disclosure without fraud removes the liability cap but does not remove the lost-profits exclusion. Do not merge the two sets of exceptions or promise an automatic recovery.
- Keep actual request, response and rendered evidence. Transport success, prompt-text assertions and a saved reference answer cannot establish this case's outcome.
