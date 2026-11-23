import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { MAX_JOURNEY_BYTES } from '../src/bounds.mjs';
import { FixtureError } from '../src/errors.mjs';
import { parseJourney } from '../src/parse.mjs';

const checkoutUrl = new URL('../fixtures/journeys/checkout.journey.json', import.meta.url);
const invalidUrl = new URL('../fixtures/journeys/invalid-action.journey.json', import.meta.url);
const externalUrl = new URL('../fixtures/journeys/invalid-external.journey.json', import.meta.url);

test('the labeled valid journey parses eight approved steps', async () => {
  const journey = parseJourney(await readFile(checkoutUrl, 'utf8'), 'checkout');
  assert.equal(journey.fixtureLabel, 'valid-checkout');
  assert.equal(journey.id, 'shop-checkout');
  assert.deepEqual(journey.steps.map((step) => step.action.type), [
    'tab',
    'type',
    'enter',
    'tab',
    'enter',
    'escape',
    'tab',
    'enter',
  ]);
  assert.equal(journey.steps.find((step) => step.id === 'reach-checkout').action.maxTabs, 8);
  assert.equal(journey.steps[0].expect.observation, 'browser-semantics');
});

test('a click is rejected with the approved action list', async () => {
  await assert.rejects(
    async () => parseJourney(await readFile(invalidUrl, 'utf8'), 'invalid-action'),
    (error) => {
      assert.ok(error instanceof FixtureError);
      assert.equal(error.category, 'unapproved_action');
      assert.match(error.message, /click/);
      assert.match(error.message, /tab, shiftTab, enter, escape, and type/);
      assert.match(error.message, /was not started/);
      return true;
    },
  );
});

test('an external URL is rejected before an unapproved-action fallback', async () => {
  await assert.rejects(
    async () => parseJourney(await readFile(externalUrl, 'utf8'), 'invalid-external'),
    (error) => {
      assert.equal(error.category, 'external_navigation');
      assert.match(error.message, /https:\/\/example.com/);
      assert.match(error.message, /was not started/);
      return true;
    },
  );
});

test('oversized and non-json input name the bound', () => {
  assert.throws(
    () => parseJourney('x'.repeat(MAX_JOURNEY_BYTES + 1), 'huge'),
    (error) => error.category === 'invalid_fixture' && /65536 bytes/.test(error.message),
  );
  assert.throws(
    () => parseJourney('{', 'broken'),
    (error) => error.category === 'invalid_fixture' && /not valid JSON/.test(error.message),
  );
});

test('typed text longer than the journey limit is rejected', async () => {
  const journey = JSON.parse(await readFile(checkoutUrl, 'utf8'));
  journey.steps[1].action.text = 'pen '.repeat(20);
  assert.throws(
    () => parseJourney(JSON.stringify(journey), 'long-text'),
    (error) => error.category === 'invalid_fixture' && /characters/.test(error.message),
  );
});
