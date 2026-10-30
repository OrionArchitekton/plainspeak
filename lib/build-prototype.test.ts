import { expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectBuildPrototype, encodeBuildReceipt, decodeBuildReceipts, readBuildAudits } from "../evals/run-build-prototype.mjs";

it("stops publication even when every isolated test finishes successfully", async () => {
  const audit = vi.fn().mockResolvedValue(Array.from({ length: 6 }, () => ({ metProtocolExpectation: true })));
  const post = vi.fn().mockImplementation(async () => new Response('{"plain":"Fictional result"}', { status: 200 }));
  const emit = vi.fn();
  const requests = ["refunds", "liability", "warranty"].map(name => ({ name, request: { document: "Fictional document" } }));
  await expect(collectBuildPrototype({ audit, post, requests, emit })).rejects.toThrow("publication stopped intentionally");
  expect(audit).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledTimes(3);
  expect(emit.mock.calls.map(call => call[0])).toEqual(["audits", "request-refunds", "request-liability", "request-warranty", "finished"]);
  expect(emit.mock.calls.slice(1, 4).every(call => call[1].status === 200)).toBe(true);
  expect(emit.mock.calls.at(-1)?.[1]).toMatchObject({ collectionComplete: true, providerCallCeiling: 12 });
});

it("stops before application requests when audit collection is incomplete", async () => {
  const post = vi.fn();
  const emit = vi.fn();
  const requests = ["refunds", "liability", "warranty"].map(name => ({ name, request: {} }));
  await expect(collectBuildPrototype({ audit: async () => [], post, requests, emit })).rejects.toThrow("publication stopped intentionally");
  expect(post).not.toHaveBeenCalled();
  expect(emit.mock.calls.at(-1)?.[1]).toMatchObject({ collectionComplete: false });
});

it("rejects conflicting receipt frames and accepts identical log duplicates", () => {
  const frames = encodeBuildReceipt("audits", { data: "Fixture" }, "fictional-credential");
  expect(decodeBuildReceipts([...frames, ...frames], { allowIncomplete: true })).toEqual({ records: { audits: { data: "Fixture" } }, collectionComplete: false });
  const conflict = encodeBuildReceipt("audits", { data: "Different fixture" }, "fictional-credential");
  expect(() => decodeBuildReceipts([...frames, ...conflict], { allowIncomplete: true })).toThrow();
});

it("the real build entrypoint exits unsuccessfully before calls when no key is supplied", () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("../evals/run-build-prototype.mjs", import.meta.url)), "--vercel-build-only"], {
    encoding: "utf8", timeout: 5000, env: { ...process.env, VERCEL_ENV: "production", ANTHROPIC_API_KEY: "" },
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("publication stopped intentionally");
  expect(result.stdout).toBe("");
});

it.each(["started", "audits", "request-warranty", "finished", "all"])("rejects a missing whole receipt record: %s", omitted => {
  const records = {
    started: { providerCallCeiling: 12 }, audits: Array.from({ length: 6 }, () => ({})),
    "request-refunds": {}, "request-liability": {}, "request-warranty": {},
    finished: { collectionComplete: true, providerCallCeiling: 12 },
  };
  const frames = Object.entries(records).flatMap(([name, value]) => name === omitted || omitted === "all" ? [] : encodeBuildReceipt(name, value, "fictional-credential"));
  expect(() => decodeBuildReceipts(frames)).toThrow();
});

it("preserves a completed audit case when the subprocess has no aggregate", async () => {
  const folder = await mkdtemp(join(tmpdir(), "plainspeak-partial-offline-"));
  const emit = vi.fn();
  try {
    const result = { name: "refunds-observed-bad", rawAudit: "A fictional audit result" };
    await writeFile(join(folder, "refunds-observed-bad.json"), JSON.stringify(result), { mode: 0o600 });
    await expect(readBuildAudits(folder, emit)).rejects.toThrow();
    expect(emit).toHaveBeenCalledWith("partial-audits", { collectionComplete: false, cases: [result] });
  } finally { await rm(folder, { recursive: true, force: true }); }
});

it("recovers complete, redacted receipts from bounded log frames", () => {
  const value = { text: "x".repeat(7000), protected: "fictional-credential" };
  const frames = encodeBuildReceipt("audits", value, "fictional-credential");
  expect(frames.length).toBeGreaterThan(1);
  expect(frames.every((line: string) => line.length < 2400)).toBe(true);
  const result = decodeBuildReceipts([...frames].reverse(), { allowIncomplete: true });
  expect(result.records.audits).toEqual({ text: value.text, protected: "[REDACTED]" });
  expect(() => decodeBuildReceipts(frames.slice(1), { allowIncomplete: true })).toThrow();
});

it("validates a complete record set separately from its semantic outcomes", () => {
  const records = {
    started: { providerCallCeiling: 12 }, audits: Array.from({ length: 6 }, () => ({ metProtocolExpectation: false })),
    "request-refunds": { status: 422 }, "request-liability": { status: 200 }, "request-warranty": { status: 502 },
    finished: { collectionComplete: true, providerCallCeiling: 12 },
  };
  const frames = Object.entries(records).flatMap(([name, value]) => encodeBuildReceipt(name, value, "fictional-credential"));
  expect(decodeBuildReceipts(frames)).toEqual({ records, collectionComplete: true });
});
