import { describe, expect, it } from "vitest";
import { auditAllowsDraft, verificationInput } from "./verification";

const input = verificationInput({ document: "Early cancellation refunds payments less a fee. Studio cancellation refunds all payments.", readingLevel: "plain" }, {
  plain: "Early cancellation refunds paid amounts minus the fee; Studio cancellation refunds all payments.",
  affectsYou: [{ point: "Studio cancellation refunds all payments.", severity: "high" }],
  questions: ["How do I request it?"],
});
function validAudit() {
  return { verdict: "pass", issues: [], sourceChecks: input.sourceUnits.map(unit => ({ sourceId: unit.id, status: "covered", draftIds: ["p0"] })), reviewedDraftIds: input.draftUnits.map(unit => unit.id) };
}

describe("independent audit publication boundary", () => {
  it.each(["missing source", "unreviewed impact", "duplicate source", "unknown draft"])("rejects incomplete coverage: %s", flaw => {
    const audit = validAudit();
    if (flaw === "missing source") audit.sourceChecks.pop();
    if (flaw === "unreviewed impact") audit.reviewedDraftIds = audit.reviewedDraftIds.filter(id => id !== "a0");
    if (flaw === "duplicate source") audit.sourceChecks[1] = audit.sourceChecks[0];
    if (flaw === "unknown draft") audit.reviewedDraftIds.push("invented");
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
