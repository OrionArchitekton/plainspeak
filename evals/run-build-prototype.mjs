// Manual fictional evaluation inside a Vercel build. Never returns build success.
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export async function collectBuildPrototype({ audit, post, requests, emit, auditsOnly = false }) {
  let collectionComplete = false;
  let auditBatchComplete = false;
  try {
    if (requests.length !== 3) throw new Error('Unexpected fixture count');
    const audits = await audit();
    if (!Array.isArray(audits) || audits.length !== 6) throw new Error('Incomplete audit batch');
    auditBatchComplete = true;
    emit('audits', audits);
    if (audits.some(result => result?.metProtocolExpectation !== true)) throw new Error('Audit prerequisite failed');
    if (auditsOnly) return;
    for (const { name, request } of requests) {
      const start = performance.now();
      let result;
      try {
        const response = await post(request);
        result = { request, status: response.status, cacheControl: response.headers.get('cache-control'), body: await response.text() };
      } catch { result = { request, error: 'Request failed; no retry attempted' }; }
      emit('request-' + name, { ...result, elapsedMs: Math.round(performance.now() - start) });
    }
    collectionComplete = true;
  } catch { emit('error', { error: 'Prototype collection failed; no retry attempted' }); }
  finally {
    emit('finished', { collectionComplete, auditBatchComplete, requestedPhase: auditsOnly ? 'audits-only' : 'full', providerCallCeiling: auditsOnly ? 6 : 12, semanticReviewRequired: true });
    throw new Error('Prototype publication stopped intentionally');
  }
}

const PREFIX = 'PLAINSPEAK_PROTO_V1 ';
const RECORDS = new Set(['started', 'audits', 'partial-audits', 'error', 'finished', 'request-refunds', 'request-liability', 'request-warranty']);
export function encodeBuildReceipt(record, value, secret) {
  if (!RECORDS.has(record) || typeof secret !== 'string' || !secret) throw new Error('Invalid receipt parameters');
  const redact = item => {
    if (typeof item === 'string') return item.replaceAll(secret, '[REDACTED]');
    if (Array.isArray(item)) return item.map(redact);
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([key, entry]) => [redact(key), redact(entry)]));
    return item;
  };
  const bytes = Buffer.from(JSON.stringify(redact(JSON.parse(JSON.stringify(value)))));
  const hash = createHash('sha256').update(bytes).digest('hex');
  const data = bytes.toString('base64');
  const count = Math.ceil(data.length / 2048);
  return Array.from({ length: count }, (_, index) => PREFIX + JSON.stringify({ record, index, count, hash, data: data.slice(index * 2048, (index + 1) * 2048) }));
}

export function decodeBuildReceipts(lines, { allowIncomplete = false } = {}) {
  const groups = new Map();
  for (const line of lines) {
    if (!line.startsWith(PREFIX)) continue;
    const frame = JSON.parse(line.slice(PREFIX.length));
    if (!RECORDS.has(frame.record) || !Number.isInteger(frame.index) || !Number.isInteger(frame.count) ||
        frame.count < 1 || frame.count > 1024 || frame.index < 0 || frame.index >= frame.count ||
        !/^[a-f0-9]{64}$/.test(frame.hash) || typeof frame.data !== 'string' || frame.data.length > 2048 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(frame.data)) throw new Error('Invalid receipt frame');
    const group = groups.get(frame.record) || { hash: frame.hash, count: frame.count, chunks: new Map() };
    if (group.hash !== frame.hash || group.count !== frame.count ||
        (group.chunks.has(frame.index) && group.chunks.get(frame.index) !== frame.data)) throw new Error('Conflicting receipt frame');
    group.chunks.set(frame.index, frame.data); groups.set(frame.record, group);
  }
  /** @type {Record<string, unknown>} */
  const result = {};
  for (const [record, group] of groups) {
    if (group.chunks.size !== group.count) throw new Error('Missing receipt frames');
    const encoded = Array.from({ length: group.count }, (_, index) => group.chunks.get(index)).join('');
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.toString('base64') !== encoded || createHash('sha256').update(bytes).digest('hex') !== group.hash) throw new Error('Corrupt receipt');
    result[record] = JSON.parse(bytes.toString('utf8'));
  }
  const required = ['started', 'audits', 'request-refunds', 'request-liability', 'request-warranty', 'finished'];
  const collectionComplete = required.every(name => Object.hasOwn(result, name)) &&
    result.finished?.collectionComplete === true && result.finished?.providerCallCeiling === 12 &&
    result.started?.providerCallCeiling === 12 && Array.isArray(result.audits) && result.audits.length === 6;
  if (!collectionComplete && !allowIncomplete) throw new Error('Incomplete receipt collection');
  return { records: result, collectionComplete };
}

export async function readBuildAudits(output, emit) {
  try {
    const results = JSON.parse(await readFile(join(output, 'results.json'), 'utf8'));
    if (!Array.isArray(results) || results.length !== 6) throw new Error('Incomplete aggregate');
    return results;
  } catch {
    const cases = [];
    const files = await readdir(output).catch(() => []);
    for (const file of files.filter(name => name !== 'results.json' && /^[a-z-]+\.json$/.test(name)).sort()) {
      const raw = await readFile(join(output, file), 'utf8');
      try { cases.push(JSON.parse(raw)); }
      catch { cases.push({ file, incompleteReceipt: raw }); }
    }
    emit('partial-audits', { collectionComplete: false, cases });
    throw new Error('Incomplete audit aggregate; no retry');
  }
}

async function main() {
  const args = process.argv.slice(2).join(' ');
  const auditsOnly = args === '--vercel-build-only --audits-only';
  if ((!auditsOnly && args !== '--vercel-build-only') || process.env.VERCEL_ENV !== 'production' || !process.env.ANTHROPIC_API_KEY) {
    throw new Error('Explicit production-configured test build required');
  }
  // These affect this isolated test process only, never project settings.
  for (const name of ['DEBUG', 'ANTHROPIC_LOG', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN']) delete process.env[name];
  const emit = (name, value) => {
    for (const line of encodeBuildReceipt(name, value, process.env.ANTHROPIC_API_KEY)) console.log(line);
  };
  emit('started', { providerCallCeiling: auditsOnly ? 6 : 12, requestedPhase: auditsOnly ? 'audits-only' : 'full', sourceSha: process.env.VERCEL_GIT_COMMIT_SHA || null, publication: 'blocked' });
  const require = createRequire(import.meta.url);
  const post = require(resolve('.next/server/app/api/explain/route.js')).routeModule?.userland?.POST;
  if (typeof post !== 'function') throw new Error('Compiled POST handler unavailable');
  const { NextRequest } = require('next/server');
  const requests = [];
  for (const [name, file] of [['refunds', 'workshop-refunds.json'], ['liability', 'subscription-liability.json'], ['warranty', 'warranty-exclusions.json']]) {
    requests.push({ name, request: JSON.parse(await readFile(new URL('./fixtures/' + file, import.meta.url), 'utf8')) });
  }
  const folder = await mkdtemp(join(tmpdir(), 'plainspeak-build-prototype-'));
  await collectBuildPrototype({
    requests, emit, auditsOnly,
    audit: async () => {
      const output = join(folder, 'audits');
      await new Promise(resolveDone => {
        execFile(process.execPath, ['--experimental-strip-types', fileURLToPath(new URL('./run-verification.mjs', import.meta.url)), '--output-dir', output],
          { timeout: 315000, maxBuffer: 1024 * 1024, env: {
            PATH: process.env.PATH, NODE_ENV: 'production', ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
            ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL, ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
          } }, () => resolveDone());
      });
      return readBuildAudits(output, emit);
    },
    post: request => post(new NextRequest('http://localhost/api/explain', { method: 'POST', body: JSON.stringify(request), headers: { 'Content-Type': 'application/json' } })),
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = 1;
  main().catch(() => console.error('PLAINSPEAK_PROTOTYPE: publication stopped intentionally; inspect receipt frames.'));
}
