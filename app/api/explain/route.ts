import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import {
  buildSystemPrompt,
  buildUserPrompt,
  parseExplanation,
  type ExplainRequest,
  type ReadingLevel,
} from "@/lib/explain";
import { auditAllowsDraft, verificationInput, VERIFICATION_PROMPT } from "@/lib/verification";

export const runtime = "nodejs";
export const maxDuration = 60;
const PROVIDER_TIMEOUT_MS = 50000;
const REQUEST_TIMEOUT_MS = 55000;

function respond(body: unknown, init: ResponseInit = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const VALID_LEVELS: ReadingLevel[] = ["child", "plain", "detailed"];
const MAX_DOC_CHARS = 16000;
const MAX_BODY_BYTES = 128 * 1024;

class BodyTooLarge extends Error {}

async function readBody(req: NextRequest, signal: AbortSignal): Promise<Partial<ExplainRequest>> {
  if (!req.body) throw new SyntaxError("Missing body");
  const reader = req.body.getReader();
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {});
        throw new BodyTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

// Abuse guard for the public demo: caps a single client to 6 explanations per
// minute so a stray loop cannot drain the API budget. Activates only when an
// Upstash Redis is configured; absent it (local dev, demo capture), requests
// pass through unthrottled. This is defense-in-depth, not an auth gate.
function makeRatelimit(): Ratelimit | null {
  // Accept either the Upstash-native names or Vercel's KV/Marketplace names
  // (the Vercel Upstash integration injects KV_REST_API_URL / KV_REST_API_TOKEN).
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(6, "60 s"),
    prefix: "plainspeak",
    analytics: false,
  });
}

const ratelimit = makeRatelimit();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "anonymous";
}

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  let expire: (() => void) | undefined;
  const expired = new Promise<never>((_, reject) => { expire = () => {
    controller.abort(); reject(new Error("Request deadline"));
  }; });
  const timer = setTimeout(() => expire!(), REQUEST_TIMEOUT_MS);
  try {
    return await Promise.race([explain(req, controller.signal), expired]);
  } catch {
    return respond({ error: "Could not generate a verified explanation. Please try again later." }, { status: 502 });
  } finally { clearTimeout(timer); }
}

async function explain(req: NextRequest, signal: AbortSignal) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return respond(
      { error: "Server is missing ANTHROPIC_API_KEY." },
      { status: 500 },
    );
  }

  let body: Partial<ExplainRequest>;
  try {
    body = await readBody(req, signal);
  } catch (error) {
    if (error instanceof BodyTooLarge) {
      return respond({ error: "Request body is too large (max 128 KiB)." }, { status: 413 });
    }
    return respond({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body) ||
      typeof body.document !== "string" ||
      (body.situation !== undefined && (typeof body.situation !== "string" || body.situation.length > 1000))) {
    return respond({ error: "Provide a document and an optional short situation as text." }, { status: 400 });
  }

  const document = (body.document || "").trim();
  if (!document) {
    return respond(
      { error: "Paste a document to explain." },
      { status: 400 },
    );
  }
  if (document.length > MAX_DOC_CHARS) {
    return respond(
      { error: `Document is too long (max ${MAX_DOC_CHARS} characters).` },
      { status: 400 },
    );
  }

  const readingLevel: ReadingLevel = VALID_LEVELS.includes(
    body.readingLevel as ReadingLevel,
  )
    ? (body.readingLevel as ReadingLevel)
    : "plain";

  const request: ExplainRequest = {
    document,
    readingLevel,
    situation: typeof body.situation === "string" ? body.situation : undefined,
  };

  const rlKey = clientIp(req);
  let rlRemaining: number | null = null;
  if (ratelimit) {
    try {
      const { success, reset, remaining } = await ratelimit.limit(rlKey);
      if (typeof success !== "boolean" || !Number.isFinite(reset) || reset <= 0 ||
          !Number.isInteger(remaining) || remaining < 0) {
        throw new Error("Invalid limiter result");
      }
      rlRemaining = remaining;
      if (!success) {
        const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        return respond(
          { error: "You're going a bit fast. Please wait a moment and try again." },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfter),
              "X-RateLimit-Active": "true",
            },
          },
        );
      }
    } catch {
      return respond(
        { error: "Please try again shortly. The service is temporarily unavailable." },
        { status: 503, headers: { "Retry-After": "30", "X-RateLimit-Active": "true" } },
      );
    }
  }

  const client = new Anthropic({ apiKey, timeout: PROVIDER_TIMEOUT_MS, maxRetries: 0 });

  try {
    signal.throwIfAborted();
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      temperature: 0,
      system: buildSystemPrompt(request),
      messages: [{ role: "user", content: buildUserPrompt(request) }],
    }, { signal });

    if (msg.stop_reason !== "end_turn") throw new Error("Incomplete draft generation");
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n");

    const explanation = parseExplanation(text);
    if (!explanation.plain || explanation.affectsYou.length === 0 ||
        explanation.questions.length < 3 || explanation.questions.length > 5) {
      throw new Error("Incomplete explanation");
    }
    const input = verificationInput(request, explanation);
    signal.throwIfAborted();
    const audit = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      temperature: 0,
      system: VERIFICATION_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(input) }],
    }, { signal });
    if (audit.stop_reason !== "end_turn") throw new Error("Incomplete verification");
    const auditText = audit.content.filter(b => b.type === "text")
      .map(b => (b as { text: string }).text).join("\n");
    if (!auditAllowsDraft(auditText, input)) {
      return respond({ error: "Could not verify that this explanation preserves the document's rules and exceptions. Please check the original text." }, { status: 422 });
    }
    const res = respond(explanation);
    res.headers.set("X-RateLimit-Active", String(ratelimit !== null));
    if (rlRemaining !== null) {
      res.headers.set("X-RateLimit-Remaining", String(rlRemaining));
    }
    return res;
  } catch {
    return respond(
      { error: "Could not generate an explanation. Please try again later." },
      { status: 502 },
    );
  }
}
