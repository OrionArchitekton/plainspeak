# Plainspeak — Spec

## Problem

Ordinary people routinely agree to documents they do not understand (leases, medical
plans, terms of service, government forms). The language favors the author, not the
affected party. Plainspeak closes that comprehension gap.

## Scenarios (acceptance criteria)

1. **Plain explanation at a chosen level.** Given a pasted document and a reading level
   (child / plain / detailed), the reader receives a plain-language explanation of what
   the document is and says, honoring the chosen level.
   Generation guidance requires material exceptions, conditions and exclusions to
   stay with their rules, including each impact point that restates a rule. It asks
   for a liability cap and its exceptions together, rather than an unconditional
   maximum or an exception mentioned only in a question. Live content evaluations
   check this behavior for their tested documents; there is no deterministic
   semantic gate or guarantee of general factual completeness.
   Guidance keeps exclusions scoped to the rule they modify; exclusion from a
   special refund override does not remove ordinary refund eligibility. Material
   coverage inclusions stay explicit, and event order alone does not establish
   the cause of a later failure.
   Guidance also requires the plain explanation to cover all material financial,
   cancellation and refund branches even when the reader asks about one scenario.
   Shorter sentences at simpler reading levels must preserve those rules. Refunds
   refer to amounts actually paid; a full-price refund must not be assumed.
   Reader-reported payments remain explicit conditional assumptions, not verified
   facts. Document-stated prices, deductions and duplicate-charge amounts remain
   intact; a cap's reference period must not be added to a refund rule.
   Payment-based caps retain their formula and reference period in every
   restatement; an unknown payment history must not become an assumed fixed cap
   or numeric illustration calculated from the periodic price.
   Fixed numeric caps stated in a document keep their amount and exceptions;
   they must not be made dependent on a payment history absent that source rule.
2. **Personalized impact.** Given an optional "your situation" note, the "what affects
   you" list is tailored to that reader, with each item ranked high / medium / low so the
   most consequential clauses surface first.
3. **Actionable questions.** The reader receives 3-5 specific questions to ask the other
   party before agreeing.
4. **Sample demonstration.** Built-in example documents reduce typing for live explanations. The separate `?demo=lease` view shows a frozen sample result without calling the model; it is labeled as a sample.
5. **Resilient to model formatting.** If the model wraps its JSON in code fences or stray
   prose, or returns an out-of-range severity, the result still renders cleanly rather
   than erroring.
6. **Safe by construction.** The key never reaches the browser; the UI and the model's
   own guardrail both state this is not professional advice; the application does not persist document contents. Live requests send the document and optional situation to Anthropic; provider and host retention are separate boundaries and disclosed before submission.

7. **Private responses.** Explanation and error responses request no-store caching. Provider exception details are never returned to the browser. The UI warns before submission that this is not legal or medical advice and that content is sent to Anthropic.
8. **Invalid requests.** With the service configured, non-object JSON, non-string documents or situation fields, blank documents, documents longer than 16,000 characters and situations longer than 1,000 characters return 400 without a model call. Bodies exceeding 128 KiB return 413 before JSON parsing or quota use, including streamed bodies and ignored fields; the byte limit is enforced independently of Content-Length.

9. **Output and limits.** Success requires a nonempty explanation, at least one nonempty impact point and three to five nonempty questions. The prompt's three-to-six impact-point target is guidance, not a guarantee of factual completeness. Unknown reading levels fall back to Plain English; a blank optional situation is allowed. Invalid input does not consume a rate-limit slot. A configured limiter that is unavailable or returns a malformed result returns 503 without a model call; a denied limit returns 429 with a retry interval. Allowed responses identify the active limiter and remaining slots. Without limiter settings, the service is unthrottled and requires separate access and spend controls before public use.

## Test seam

Live generation has a 60-second function allowance and one provider attempt with
a 50-second timeout and abort signal. The 2,000-token output limit is unchanged.
Provider failures still use the existing generic, non-cacheable API error; the
additional time allows detailed responses to finish beyond the prior 30-second
platform cutoff. This is a bounded provider call, not a retry loop.

Core explanation behavior is exercised at one seam: the pure `lib/explain.ts` module
(`buildSystemPrompt`, `buildUserPrompt`, `parseExplanation`) under Vitest. This is where
the reading-level contract, personalization, JSON-output contract, and defensive parsing
all live, so it is the highest-leverage single seam. The HTTP adapter is also exercised with Vitest and an injected SDK response: validation, provider-failure privacy and no-store headers require that separate seam. A local production-browser check verifies the visible notice and frozen demo. Live model quality still requires a separately authorized API call.

## Out of scope

OCR / file upload, multi-document comparison, accounts, persistence, and any claim of
legal or medical authority.
