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

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const VALID_LEVELS: ReadingLevel[] = ["child", "plain", "detailed"];
const MAX_DOC_CHARS = 16000;

// Abuse guard for the public demo: caps a single client to 6 explanations per
// minute so a stray loop cannot drain the API budget. Activates only when an
// Upstash Redis is configured; absent it (local dev, demo capture), requests
// pass through unthrottled. This is defense-in-depth, not an auth gate.
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(6, "60 s"),
        prefix: "plainspeak",
        analytics: false,
      })
    : null;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "anonymous";
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY." },
      { status: 500 },
    );
  }

  if (ratelimit) {
    const { success, reset } = await ratelimit.limit(clientIp(req));
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "You're going a bit fast. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
  }

  let body: Partial<ExplainRequest>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const document = (body.document || "").trim();
  if (!document) {
    return NextResponse.json(
      { error: "Paste a document to explain." },
      { status: 400 },
    );
  }
  if (document.length > MAX_DOC_CHARS) {
    return NextResponse.json(
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

  const client = new Anthropic({ apiKey });

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      temperature: 0,
      system: buildSystemPrompt(request),
      messages: [{ role: "user", content: buildUserPrompt(request) }],
    });

    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n");

    const explanation = parseExplanation(text);
    return NextResponse.json(explanation);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Could not generate a plain-language explanation: ${message}` },
      { status: 502 },
    );
  }
}
