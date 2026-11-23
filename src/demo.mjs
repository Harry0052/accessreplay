import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { keyboardSequence } from './keyboard.mjs';
import { renderHtmlReport } from './html-report.mjs';
import { loadJourney } from './parse.mjs';
import { writeReport } from './report.mjs';
import { runJourney } from './run.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const DEMO_CASES = [
  { buildId: 'control', journeyFile: 'checkout.journey.json' },
  { buildId: 'focus-mutant', journeyFile: 'checkout.journey.json' },
  { buildId: 'name-mutant', journeyFile: 'checkout.journey.json' },
  { buildId: 'tab-loop', journeyFile: 'checkout.journey.json' },
  { buildId: 'timeout', journeyFile: 'checkout.journey.json' },
  { buildId: 'unsupported', journeyFile: 'unsupported.journey.json' },
  { buildId: 'redirect', journeyFile: 'redirect.journey.json' },
];

function divergence(report) {
  const failed = report.checkpoints.find((item) => item.result === 'fail');
  if (!failed) return report.message;
  if (failed.detail?.field === 'name') {
    return `expected name "${failed.detail.expected}" on #${failed.expected.focusId}, observed "${failed.detail.observed}"`;
  }
  if (failed.detail?.field === 'focusId') {
    return `expected focus #${failed.detail.expected} "${failed.expected.name}", observed focus #${failed.detail.observed} "${failed.observed.name}"`;
  }
  if (failed.category === 'tab_limit') {
    return `expected focus #${failed.expected.focusId} within the tab limit, observed #${failed.observed.focusId} "${failed.observed.name}"`;
  }
  return report.message;
}

function matchesOracle(report, expected) {
  return report.status === expected.status
    && report.category === expected.category
    && report.firstFailingStep === expected.firstFailingStep;
}

export async function runDemo({ outDir, observationsPath } = {}) {
  const output = path.resolve(outDir || path.join(root, 'reports/demo'));
  const outcomes = JSON.parse(
    await readFile(path.join(root, 'fixtures/oracle/expected-outcomes.json'), 'utf8'),
  );
  const checkout = await loadJourney(path.join(root, 'fixtures/journeys/checkout.journey.json'));
  const keyboard = keyboardSequence(checkout);
  let observations;
  try {
    observations = JSON.parse(await readFile(
      observationsPath || path.join(root, 'fixtures/observations/manual.json'),
      'utf8',
    ));
  } catch (error) {
    observations = {
      schemaVersion: '1.0.0',
      screenReader: '',
      operatingSystem: '',
      version: '',
      steps: [],
      unavailable: `The manual sheet could not be read (${error.message}). Add fixtures/observations/manual.json and run the demo again.`,
    };
  }
  const runs = [];
  for (const item of DEMO_CASES) {
    const journey = item.journeyFile === 'checkout.journey.json'
      ? checkout
      : await loadJourney(path.join(root, 'fixtures/journeys', item.journeyFile));
    const report = await runJourney({ journey, buildId: item.buildId });
    const written = await writeReport(output, report);
    const expected = outcomes.builds[item.buildId];
    const agreed = matchesOracle(report, expected);
    runs.push({
      buildId: item.buildId,
      journeyId: journey.id,
      status: report.status,
      category: report.category,
      firstFailingStep: report.firstFailingStep,
      divergence: divergence(report),
      message: report.message,
      agreed,
      source: `fixtures/journeys/${item.journeyFile} against fixtures/shop/${item.buildId}/index.html`,
      report: written,
    });
  }
  const ok = runs.every((item) => item.agreed);
  const manualSteps = keyboard.map((step) => {
    const recorded = (observations.steps || []).find((item) => item.stepId === step.stepId);
    return {
      stepId: step.stepId,
      keys: step.keys,
      expectedAnnouncement: recorded?.expectedAnnouncement
        || 'Verify the announcement for this step with a screen reader. None is recorded in the sheet.',
      observedAnnouncement: recorded?.observedAnnouncement || '',
      state: recorded?.state === 'reviewed' ? 'reviewed' : 'unreviewed',
    };
  });
  const summary = {
    ok,
    schemaVersion: '1.0.0',
    verdict: ok
      ? 'The demo matched the hand oracle: the control passed and every seeded fault was named at its first step.'
      : 'The demo did not match the hand oracle. Open the HTML report and compare the listed step with fixtures/oracle/expected-outcomes.json.',
    keyboard,
    manual: {
      state: manualSteps.every((step) => step.state === 'unreviewed') ? 'unreviewed' : 'partial',
      screenReader: observations.screenReader || '',
      operatingSystem: observations.operatingSystem || '',
      version: observations.version || '',
      unavailable: observations.unavailable || null,
    },
    runs: runs.map((item) => ({
      buildId: item.buildId,
      journeyId: item.journeyId,
      status: item.status,
      category: item.category,
      firstFailingStep: item.firstFailingStep,
      divergence: item.divergence,
      agreed: item.agreed,
      source: item.source,
    })),
  };
  const html = renderHtmlReport({ summary, observations: { ...observations, steps: manualSteps } });
  const htmlPath = path.join(output, 'summary.html');
  const jsonPath = path.join(output, 'summary.json');
  await writeFile(htmlPath, html);
  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  return { summary, htmlPath, jsonPath, output };
}
