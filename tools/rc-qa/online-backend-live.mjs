// LOCAL CLI ONLY. Unlike browser.mjs, this explicitly authorized test writes to production.
// Not imported by the site; tools/ is excluded from GitHub Pages.
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

if (process.argv[2] !== '--write-online-test' || process.argv.length !== 3) {
  console.log('Usage: node tools/rc-qa/online-backend-live.mjs --write-online-test');
  console.log('Writes the two specified Online test messages and replays the second request once. No automatic POST retries.');
  process.exit(0);
}
const root = path.resolve(import.meta.dirname, '../..');
const source = await fs.readFile(path.join(root, 'script.js'), 'utf8');
assert.match(source, /const ONLINE_MESSAGE_BACKEND_READY = false;/, 'Keep the production Online gate closed.');
const endpoint = source.match(/const RSVP_ENDPOINT\s*=\s*"([^"]+)";/)?.[1];
assert.ok(endpoint && /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint));
const base = { invite: 'online', name: 'Online 測試', phone: '', ceremony: '', banquet: '', online: '會參加', people: '0', vegetarian: '0', note: '' };
const first = { ...base, message: '這是一筆 Online 留言測試', submissionId: randomUUID() };
const second = { ...base, message: '這是第二筆同名 Online 留言測試', submissionId: randomUUID() };
const report = { startedAt: new Date().toISOString(), endpoint, gate: false, plannedRequests: [first, second, second], requests: [], errors: [], sheetVerified: false };
const output = `/private/tmp/wedding-online-backend-${first.submissionId}.json`;
const save = () => fs.writeFile(output, JSON.stringify(report, null, 2));
await save();
console.log('Evidence:', output);

async function request(url, options, evidence) {
  const response = await fetch(url, { ...options, redirect: 'follow', signal: AbortSignal.timeout(45000) });
  evidence.httpStatus = response.status;
  evidence.finalUrl = response.url;
  evidence.raw = await response.text();
  await save();
  assert.ok(response.ok, `HTTP ${response.status}`);
  return evidence.raw;
}
try {
  for (const [index, payload] of report.plannedRequests.entries()) {
    const evidence = { step: index + 1, kind: index === 2 ? 'exact replay' : 'new submission', payload, startedAt: new Date().toISOString() };
    report.requests.push(evidence);
    await save(); // Persist IDs before the write, including ambiguous transport failures.
    evidence.result = JSON.parse(await request(endpoint, { method: 'POST', body: new URLSearchParams(payload) }, evidence));
    console.log('POST', evidence.step, JSON.stringify(evidence.result));
    assert.equal(evidence.result.success, true);
    assert.equal(evidence.result.action, 'created');
    evidence.polls = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      const poll = {};
      evidence.polls.push(poll);
      const callback = 'onlineBackendCheck';
      const url = new URL(endpoint);
      url.search = new URLSearchParams({ action: 'status', id: payload.submissionId, callback, _: `${Date.now()}-${attempt}` }).toString();
      const raw = await request(url, {}, poll);
      const wrapped = raw.match(/^onlineBackendCheck\(([\s\S]*)\);?\s*$/);
      poll.result = JSON.parse(wrapped ? wrapped[1] : raw);
      if (poll.result.ready) {
        assert.equal(poll.result.success, true);
        assert.equal(poll.result.action, 'created');
        break;
      }
      if (attempt < 4) await new Promise(resolve => setTimeout(resolve, 1000));
    }
    assert.equal(evidence.polls.at(-1).result.ready, true, 'Status polling did not become ready.');
    await save();
  }
  report.sameReplayResult = JSON.stringify(report.requests[1].result) === JSON.stringify(report.requests[2].result);
  assert.equal(report.sameReplayResult, true, 'Replay did not return the previous result.');
  report.apiChecks = 'PASS';
  console.log('API checks PASS. Actual Sheet row count/content and deduplication require Sheet evidence; matching cached results alone do not prove no third row.');
} catch (error) {
  report.errors.push({ message: String(error), cause: error.cause ? String(error.cause) : undefined });
  report.apiChecks = 'FAIL';
  console.error('Stopped without automatic POST retry:', String(error));
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await save();
  console.log('Evidence:', output);
}
