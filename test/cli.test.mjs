import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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

test('validate accepts the checkout journey', () => {
  const result = run(['validate', 'fixtures/journeys/checkout.journey.json']);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.journeyId, 'shop-checkout');
  assert.equal(payload.steps, 8);
  assert.equal(result.stderr, '');
});

test('validate rejects the click fixture with an actionable error', () => {
  const result = run(['validate', 'fixtures/journeys/invalid-action.journey.json']);
  assert.equal(result.status, 2);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.equal(payload.category, 'unapproved_action');
  assert.match(payload.message, /Approved actions are tab, shiftTab, enter, escape, and type/);
  assert.match(result.stderr, /was not started/);
});

test('verify-manifest accepts the committed fixture tree', () => {
  const result = run(['verify-manifest']);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.license, 'MIT');
  assert.ok(payload.files > 0);
});

test('validate rejects external navigation', () => {
  const result = run(['validate', 'fixtures/journeys/invalid-external.journey.json']);
  assert.equal(result.status, 2);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.category, 'external_navigation');
  assert.match(result.stderr, /https:\/\/example.com/);
});
