import assert from 'node:assert/strict';
import test from 'node:test';
import { renderHtmlReport } from '../src/html-report.mjs';

test('the report escapes markup and keeps the manual sheet unreviewed', () => {
  const html = renderHtmlReport({
    summary: {
      schemaVersion: '1.0.0',
      verdict: 'Check <the> finding',
      keyboard: [{ stepId: 'escape-cart', keys: 'Escape' }],
      runs: [{
        buildId: 'focus-mutant',
        category: 'evaluated_regression',
        firstFailingStep: 'escape-cart',
        divergence: 'expected focus #add-pen "Add pen"',
        source: 'fixtures/journeys/checkout.journey.json against fixtures/shop/focus-mutant/index.html',
      }],
    },
    observations: {
      screenReader: '',
      operatingSystem: '',
      version: '',
      steps: [{
        stepId: 'escape-cart',
        keys: 'Escape',
        expectedAnnouncement: 'Verify whether Escape returns the reader to Add pen.',
        observedAnnouncement: '',
        state: 'unreviewed',
      }],
    },
  });
  assert.equal(html.includes('<the>'), false);
  assert.match(html, /unreviewed/);
  assert.match(html, /fixtures\/journeys\/checkout\.journey\.json/);
  assert.match(html, /Place demo order|Add pen/);
  assert.match(html, /not a conformance result/);
});
