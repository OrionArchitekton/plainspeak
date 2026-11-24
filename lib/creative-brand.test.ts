import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseExplanation } from "./explain";

const LONG_DASH = /[\u2013\u2014\u2015]/;

function walkCodeFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkCodeFiles(full));
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("Plainspeak creative-kit compliance (EXT-BRAND-002)", () => {
  it("pins .orion-creative.yaml at kit_version 0.1.0", () => {
    expect(existsSync(".orion-creative.yaml")).toBe(true);
    const yaml = readFileSync(".orion-creative.yaml", "utf8");
    expect(yaml).toMatch(/^kit_version:\s*"0\.1\.0"/m);
    expect(yaml).toMatch(/^long_dashes_allowed:\s*false/m);
  });

  it("contains zero long dashes across user-facing app/ and lib/ source files", () => {
    const offending = [...walkCodeFiles("app"), ...walkCodeFiles("lib"), ...walkCodeFiles("components")]
      .filter((file) => LONG_DASH.test(readFileSync(file, "utf8")));
    expect(offending).toEqual([]);
  });

  it("normalizes long dashes out of parsed plain-English explanations", () => {
    const parsed = parseExplanation(
      JSON.stringify({
        plain: "You have 14 days\u2014unless waived\u2013to cancel.",
        affects_you: [{ point: "Fee applies \u2014 see clause 3", severity: "high" }],
        questions: ["Is the notice window 14 days\u2014calendar or business?"],
      }),
    );
    expect(LONG_DASH.test(parsed.plain)).toBe(false);
    expect(LONG_DASH.test(parsed.affectsYou[0].point)).toBe(false);
    expect(LONG_DASH.test(parsed.questions[0])).toBe(false);
  });
});
