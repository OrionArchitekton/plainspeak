# Plainspeak — brand chain drafts (operator-gated; nothing sends without Dan)

All three reference the live app + repo. Hold final publish until the adversarial
overclaim audit clears (so no public surface carries a refutable claim).

---

## 1. danmercede.com/works snippet — "Build — Applied Agent Projects"

**Plainspeak — AI that reads the fine print**
Paste any dense document (a lease, a medical letter, terms of service) and get it back in
plain words, the clauses that actually affect you ranked by severity, and the exact
questions to ask before you sign. Next.js + Claude, server-side key, deterministic output.
Built end-to-end by Claude Code for the FutureAI Global Hackathon 2026.
- Live: https://plainspeak-nine.vercel.app
- Code: https://github.com/OrionArchitekton/plainspeak
- Demo video: https://youtu.be/EbHJ4gQpNS8

(Ship via `/launch-oss` — creates the /works/<slug> subpath page + listing card. Operator-gated.)

---

## 2. X post (<=280 chars, no long dashes)

Draft A (process angle):
> I handed Claude Code a hackathon brief and let it run the whole loop: scope, build, deploy, test, record a narrated demo, ship.
>
> Out came Plainspeak: paste any dense doc, get it in plain words + what actually affects you + the questions to ask.
>
> Live: plainspeak-nine.vercel.app

Draft B (product angle):
> Most people sign leases and terms of service they don't actually understand.
>
> Plainspeak fixes that: paste the document, get it in plain words, the clauses that affect YOU ranked by risk, and the questions to ask before you sign.
>
> Built with Claude. Live: plainspeak-nine.vercel.app

(Ship via `/x`. Operator-gated, arm-flag + redactor + 5/day cap.)

---

## 3. danmercede.online raw signal (working-log lesson)

**Title:** Recording an automated product demo: every shot is a fresh browser, so prefill on the server

**Body:**
Building an automated, narrated demo for a hackathon app, two non-obvious things cost the
most time, both worth writing down.

1. In the capture pipeline, every shot runs in its own fresh browser context. State does
   not carry between shots, so a shot only sees your app if it navigates there itself. The
   fix that made the demo deterministic: a server-rendered demo mode (`?demo=lease`) that
   seeds the page from query params, so the prefilled content and result cards are in the
   SSR HTML and never race client hydration.
2. Long captions cover the very thing you are narrating. Showing one result card full-screen
   per shot (via a `focus` param), with short one-line narration, beat every attempt to
   shrink or reposition the caption band.

Bonus footgun: orphaned dev servers. `pkill -f "next start"` matched the script's own
command line and killed the run. Kill by port instead. And a stale server holding the port
makes a fresh build silently serve the OLD code, which looks exactly like a code bug.

(Ship via `/danmercede-online`. Operator-gated, redactor fail-closed + 3/day cap.)
