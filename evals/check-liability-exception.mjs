// Case-specific acceptance check for a real browser capture, not a legal validator.
// This command reads evidence only; it never makes a provider request.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";

assert.ok(process.argv[2], "Usage: node evals/check-liability-exception.mjs <browser-capture.json>");
const fixture = JSON.parse(readFileSync(new URL("./fixtures/liability-exception.json", import.meta.url), "utf8"));
const capture = JSON.parse(readFileSync(process.argv[2], "utf8"));
assert.ok(isDeepStrictEqual(capture.request, fixture), "Use the unchanged fictional request, reading level and situation");
const { network, page } = capture.observations;
assert.ok(network.requests.length === 1, "Expected one real app request");
const http = network.requests[0];
assert.ok(http.status === 200, "Live explanation must succeed");
const explanation = JSON.parse(http.body);
const descriptions = [explanation.plain, ...explanation.affectsYou.map(item => item.point)];
const caps = descriptions.filter(text => /\bliabilit(?:y|ies)\b|\bcapped\b/i.test(text));
assert.ok(caps.length > 0, "The explanation must cover the liability cap");
for (const text of caps) {
  const namesException = /\b(?:deliberate|intentional)\s+(?:misconduct|wrongdoing)\b/i.test(text);
  const qualifiesCap = /\bexcept(?:ion)?\b|\bunless\b|does(?: not|n't) apply|not (?:capped|limited)|\buncapped\b/i.test(text);
  assert.ok(namesException && qualifiesCap, "Each liability-cap description must retain its misconduct exception");
  const normalize = value => value.replace(/\s+/g, " ").trim();
  assert.ok(normalize(page.text).includes(normalize(text)), "The qualified cap must be rendered in the deployed app");
}
assert.ok(!page.sampleLabel, "A frozen sample cannot prove live behavior");
console.log(`PASS: liability cap and misconduct exception appear together in ${caps.length} rendered description(s).`);
