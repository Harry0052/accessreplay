import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { loadJourney } from '../src/parse.mjs';
import { tracesEqual } from '../src/normalize.mjs';
import { runJourney } from '../src/run.mjs';
import { writeReport } from '../src/report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function journey(name) {
  return loadJourney(path.join(root, 'fixtures/journeys', name));
}

test('control passes twice and the mutants fail at the oracle steps', async () => {
  const checkout = await journey('checkout.journey.json');
  const outcomes = JSON.parse(
    await readFile(path.join(root, 'fixtures/oracle/expected-outcomes.json'), 'utf8'),
  );
  const oracle = JSON.parse(
    await readFile(path.join(root, 'fixtures/oracle/checkout-control.json'), 'utf8'),
  );
  const out = await mkdtemp(path.join(tmpdir(), 'accessreplay-'));

  const first = await runJourney({ journey: checkout, buildId: 'control' });
  const second = await runJourney({ journey: checkout, buildId: 'control' });
  assert.equal(first.status, 'pass', first.message);
  assert.equal(second.status, 'pass', second.message);
  assert.notEqual(first.runId, second.runId);
  assert.equal(tracesEqual(first.normalizedTrace, second.normalizedTrace), true);
  assert.equal(tracesEqual(first.normalizedTrace, oracle.trace), true);
  assert.equal(JSON.stringify(first.normalizedTrace).includes(first.runId), false);
  assert.equal(JSON.stringify(first.normalizedTrace).includes('ruleIds'), false);
  const written = await writeReport(out, first);
  const saved = JSON.parse(await readFile(written, 'utf8'));
  assert.equal(saved.normalizedTrace.length, oracle.trace.length);

  const name = await runJourney({ journey: checkout, buildId: 'name-mutant' });
  assert.equal(name.status, outcomes.builds['name-mutant'].status);
  assert.equal(name.category, 'evaluated_regression');
  assert.equal(name.firstFailingStep, 'reach-checkout');
  const nameStep = name.checkpoints.at(-1);
  assert.equal(nameStep.observed.focusId, 'place');
  assert.equal(nameStep.observed.name, '');
  assert.equal(nameStep.detail.field, 'name');
  assert.match(name.message, /Place demo order\./);
  assert.equal(name.checkpoints.slice(0, -1).every((item) => item.result === 'pass'), true);

  const focus = await runJourney({ journey: checkout, buildId: 'focus-mutant' });
  assert.equal(focus.category, 'evaluated_regression');
  assert.equal(focus.firstFailingStep, 'escape-cart');
  const focusStep = focus.checkpoints.at(-1);
  assert.equal(focusStep.observed.focusId, 'body');
  assert.equal(focusStep.expected.focusId, 'add-pen');
  assert.match(focus.message, /#add-pen/);
  assert.match(focus.message, /Add pen/);

  const loop = await runJourney({ journey: checkout, buildId: 'tab-loop' });
  assert.equal(loop.category, 'tab_limit');
  assert.equal(loop.firstFailingStep, 'reach-checkout');
  assert.equal(loop.checkpoints.at(-1).observed.focusId === 'place', false);
  assert.match(loop.message, /8 tabs/);

  const timeout = await runJourney({ journey: checkout, buildId: 'timeout' });
  assert.equal(timeout.status, 'timeout');
  assert.equal(timeout.category, 'application_timeout');
  assert.equal(timeout.firstFailingStep, null);
  assert.equal(timeout.checkpoints.length, 0);
  assert.match(timeout.message, /not an evaluated regression/);

  const speech = await journey('unsupported.journey.json');
  const unsupported = await runJourney({ journey: speech, buildId: 'unsupported' });
  assert.equal(unsupported.status, 'unsupported');
  assert.equal(unsupported.category, 'unsupported_observation');
  assert.equal(unsupported.firstFailingStep, 'focus-search');
  assert.equal(unsupported.checkpoints[0].result, 'unsupported');
  assert.match(unsupported.message, /not scored as a regression/);

  const redirectJourney = await journey('redirect.journey.json');
  const redirect = await runJourney({ journey: redirectJourney, buildId: 'redirect' });
  assert.equal(redirect.status, 'rejected', redirect.message);
  assert.equal(redirect.category, 'wrong_origin');
  assert.equal(redirect.checkpoints.length, 0);
  assert.match(redirect.message, /example.com/);
});

test('cli run writes the control report and the name failure', () => {
  const out = mkdtempSync(path.join(tmpdir(), 'accessreplay-cli-'));
  const control = spawnSync(process.execPath, [
    'cli.mjs', 'run',
    '--journey', 'fixtures/journeys/checkout.journey.json',
    '--build', 'control',
    '--out', out,
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(control.status, 0, control.stderr);
  const summary = JSON.parse(control.stdout);
  assert.equal(summary.ok, true);
  assert.equal(summary.status, 'pass');
  const name = spawnSync(process.execPath, [
    'cli.mjs', 'run',
    '--journey', 'fixtures/journeys/checkout.journey.json',
    '--build', 'name-mutant',
    '--out', out,
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(name.status, 1, name.stderr);
  const failed = JSON.parse(name.stdout);
  assert.equal(failed.firstFailingStep, 'reach-checkout');
  assert.match(name.stderr, /Place demo order\./);
  const focus = spawnSync(process.execPath, [
    'cli.mjs', 'run',
    '--journey', 'fixtures/journeys/checkout.journey.json',
    '--build', 'focus-mutant',
    '--out', out,
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(focus.status, 1, focus.stderr);
  assert.match(focus.stderr, /#add-pen/);
  assert.match(focus.stderr, /evaluated regression/);
});
