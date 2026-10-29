# Plainspeak — Spec

## Problem

Ordinary people routinely agree to documents they do not understand (leases, medical
plans, terms of service, government forms). The language favors the author, not the
affected party. Plainspeak closes that comprehension gap.

## Scenarios (acceptance criteria)

1. **Plain explanation at a chosen level.** Given a pasted document and a reading level
   (child / plain / detailed), the reader receives a plain-language explanation of what
   the document is and says, honoring the chosen level.
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
8. **Invalid requests.** With the service configured, non-object JSON, non-string documents or situation fields, blank documents, documents longer than 16,000 characters and situations longer than 1,000 characters return 400 without a model call.

9. **Output and limits.** Success requires a nonempty explanation, at least one nonempty impact point and three to five nonempty questions. The prompt's three-to-six impact-point target is guidance, not a guarantee of factual completeness. Unknown reading levels fall back to Plain English; a blank optional situation is allowed. Invalid input does not consume a rate-limit slot. A configured limiter that is unavailable returns 503 without a model call; a denied limit returns 429 with a retry interval. Without limiter settings, the service is unthrottled and requires separate access and spend controls before public use.

## Test seam

Core explanation behavior is exercised at one seam: the pure `lib/explain.ts` module
(`buildSystemPrompt`, `buildUserPrompt`, `parseExplanation`) under Vitest. This is where
the reading-level contract, personalization, JSON-output contract, and defensive parsing
all live, so it is the highest-leverage single seam. The HTTP adapter is also exercised with Vitest and an injected SDK response: validation, provider-failure privacy and no-store headers require that separate seam. A local production-browser check verifies the visible notice and frozen demo. Live model quality still requires a separately authorized API call.

## Out of scope

OCR / file upload, multi-document comparison, accounts, persistence, and any claim of
legal or medical authority.
