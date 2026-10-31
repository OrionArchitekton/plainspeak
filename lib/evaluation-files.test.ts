import { afterEach, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Filesystem/protocol tests only. These fake calls never establish model quality.
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({ default: class { messages = { create }; } }));
const savedArgs = process.argv;
const savedExit = process.exitCode;
let root = "";
afterEach(async () => {
  process.argv = savedArgs; process.exitCode = savedExit;
  vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.resetModules(); create.mockReset();
  if (root) await rm(root, { recursive: true, force: true });
});
async function prepare() {
  root = await mkdtemp(join(tmpdir(), "plainspeak-offline-harness-"));
  vi.stubEnv("ANTHROPIC_API_KEY", "fictional-test-only");
  vi.spyOn(console, "log").mockImplementation(() => {});
  create.mockResolvedValue({ stop_reason: "end_turn", content: [], usage: { input_tokens: 0, output_tokens: 0 } });
  const output = join(root, "receipts");
  process.argv = ["node", "run-verification.mjs", "--output-dir", output];
  return output;
}

it("refuses an existing evaluation directory before any provider calls", async () => {
  const output = await prepare();
  await mkdir(output, { mode: 0o700 });
  await writeFile(join(output, "keep.txt"), "Prior evidence");
  await expect(import("../evals/run-verification.mjs")).rejects.toMatchObject({ code: "EEXIST" });
  expect(create).not.toHaveBeenCalled();
  expect(await readFile(join(output, "keep.txt"), "utf8")).toBe("Prior evidence");
});

it("writes private case receipts and one final aggregate with a fake provider", async () => {
  const output = await prepare();
  await import("../evals/run-verification.mjs");
  expect(create).toHaveBeenCalledTimes(6);
  expect(create.mock.calls.every(call => call[0].model === "claude-opus-4-6" && call[0].thinking?.type === "disabled" && call[0].tool_choice?.type === "tool" && call[0].tool_choice.disable_parallel_tool_use === true && call[0].tools[0].name === "record_audit")).toBe(true);
  expect((await stat(output)).mode & 0o077).toBe(0);
  const files = await readdir(output);
  expect(files).toHaveLength(7);
  for (const file of files) expect((await stat(join(output, file))).mode & 0o077).toBe(0);
  const results = JSON.parse(await readFile(join(output, "results.json"), "utf8"));
  expect(results).toHaveLength(6);
  expect(results.every((result: { metProtocolExpectation: boolean }) => !result.metProtocolExpectation)).toBe(true);
});
