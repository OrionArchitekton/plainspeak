import { describe, expect, it } from "vitest";
import { auditAllowsDraft, inspectAudit, verificationInput, verificationReport } from "./verification";

const input = verificationInput({ document: "Early cancellation refunds payments less a fee. Studio cancellation refunds all payments.", readingLevel: "plain" }, {
  plain: "Early cancellation refunds paid amounts minus the fee; Studio cancellation refunds all payments.",
  affectsYou: [{ point: "Studio cancellation refunds all payments.", severity: "high" }],
  questions: ["How do I request it?"],
});
function validAudit() {
  return { verdict: "pass", issues: [] as string[], sourceChecks: input.sourceUnits.map(unit => ({ sourceId: unit.id, status: "covered", draftIds: ["p0"] })),
    draftChecks: input.draftUnits.map(unit => ({ draftId: unit.id, status: unit.kind === "question" ? "question" : "supported", sourceIds: unit.kind === "question" ? [] : ["s0", "s1"], reason: "Early refund deducts fee; Studio cancellation returns all payments." })) };
}

describe("independent audit publication boundary", () => {
  it("accepts a complete report and distinguishes a complete rejection from malformed output", () => {
    const audit = validAudit();
    expect(inspectAudit(JSON.stringify(audit), input)).toEqual({ complete: true, allowed: true });
    audit.verdict = "reject"; audit.issues.push("The impact invents an unconditional refund.");
    audit.draftChecks[1].status = "issue";
    expect(inspectAudit(JSON.stringify(audit), input)).toEqual({ complete: true, allowed: false });
    expect(inspectAudit("```json\n" + JSON.stringify(audit) + "\n```", input)).toEqual({ complete: false, allowed: false });
  });
  it.each(["missing reason", "empty evidence", "unknown source", "duplicate draft", "unreviewed question", "question instead of claim", "reported issue"])("withholds a draft with invalid claim evidence: %s", flaw => {
    const audit = validAudit();
    if (flaw === "missing reason") audit.draftChecks[0].reason = " ";
    if (flaw === "empty evidence") audit.draftChecks[0].sourceIds = [];
    if (flaw === "unknown source") audit.draftChecks[0].sourceIds = ["s100"];
    if (flaw === "duplicate draft") audit.draftChecks[1] = audit.draftChecks[0];
    if (flaw === "unreviewed question") audit.draftChecks.pop();
    if (flaw === "question instead of claim") audit.draftChecks[0].status = "question";
    if (flaw === "reported issue") audit.draftChecks[0].status = "issue";
    expect(auditAllowsDraft(JSON.stringify(audit), input)).toBe(false);
  });
  it("requires one completed named audit tool call without executing any tool", () => {
    const tool = { type: "tool_use" as const, id: "audit-1", name: "record_audit", input: validAudit() };
    expect(verificationReport({ stop_reason: "tool_use", content: [tool] })).toBe(JSON.stringify(validAudit()));
    expect(verificationReport({ stop_reason: "max_tokens", content: [tool] })).toBeNull();
    expect(verificationReport({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(validAudit()), citations: null }] })).toBeNull();
    expect(verificationReport({ stop_reason: "tool_use", content: [tool, tool] })).toBeNull();
    expect(verificationReport({ stop_reason: "tool_use", content: [{ ...tool, name: "send_data" }] })).toBeNull();
  });
  it.each(["missing source", "unreviewed impact", "duplicate source", "unknown draft"])("rejects incomplete coverage: %s", flaw => {
    const audit = validAudit();
    if (flaw === "missing source") audit.sourceChecks.pop();
    if (flaw === "unreviewed impact") audit.draftChecks = audit.draftChecks.filter(row => row.draftId !== "a0");
    if (flaw === "duplicate source") audit.sourceChecks[1] = audit.sourceChecks[0];
    if (flaw === "unknown draft") audit.draftChecks[0].draftId = "invented";
    expect(auditAllowsDraft(JSON.stringify(audit), input)).toBe(false);
  });
  it.each(["empty evidence", "question evidence", "unknown evidence", "issue status", "unknown status"])("requires affirmative source evidence: %s", flaw => {
    const audit = validAudit();
    if (flaw === "empty evidence") audit.sourceChecks[0].draftIds = [];
    if (flaw === "question evidence") audit.sourceChecks[0].draftIds = ["q0"];
    if (flaw === "unknown evidence") audit.sourceChecks[0].draftIds = ["p100"];
    if (flaw === "issue status") audit.sourceChecks[0].status = "issue";
    if (flaw === "unknown status") audit.sourceChecks[0].status = "fine";
    expect(auditAllowsDraft(JSON.stringify(audit), input)).toBe(false);
  });
});
