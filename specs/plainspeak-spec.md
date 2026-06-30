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
4. **One-click demonstration.** Built-in example documents (lease, medical letter, ToS)
   let any visitor see the full result in seconds without typing.
5. **Resilient to model formatting.** If the model wraps its JSON in code fences or stray
   prose, or returns an out-of-range severity, the result still renders cleanly rather
   than erroring.
6. **Safe by construction.** The key never reaches the browser; the UI and the model's
   own guardrail both state this is not professional advice; documents are not persisted.

## Test seam

The feature is exercised at one seam: the pure `lib/explain.ts` module
(`buildSystemPrompt`, `buildUserPrompt`, `parseExplanation`) under Vitest. This is where
the reading-level contract, personalization, JSON-output contract, and defensive parsing
all live, so it is the highest-leverage single seam. The network/SDK boundary
(`app/api/explain/route.ts`) is a thin adapter over that seam and is validated manually
against the live model.

## Out of scope

OCR / file upload, multi-document comparison, accounts, persistence, and any claim of
legal or medical authority.
