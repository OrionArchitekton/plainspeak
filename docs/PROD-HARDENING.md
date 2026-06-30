# Production hardening — operator steps

The rate-limiting code is already shipped (`app/api/explain/route.ts`). It activates
automatically once an Upstash Redis is connected, and no-ops safely until then. Two
short console steps remain; both need your account access.

## 1. Provision Upstash Redis (activates the rate limit) — ~2 min

The cleanest path injects the env vars for you:

1. Vercel dashboard -> project **plainspeak** -> **Storage** tab -> **Create / Connect Database**.
2. Choose **Upstash for Redis** (free tier is plenty), name it `plainspeak-ratelimit`, region near your users.
3. Connect it to the **plainspeak** project, environment **Production** (and Preview if you want).
   Vercel injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` automatically.
4. Redeploy: `vercel deploy --prod --yes --scope dan-mercedes-projects` (or just push a commit).

After redeploy, each client is capped at **6 explanations / minute**; the 7th in a window
gets a 429 with a friendly message. Tune the number in `route.ts`
(`Ratelimit.slidingWindow(6, "60 s")`).

## 2. Separate low-budget Anthropic key (RECOMMENDED) — ~3 min

**Recommendation: yes, do this.** The public endpoint currently uses the shared estate
`ANTHROPIC_API_KEY`. A dedicated key isolates blast radius (abuse can't drain the estate
key), lets you set an independent spend cap, and gives clean cost attribution. It is
revocable without touching anything else.

1. Anthropic Console -> **Settings -> API keys -> Create Key**, name `plainspeak-prod`.
   (Optionally create a dedicated **Workspace** first and set a monthly **spend limit**
   on it, e.g. $10, so the demo can never exceed it.)
2. Put it on Vercel (either the dashboard, or hand me the key and I'll pipe it in via
   `vercel env`):
   ```
   printf '%s' '<the-new-key>' | vercel env add ANTHROPIC_API_KEY production --scope dan-mercedes-projects --force
   ```
3. Redeploy as above.

Once both are done the public demo is rate-limited and runs on a capped, isolated key.
