import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalizeTrace, projectExpectations, tracesEqual } from '../src/normalize.mjs';
import { parseJourney } from '../src/parse.mjs';

test('the hand oracle matches the projected control expectations', async () => {
  const journey = parseJourney(
    await readFile(new URL('../fixtures/journeys/checkout.journey.json', import.meta.url), 'utf8'),
    'checkout',
  );
  const oracle = JSON.parse(
    await readFile(new URL('../fixtures/oracle/checkout-control.json', import.meta.url), 'utf8'),
  );
  const projected = projectExpectations(journey);
  assert.equal(tracesEqual(projected, oracle.trace), true);
});

test('run ids and axe details are outside the normalized trace', () => {
  const checkpoints = [
    {
      stepId: 'focus-search',
      action: 'tab',
      runId: 'run-a',
      startedAt: '2026-11-23T00:00:00.000Z',
      axe: { ruleIds: ['region'] },
      observed: {
        role: 'searchbox',
        name: 'Search products',
        focusId: 'q',
        liveRegion: '',
        appState: 'browsing',
      },
      result: 'pass',
    },
  ];
  const other = structuredClone(checkpoints);
  other[0].runId = 'run-b';
  other[0].axe.ruleIds = ['button-name'];
  assert.deepEqual(normalizeTrace(checkpoints), normalizeTrace(other));
  assert.equal(JSON.stringify(normalizeTrace(checkpoints)).includes('run-a'), false);
});
