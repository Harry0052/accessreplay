import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BUILD_ID_PATTERN } from './bounds.mjs';
import { CATEGORIES, fail } from './errors.mjs';
import { normalizeTrace } from './normalize.mjs';

export function exitCode(report) {
  if (report.status === 'pass') return 0;
  if (report.category === CATEGORIES.application_timeout) return 3;
  if (report.category === CATEGORIES.unsupported_observation) return 4;
  if (report.category === CATEGORIES.evaluated_regression || report.category === CATEGORIES.tab_limit) {
    return 1;
  }
  return 2;
}

export function buildReport({
  journey,
  buildId,
  runId,
  status,
  category = null,
  firstFailingStep = null,
  message = '',
  checkpoints = [],
}) {
  return {
    schemaVersion: '1.0.0',
    journeyId: journey.id,
    buildId,
    runId,
    status,
    category,
    firstFailingStep,
    message,
    checkpoints,
    normalizedTrace: normalizeTrace(checkpoints),
  };
}

export async function writeReport(outDir, report) {
  if (!BUILD_ID_PATTERN.test(report.buildId)) {
    fail(CATEGORIES.invalid_fixture, `Refusing to write a report for build "${report.buildId}".`);
  }
  const root = path.resolve(outDir);
  await mkdir(root, { recursive: true });
  const target = path.join(root, `${report.buildId}.json`);
  if (path.dirname(target) !== root) {
    fail(CATEGORIES.invalid_fixture, 'The report path escaped the output directory.');
  }
  await writeFile(target, `${JSON.stringify(report, null, 2)}\n`);
  return target;
}
