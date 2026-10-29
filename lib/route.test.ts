import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({ messages: { create } })),
}));
import { POST } from "../app/api/explain/route";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/explain", {
    method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => { vi.stubEnv("ANTHROPIC_API_KEY", "test-only-placeholder"); create.mockReset(); });
afterEach(() => vi.unstubAllEnvs());

describe("explanation privacy boundary", () => {
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
