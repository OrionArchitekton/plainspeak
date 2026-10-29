# Liability-exception regression

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
