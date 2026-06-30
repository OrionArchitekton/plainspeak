# Plainspeak

**Paste any dense document and get it in plain words, the parts that affect _you_, and the exact questions to ask before you sign.**

Built for the [FutureAI Global Hackathon 2026](https://futureai-global-hackthon.devpost.com/). Plainspeak attacks a small, real, everyday injustice: people sign leases, accept medical plans, and agree to terms of service they do not actually understand, because the language is built to be understood by the party that wrote it, not the person it affects.

## What it does

You paste a document (a lease, a medical letter, a terms-of-service, a government form) and optionally say who you are ("I'm the tenant"). Plainspeak returns three things:

1. **In plain words** — what the document actually is and says, at the reading level you pick (_Like I'm 10_ / _Plain English_ / _Full detail_).
2. **What affects you** — the specific clauses that impact you, each flagged **high / medium / low** so you see the traps first.
3. **Questions to ask** — the exact questions to put to the landlord, clinician, or company _before_ you agree.

Three one-click examples (lease, medical letter, ToS) are built in so anyone can see it work in seconds.

## How the AI works

The core is a single structured call to Anthropic's **Claude** (`claude-sonnet-4-6`). A system prompt fixes the persona, the reading level, a strict "never invent facts / this is not professional advice" guardrail, and a JSON output contract. The model's reply is parsed defensively (`lib/explain.ts`) so code-fenced or slightly-malformed JSON still yields a clean result, and bad severities are coerced rather than crashing the UI.

The prompt-building and parsing logic is pure and unit-tested (`lib/explain.test.ts`) — no network needed to run the tests.

## Tech

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for the UI
- **Anthropic Claude** via `@anthropic-ai/sdk`, called server-side from a route handler (`app/api/explain/route.ts`) so the API key is never exposed to the browser
- **Vitest** for the core-logic tests
- Deployed on **Vercel**

## Run it locally

```bash
pnpm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
pnpm test                    # core-logic tests, no key needed
pnpm dev                     # http://localhost:3000
```

## Honesty notes

- This project was written end-to-end by **Claude Code** as a hackathon build; the git history is the record.
- Plainspeak helps a person _understand_ a document. It is explicitly **not** legal, medical, or financial advice, and it says so in the UI and in the model's own guardrail.
- It does not store your documents; each request is processed and returned, nothing is persisted.

## License

MIT
