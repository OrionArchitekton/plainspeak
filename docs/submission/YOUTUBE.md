# Plainspeak — YouTube metadata (demo video)

Upload `demo/out/final.mp4`, then paste the Devpost "Video demo link" with the YouTube URL.

## Title (<=100 chars)
Plainspeak: AI That Reads the Fine Print for You | FutureAI Global Hackathon 2026

## Description
Plainspeak turns any dense document (a lease, a medical letter, terms of service) into three things: what it actually says in plain words, the clauses that affect YOU ranked by severity, and the exact questions to ask before you sign.

Built end to end by Claude Code (Anthropic's agentic CLI) for the FutureAI Global Hackathon 2026.

Try it live: https://plainspeak-nine.vercel.app
Source code: https://github.com/OrionArchitekton/plainspeak

How it works: a single structured call to Anthropic Claude (claude-sonnet-4-6) with a strict JSON output contract and a "this is not legal or medical advice" guardrail. The reply is parsed defensively and rendered as three cards, with the risky clauses sorted to the top. Next.js 15 and React 19 on Vercel, the API key stays server-side, with optional per-IP rate limiting.

Chapters:
0:00 The problem
0:05 Paste a document
0:08 Let Claude read the fine print
0:14 In plain words
0:17 What affects you
0:21 Questions to ask
0:25 Plainspeak

## Tags (comma-separated)
AI, artificial intelligence, Claude, Anthropic, Claude Code, FutureAI, hackathon, AI agent, LLM, legal tech, plain language, accessibility, document AI, contract review, terms of service, tenant rights, Next.js, Vercel, agentic engineering

## Notes
- YouTube title max 100 chars, description max 5000, up to ~15 tags (500 chars total). No long dashes (public surface).
- Set visibility to Public or Unlisted (Devpost judges must be able to view it).
- Chapter timestamps are approximate to the 32.6s cut; adjust if you re-render.
