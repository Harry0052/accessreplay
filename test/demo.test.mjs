import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(args) {
  return spawnSync(process.execPath, ['cli.mjs', ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

test('demo writes the html export and names the first divergences', async () => {
  const out = mkdtempSync(path.join(tmpdir(), 'accessreplay-demo-'));
  const started = Date.now();
  const result = run(['demo', '--out', out]);
  const elapsedMs = Date.now() - started;
  assert.equal(result.status, 0, result.stderr);
  assert.ok(elapsedMs < 90_000, `demo took ${elapsedMs} ms, budget is 90000 ms`);
  const fresh = mkdtempSync(path.join(tmpdir(), 'accessreplay-demo-'));
  const again = run(['demo', '--out', fresh]);
  assert.equal(again.status, 0, again.stderr);
  assert.equal(again.stdout, result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.ok, true);
  assert.equal(summary.manual.state, 'unreviewed');
  assert.equal(summary.runs.find((item) => item.buildId === 'control').status, 'pass');
  const focus = summary.runs.find((item) => item.buildId === 'focus-mutant');
  const name = summary.runs.find((item) => item.buildId === 'name-mutant');
  assert.equal(focus.firstFailingStep, 'escape-cart');
  assert.match(focus.divergence, /#add-pen/);
  assert.equal(name.firstFailingStep, 'reach-checkout');
  assert.match(name.divergence, /Place demo order\./);
  assert.match(result.stderr, /Keyboard sequence/);
  assert.match(result.stderr, /Type "pen"/);
  const html = await readFile(path.join(out, 'summary.html'), 'utf8');
  assert.match(html, /unreviewed/);
  assert.match(html, /fixtures\/shop\/name-mutant\/index\.html/);
  assert.match(html, /fixtures\/journeys\/checkout\.journey\.json/);
  const saved = JSON.parse(await readFile(path.join(out, 'name-mutant.json'), 'utf8'));
  assert.equal(saved.firstFailingStep, 'reach-checkout');
  assert.equal(saved.checkpoints.at(-1).observed.focusId, 'place');
  assert.equal(saved.checkpoints.at(-1).observed.name, '');
});

test('run explains an unapproved action before launching a result file', () => {
  const out = mkdtempSync(path.join(tmpdir(), 'accessreplay-bad-'));
  const started = Date.now();
  const result = run([
    'run',
    '--journey', 'fixtures/journeys/invalid-action.journey.json',
    '--build', 'control',
    '--out', out,
  ]);
  assert.equal(result.status, 2);
  assert.ok(Date.now() - started < 5000);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.category, 'unapproved_action');
  assert.match(result.stderr, /Approved actions are tab, shiftTab, enter, escape, and type/);
  assert.match(result.stderr, /was not started/);
});
