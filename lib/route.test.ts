import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { create, limit, makeClient } = vi.hoisted(() => ({ create: vi.fn(), limit: vi.fn(), makeClient: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({
  default: makeClient.mockImplementation(() => ({ messages: { create } })),
}));
vi.mock("@upstash/ratelimit", () => ({ Ratelimit: class {
  static slidingWindow() { return {}; }
  limit(...args: unknown[]) { return limit(...args); }
} }));
vi.mock("@upstash/redis", () => ({ Redis: class {} }));
import { POST, maxDuration } from "../app/api/explain/route";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/explain", {
    method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "test-only-placeholder"); create.mockReset(); limit.mockReset(); makeClient.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe("explanation privacy boundary", () => {
  it("bounds one provider attempt below the function deadline without increasing the token budget", async () => {
    create.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({
      plain: "A fictional agreement", affects_you: [{ point: "A condition applies", severity: "high" }],
      questions: ["Which condition?", "When does it apply?", "Who confirms it?"],
    }) }] });
    const response = await POST(request({ document: "A fictional agreement" }));
    expect(response.status).toBe(200);
    expect(makeClient).toHaveBeenCalledWith(expect.objectContaining({ timeout: 50000, maxRetries: 0 }));
    expect(maxDuration).toBe(60);
    expect(makeClient.mock.calls[0][0].timeout).toBeLessThan(maxDuration * 1000);
    expect(create).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(create.mock.calls[0][0].max_tokens).toBe(2000);
  });

  async function limitedPost() {
    vi.resetModules();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.invalid");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-only");
    return (await import("../app/api/explain/route")).POST;
  }
  it.each(["x", "界"])("rejects oversized UTF-8 bodies before quota or model use (%s)", async character => {
    const post = await limitedPost();
    const bytes = new TextEncoder().encode(JSON.stringify({ document: "A fictional lease", ignored: character.repeat(131073) }));
    const cancelled = vi.fn();
    let offset = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (offset === bytes.length) { controller.close(); return; }
        controller.enqueue(bytes.slice(offset, offset + 8192)); offset = Math.min(offset + 8192, bytes.length);
      }, cancel: cancelled,
    });
    const incoming = new NextRequest("http://localhost/api/explain", {
      method: "POST", body: stream, headers: { "Content-Type": "application/json", "Content-Length": "1" },
    });
    const response = await post(incoming);
    expect(response.status).toBe(413);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(cancelled).toHaveBeenCalled();
    expect(limit).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
  it("does not call the model if the configured limiter is unavailable", async () => {
    const post = await limitedPost();
    limit.mockRejectedValue(new Error("private limiter details"));
    const response = await post(request({ document: "A fictional lease" }));
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).not.toContain("private");
    expect(create).not.toHaveBeenCalled();
  });
  it.each([null, {}, { success: "yes", remaining: 5, reset: 1000 },
    { success: true, remaining: 5 }, { success: true, remaining: NaN, reset: 1000 },
    { success: false, remaining: 0, reset: Infinity }])("fails closed on a malformed limiter result %j", async result => {
    const post = await limitedPost();
    limit.mockResolvedValue(result);
    const response = await post(request({ document: "A fictional lease" }));
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(create).not.toHaveBeenCalled();
  });
  it("reports an allowed slot and honors the next denial after a model failure", async () => {
    const post = await limitedPost();
    const reset = Date.now() + 60000;
    limit.mockResolvedValueOnce({ success: true, remaining: 5, reset })
      .mockResolvedValueOnce({ success: true, remaining: 4, reset })
      .mockResolvedValueOnce({ success: false, remaining: 0, reset });
    create.mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({
      plain: "Pay rent on the first.", affects_you: [{ point: "Rent is due", severity: "high" }],
      questions: ["When is it due?", "How can I pay?", "Who do I contact?"],
    }) }] }).mockResolvedValueOnce({ content: [] });
    const response = await post(request({ document: "A fictional lease" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Active")).toBe("true");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("5");
    expect((await post(request({ document: "A fictional lease" }))).status).toBe(502);
    expect((await post(request({ document: "A fictional lease" }))).status).toBe(429);
    expect(limit).toHaveBeenCalledTimes(3);
    expect(create).toHaveBeenCalledTimes(2);
  });
  it("rejects invalid input before consuming a limiter slot", async () => {
    const post = await limitedPost();
    limit.mockResolvedValue({ success: true, remaining: 5 });
    expect((await post(request({ document: 1 }))).status).toBe(400);
    expect(limit).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
  it("returns a non-cacheable rate-limit denial with a retry interval", async () => {
    const post = await limitedPost();
    limit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60000 });
    const response = await post(request({ document: "A fictional lease" }));
    expect(response.status).toBe(429);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(create).not.toHaveBeenCalled();
  });
  it("does not call the model when the server key is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const response = await POST(request({ document: "A fictional lease" }));
    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(create).not.toHaveBeenCalled();
  });
  it.each(["unrecognized", { custom: true }])("keeps the documented Plain English fallback for %j", async readingLevel => {
    create.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({
      plain: "Pay rent on the first.", affects_you: [{ point: "Rent is due", severity: "high" }],
      questions: ["When is it due?", "How can I pay?", "Who do I contact?"],
    }) }] });
    const response = await POST(request({ document: "A fictional lease", readingLevel, situation: "" }));
    expect(response.status).toBe(200);
    expect(create.mock.calls[0][0].system).toContain("plain English a busy adult");
  });
  it("filters blank model fields before checking the response contract", async () => {
    create.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({
      plain: "A fictional lease", affects_you: [{ point: "   ", severity: "high" }],
      questions: [" ", "\n", "\t"],
    }) }] });
    const response = await POST(request({ document: "A fictional lease" }));
    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("returns a non-cacheable explanation for a valid document", async () => {
    create.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({
      plain: "Pay rent on the first.", affects_you: [{ point: "Rent is due", severity: "high" }],
      questions: ["When is it due?", "How can I pay?", "Who do I contact?"],
    }) }] });
    const response = await POST(request({ document: "Rent is due on the first." }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect((await response.json()).plain).toContain("Pay rent");
  });
  it.each([0, 1, 6])("rejects an incomplete question list of length %i", async count => {
    create.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({
      plain: "Pay rent on the first.", affects_you: [{ point: "Rent is due", severity: "high" }],
      questions: Array.from({ length: count }, (_, index) => `Question ${index + 1}?`),
    }) }] });
    const response = await POST(request({ document: "A fictional lease" }));
    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).not.toContain("Pay rent");
  });
  it.each(["plain", "affects_you"])("rejects a missing %s section", async missing => {
    const output = {
      plain: "Pay rent on the first.", affects_you: [{ point: "Rent is due", severity: "high" }],
      questions: ["When is it due?", "How can I pay?", "Who do I contact?"],
      [missing]: missing === "plain" ? "" : [],
    };
    create.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(output) }] });
    expect((await POST(request({ document: "A fictional lease" }))).status).toBe(502);
  });
  it.each(["", " ", "x".repeat(16001)])("rejects blank or overlong documents", async document => {
    const response = await POST(request({ document }));
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
  it("does not expose provider exception details or allow caching of a private error", async () => {
    create.mockRejectedValue(new Error("private document and private provider detail"));
    const response = await POST(request({ document: "A fictional lease" }));
    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).not.toContain("private");
  });
  it.each([null, [], { document: 1 }, { document: {} }, { document: "ok", situation: 2 },
    { document: "ok", situation: "x".repeat(1001) }])("rejects malformed request %j without a model call", async body => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(create).not.toHaveBeenCalled();
  });
});
