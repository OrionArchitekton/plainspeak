import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  buildUserPrompt,
  parseExplanation,
} from "./explain";

describe("buildSystemPrompt", () => {
  it("encodes the chosen reading level", () => {
    const child = buildSystemPrompt({ document: "x", readingLevel: "child" });
    expect(child).toContain("10-year-old");
    const detailed = buildSystemPrompt({
      document: "x",
      readingLevel: "detailed",
    });
    expect(detailed).toContain("full picture");
  });

  it("tailors to the reader's situation when given", () => {
    const sys = buildSystemPrompt({
      document: "x",
      readingLevel: "plain",
      situation: "I'm a tenant",
    });
    expect(sys).toContain("I'm a tenant");
  });

  it("always demands JSON-only output", () => {
    const sys = buildSystemPrompt({ document: "x", readingLevel: "plain" });
    expect(sys).toContain("ONLY a JSON object");
  });
});

describe("buildUserPrompt", () => {
  it("wraps the document text", () => {
    const u = buildUserPrompt({ document: "  lease terms  ", readingLevel: "plain" });
    expect(u).toContain("lease terms");
  });
});

describe("parseExplanation", () => {
  it("parses clean JSON", () => {
    const r = parseExplanation(
      JSON.stringify({
        plain: "It is a lease.",
        affects_you: [{ point: "Rent rises 10%", severity: "high" }],
        questions: ["Can I negotiate the increase?"],
      }),
    );
    expect(r.plain).toBe("It is a lease.");
    expect(r.affectsYou[0]).toEqual({ point: "Rent rises 10%", severity: "high" });
    expect(r.questions).toHaveLength(1);
  });

  it("recovers JSON wrapped in code fences and prose", () => {
    const raw =
      'Sure! Here is the result:\n```json\n{"plain":"ok","affects_you":[],"questions":["why?"]}\n```\nHope that helps.';
    const r = parseExplanation(raw);
    expect(r.plain).toBe("ok");
    expect(r.questions).toEqual(["why?"]);
  });

  it("coerces a bad severity to medium and drops empty points", () => {
    const r = parseExplanation(
      JSON.stringify({
        plain: "p",
        affects_you: [
          { point: "real", severity: "catastrophic" },
          { point: "", severity: "high" },
        ],
        questions: [],
      }),
    );
    expect(r.affectsYou).toEqual([{ point: "real", severity: "medium" }]);
  });

  it("accepts bare-string affects_you items", () => {
    const r = parseExplanation(
      '{"plain":"p","affects_you":["a deadline applies"],"questions":[]}',
    );
    expect(r.affectsYou[0]).toEqual({ point: "a deadline applies", severity: "medium" });
  });

  it("sorts affects_you by severity (high, then medium, then low)", () => {
    const r = parseExplanation(
      JSON.stringify({
        plain: "p",
        affects_you: [
          { point: "low one", severity: "low" },
          { point: "high one", severity: "high" },
          { point: "medium one", severity: "medium" },
        ],
        questions: [],
      }),
    );
    expect(r.affectsYou.map((a) => a.severity)).toEqual(["high", "medium", "low"]);
  });

  it("keeps model order within the same severity tier (stable sort)", () => {
    const r = parseExplanation(
      JSON.stringify({
        plain: "p",
        affects_you: [
          { point: "first high", severity: "high" },
          { point: "second high", severity: "high" },
        ],
        questions: [],
      }),
    );
    expect(r.affectsYou.map((a) => a.point)).toEqual(["first high", "second high"]);
  });

  it("throws when there is no JSON at all", () => {
    expect(() => parseExplanation("I cannot help with that.")).toThrow();
  });
});
