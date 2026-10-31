import { describe, expect, it } from "vitest";
import { auditAllowsDraft, inspectAudit, verificationInput, verificationReport } from "./verification";

const input = verificationInput({ document: "Early cancellation refunds payments less a fee. Studio cancellation refunds all payments.", readingLevel: "plain" }, {
  plain: "Early cancellation refunds paid amounts minus the fee; Studio cancellation refunds all payments.",
  affectsYou: [{ point: "Studio cancellation refunds all payments.", severity: "high" }],
  questions: ["How do I request it?"],
});
function validAudit() {
  return { verdict: "pass", issues: [] as { kind: string; sourceIds: string[]; draftIds: string[]; quote: string; reason: string }[], sourceChecks: input.sourceUnits.map(unit => ({ sourceId: unit.id, status: "covered", draftIds: ["p0"] })),
    draftChecks: input.draftUnits.map(unit => ({ draftId: unit.id, status: unit.kind === "question" ? "question" : "supported", sourceIds: unit.kind === "question" ? [] : ["s0", "s1"] })) };
}

describe("independent audit publication boundary", () => {
  it("recognizes a complete rejection with an exact quoted defect and refuses invented witnesses", () => {
    const target = verificationInput({ document: "Refunds require written notice.", readingLevel: "plain" }, {
      plain: "A phone call guarantees a refund.", affectsYou: [{ point: "Your phone call guarantees a refund.", severity: "high" }], questions: ["Who accepts notice?"],
    });
    const report = { verdict: "reject", sourceChecks: [{ sourceId: "s0", status: "issue", draftIds: ["p0", "a0"] }],
      draftChecks: target.draftUnits.map(unit => ({ draftId: unit.id, status: unit.kind === "question" ? "question" : "issue", sourceIds: unit.kind === "question" ? [] : ["s0"] })),
      issues: [{ kind: "unsupported", sourceIds: ["s0"], draftIds: ["p0", "a0"], quote: "phone call guarantees a refund", reason: "Source requires written notice; a phone call is not specified." }] };
    expect(inspectAudit(JSON.stringify(report), target)).toEqual({ complete: true, allowed: false });
    report.issues[0].quote = "A guarantee absent from the actual draft";
    expect(inspectAudit(JSON.stringify(report), target)).toEqual({ complete: false, allowed: false });
  });
  it("recognizes a missing-qualification rejection grounded in the defective draft quote", () => {
    const target = verificationInput({ document: "Late cancellations are non-refundable unless the provider cancels or an evacuation blocks access.", readingLevel: "plain" }, {
      plain: "No refund unless the provider cancels.", affectsYou: [], questions: [],
    });
    const report = { verdict: "reject", sourceChecks: [{ sourceId: "s0", status: "issue", draftIds: ["p0"] }],
      draftChecks: [{ draftId: "p0", status: "issue", sourceIds: ["s0"] }],
      issues: [{ kind: "missing", sourceIds: ["s0"], draftIds: ["p0"], quote: "No refund unless the provider cancels.", reason: "The local no-refund rule omits the evacuation exception." }] };
    expect(inspectAudit(JSON.stringify(report), target)).toEqual({ complete: true, allowed: false });
    report.issues[0].quote = "Words absent from every cited unit";
    expect(inspectAudit(JSON.stringify(report), target)).toEqual({ complete: false, allowed: false });
  });
  it("requires source references for omissions and draft references for defective claims", () => {
    const report = validAudit(); report.verdict = "reject";
    report.issues = [{ kind: "unsupported", sourceIds: ["s1"], draftIds: [], quote: "Studio cancellation refunds all payments.", reason: "Test-only complaint with no identified draft claim." }];
    expect(inspectAudit(JSON.stringify(report), input).complete).toBe(false);
    report.issues[0] = { kind: "missing", sourceIds: [], draftIds: ["a0"], quote: "Studio cancellation refunds all payments.", reason: "Test-only omission with no identified source rule." };
    expect(inspectAudit(JSON.stringify(report), input).complete).toBe(false);
  });
  it("accepts a complete report and distinguishes a complete rejection from malformed output", () => {
    const audit = validAudit();
    expect(inspectAudit(JSON.stringify(audit), input)).toEqual({ complete: true, allowed: true });
    // Protocol-only: whether a quoted complaint is semantically true is measured separately.
    audit.verdict = "reject"; audit.issues.push({ kind: "unsupported", sourceIds: ["s1"], draftIds: ["a0"], quote: "Studio cancellation refunds all payments.", reason: "A test-only claimed defect." });
    audit.draftChecks[1].status = "issue";
    expect(inspectAudit(JSON.stringify(audit), input)).toEqual({ complete: true, allowed: false });
    expect(inspectAudit("```json\n" + JSON.stringify(audit) + "\n```", input)).toEqual({ complete: false, allowed: false });
  });
  it.each(["wrong draft", "wrong source", "unknown id", "duplicate id", "long reason", "empty quote", "too many issues"])("refuses malformed defect evidence: %s", flaw => {
    const report = validAudit(); report.verdict = "reject";
    const issue = { kind: "unsupported", sourceIds: ["s0"], draftIds: ["p0"], quote: "Early cancellation refunds paid amounts", reason: "Test-only claimed defect." };
    if (flaw === "wrong draft") issue.draftIds = ["a0"];
    if (flaw === "wrong source") { issue.kind = "missing"; issue.draftIds = []; issue.quote = "Studio cancellation refunds all payments."; }
    if (flaw === "unknown id") issue.sourceIds = ["s100"];
    if (flaw === "duplicate id") issue.draftIds = ["p0", "p0"];
    if (flaw === "long reason") issue.reason = "x".repeat(257);
    if (flaw === "empty quote") issue.quote = " ";
    report.issues = flaw === "too many issues" ? Array.from({ length: 7 }, () => issue) : [issue];
    expect(inspectAudit(JSON.stringify(report), input)).toEqual({ complete: false, allowed: false });
  });
  it.each(["unknown status", "empty evidence", "unknown source", "duplicate draft", "unreviewed question", "question instead of claim", "reported issue"])("withholds a draft with invalid claim evidence: %s", flaw => {
    const audit = validAudit();
    if (flaw === "unknown status") audit.draftChecks[0].status = "checked";
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
    const thinking = { type: "thinking" as const, thinking: "Fictional private comparison", signature: "fictional-signature" };
    const redacted = { type: "redacted_thinking" as const, data: "fictional-encrypted-data" };
    expect(verificationReport({ stop_reason: "tool_use", content: [thinking, redacted, tool] })).toBe(JSON.stringify(validAudit()));
    expect(verificationReport({ stop_reason: "end_turn", content: [thinking, redacted] })).toBeNull();
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
