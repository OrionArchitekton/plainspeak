// Bounded, explicitly invoked fictional evaluation. Never run from CI or a timer.
import Anthropic from '@anthropic-ai/sdk';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { buildVerificationRequest, inspectAudit, verificationInput, verificationReport } from '../lib/verification.ts';

const args = process.argv.slice(2);
const dryRun = args.length === 1 && args[0] === '--dry-run';
if (!dryRun && (args.length !== 2 || args[0] !== '--output-dir')) {
  throw new Error('Use --dry-run, or --output-dir PATH after provider usage and credential access are authorized.');
}
const cases = JSON.parse(await readFile(new URL('./fixtures/verification-cases.json', import.meta.url), 'utf8'));
if (cases.length !== 6) throw new Error('Expected exactly six bounded cases');
const entries = [];
for (const test of cases) {
  if (!/^[a-z-]+\.json$/.test(test.requestFile) || !/^[a-z-]+$/.test(test.name)) throw new Error('Invalid fixture name');
  const request = JSON.parse(await readFile(new URL('./fixtures/' + test.requestFile, import.meta.url), 'utf8'));
  const input = verificationInput(request, test.draft);
  entries.push({ test, input, inputSha256: createHash('sha256').update(JSON.stringify(input)).digest('hex') });
}
if (dryRun) {
  console.log(JSON.stringify(entries.map(({ test, input, inputSha256 }) => ({ name: test.name, expected: test.expected, sourceUnits: input.sourceUnits.length, draftUnits: input.draftUnits.length, inputSha256 })), null, 2));
} else {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Provide the existing authorized key through the process environment; do not save or print it.');
  const output = resolve(args[1]);
  // Reserve a new private leaf; reject existing paths, including symlinks.
  await mkdir(output, { mode: 0o700 });
  const receipt = join(output, 'results.json');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 50000, maxRetries: 0 });
  const results = [];
  for (const { test, input, inputSha256 } of entries) {
    const started = performance.now();
    let result;
    try {
      const message = await client.messages.create(buildVerificationRequest(input), { signal: AbortSignal.timeout(50000) });
      const text = verificationReport(message);
      const { allowed, complete } = text === null ? { allowed: false, complete: false } : inspectAudit(text, input);
      let judgment;
      try { judgment = JSON.parse(text); } catch { judgment = null; }
      const explicitRejection = complete && judgment?.verdict === 'reject' && Array.isArray(judgment.issues) && judgment.issues.length > 0;
      result = { name: test.name, expected: test.expected, inputSha256, elapsedMs: Math.round(performance.now() - started), model: message.model, stopReason: message.stop_reason,
        usage: { inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens }, allowed, complete,
        metProtocolExpectation: test.expected === 'pass' ? allowed : explicitRejection,
        audit: judgment, rawAudit: message.content, semanticReviewRequired: true };
    } catch {
      // Provider exception text can contain private request/provider details.
      result = { name: test.name, expected: test.expected, inputSha256, elapsedMs: Math.round(performance.now() - started), error: 'Provider evaluation failed', metProtocolExpectation: false, semanticReviewRequired: true };
    }
    results.push(result);
    await writeFile(join(output, test.name + '.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ name: result.name, elapsedMs: result.elapsedMs, metProtocolExpectation: result.metProtocolExpectation }));
  }
  await writeFile(receipt, JSON.stringify(results, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  if (results.some(result => !result.metProtocolExpectation)) process.exitCode = 1;
}
