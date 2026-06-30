# Plainspeak — FutureAI Global Hackathon 2026 submission package

Copy/paste into the Devpost submission form. All claims here are verified against the
live app and the repo (see the honesty notes at the bottom).

## Project title
Plainspeak

## Tagline (elevator pitch)
AI that reads the fine print for you: paste any dense document and get it in plain words, the parts that affect you, and the questions to ask before you sign.

## The problem (Inspiration)
Ordinary people sign leases, accept medical plans, and click "I agree" on terms of service they do not actually understand. The language is written to be understood by the party that wrote it, not the person it affects. That asymmetry quietly costs people money, rights, and peace of mind. Plainspeak closes the comprehension gap.

## What it does
You paste a confusing document and (optionally) say who you are, e.g. "I'm the tenant." Plainspeak returns three things:
1. **In plain words** — what the document actually says, at the reading level you choose (Like I'm 10 / Plain English / Full detail).
2. **What affects you** — the specific clauses that impact you, each ranked high / medium / low so the traps surface first.
3. **Questions to ask** — the exact questions to put to the landlord, clinician, or company before you agree.
Three one-click examples (apartment lease, medical letter, terms of service) let anyone see it work in seconds.

## How we built it
- **Next.js 15 (App Router) + React 19 + TypeScript**, deployed on **Vercel**.
- A single structured call to **Anthropic Claude (claude-sonnet-4-6 by default, set via env)** with a system prompt that fixes the persona, the chosen reading level, a strict "never invent facts / this is not professional advice" guardrail, and a JSON output contract (temperature 0 for deterministic, repeatable explanations). Returned clauses are sorted high/medium/low so the riskiest surface first.
- The model's reply is parsed defensively so code-fenced or slightly malformed JSON still yields a clean result; out-of-range severities are coerced rather than crashing the UI. That prompt/parse logic is pure and unit-tested (Vitest, 9 tests).
- Claude is called **server-side** from a route handler so the API key is never exposed to the browser. Optional **Upstash Redis** per-IP rate limiting protects the public endpoint.

## Challenges we ran into
- Making the model output reliably renderable: solved with a strict JSON contract plus a defensive parser that recovers JSON from fenced/messy replies.
- Producing a clean automated demo video: each capture shot runs in a fresh browser context, so the app gained a deterministic server-rendered demo mode that shows one result card full-screen, clear of the captions.

## What we learned
A narrow, honest framing ("what affects YOU" + "questions to ask") is more useful than a generic summary, and shipping the guardrail in the model's own instructions keeps an AI explainer safely in its lane.

## What's next
File/PDF upload and OCR, multi-document comparison, and side-by-side "before vs after you negotiate" views.

## Built with
next.js, react, typescript, tailwindcss, anthropic-claude, vercel, upstash-redis, vitest

## Links
- **Live demo:** https://plainspeak-nine.vercel.app
- **GitHub repo:** https://github.com/OrionArchitekton/plainspeak
- **Demo video:** demo/out/final.mp4  (upload to YouTube/Vimeo, then paste the link)
- **Screenshots:** demo/screenshots/ (01-input, 02-results, 03-affects)

## Team information
Solo: Dan Mercede. Built end-to-end with Claude Code (Anthropic's agentic CLI) as the implementation agent; commits carry Co-Authored-By: Claude trailers.

## Honesty notes (for our own review; not for the public form)
- "Built end-to-end by Claude Code": every line of code, the tests, the demo, and both commits were produced by the agent this session. The git author field is the operator's identity (Dan); the Co-Authored-By trailer is the real provenance record.
- The recorded video uses the deterministic `?demo=lease` mode, which renders a FROZEN but REAL Claude response (captured once at temperature 0) so the walkthrough is stable. The live site generates fresh responses on demand, verified working.
- "Does not store documents" is true: there is no persistence layer; only the rate limiter writes (an IP + counter, never document content).
