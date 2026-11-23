import { randomUUID } from 'node:crypto';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';
import { CATEGORIES } from './errors.mjs';
import { readSemantics } from './observe.mjs';
import { buildReport } from './report.mjs';
import { assertBuildId } from './parse.mjs';
import { startShopServer } from './serve.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const shopRoot = path.resolve(here, '../fixtures/shop');

const COMPARE_FIELDS = ['focusId', 'role', 'name', 'liveRegion', 'appState'];

function sameOrigin(target, origin) {
  return target.origin === origin || target.protocol === 'data:' || target.protocol === 'blob:';
}

async function scanAxe(page) {
  try {
    const result = await new AxeBuilder({ page }).analyze();
    return {
      ruleIds: [...new Set(result.violations.map((item) => item.id))].sort(),
    };
  } catch (error) {
    return { ruleIds: [], unavailable: error.message };
  }
}

async function press(page, action) {
  if (action.type === 'tab') await page.keyboard.press('Tab');
  else if (action.type === 'shiftTab') await page.keyboard.press('Shift+Tab');
  else if (action.type === 'enter') await page.keyboard.press('Enter');
  else if (action.type === 'escape') await page.keyboard.press('Escape');
  else if (action.type === 'type') await page.keyboard.type(action.text);
}

function checkpoint(step, observed, result, category, detail, axe) {
  return {
    stepId: step.id,
    action: step.action.type,
    expected: {
      role: step.expect.role,
      name: step.expect.name,
      focusId: step.expect.focusId,
      liveRegion: step.expect.liveRegion,
      appState: step.expect.appState,
    },
    observed,
    result,
    category,
    detail,
    axe,
  };
}

function mismatch(expected, observed) {
  for (const field of COMPARE_FIELDS) {
    if (expected[field] !== observed[field]) {
      return { field, expected: expected[field], observed: observed[field] };
    }
  }
  return null;
}

function regressionMessage(step, detail) {
  if (detail.field === 'name') {
    return `Step ${step.id} expected accessible name "${detail.expected}" on #${step.expect.focusId} and observed "${detail.observed}". The selector still matches. This is an evaluated regression.`;
  }
  if (detail.field === 'focusId') {
    return `Step ${step.id} expected focus #${detail.expected} "${step.expect.name}" and observed focus #${detail.observed}. This is an evaluated regression.`;
  }
  return `Step ${step.id} expected ${detail.field} "${detail.expected}" and observed "${detail.observed}". This is an evaluated regression.`;
}

export async function runJourney({ journey, buildId, root = shopRoot, withAxe = true }) {
  const safeBuild = assertBuildId(buildId);
  const indexPath = path.join(root, safeBuild, 'index.html');
  try {
    await access(indexPath);
  } catch {
    const report = buildReport({
      journey,
      buildId: safeBuild,
      runId: randomUUID(),
      status: 'rejected',
      category: CATEGORIES.invalid_fixture,
      message: `Build "${safeBuild}" has no index.html in the fixture shop.`,
    });
    return report;
  }

  const server = await startShopServer(root);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  let blockedOrigin = null;
  try {
    const context = await browser.newContext({
      locale: 'en-US',
      viewport: { width: 1280, height: 720 },
    });
    await context.route('**/*', async (route) => {
      let target;
      try {
        target = new URL(route.request().url());
      } catch {
        blockedOrigin = 'unreadable-url';
        await route.abort('blockedbyclient');
        return;
      }
      if (!sameOrigin(target, server.origin)) {
        blockedOrigin = target.origin;
        await route.abort('blockedbyclient');
        return;
      }
      await route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(journey.limits.stepTimeoutMs);
    const url = `${server.origin}/${safeBuild}/`;
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: journey.limits.readyTimeoutMs,
      });
    } catch (error) {
      if (blockedOrigin) {
        return buildReport({
          journey,
          buildId: safeBuild,
          runId: randomUUID(),
          status: 'rejected',
          category: CATEGORIES.wrong_origin,
          message: `The fixture navigated toward ${blockedOrigin} before the journey could finish. The run was rejected and was not scored as a regression.`,
        });
      }
      return buildReport({
        journey,
        buildId: safeBuild,
        runId: randomUUID(),
        status: 'timeout',
        category: CATEGORIES.application_timeout,
        message: `The fixture did not load within ${journey.limits.readyTimeoutMs} milliseconds (${error.message}). This is an application timeout, not an evaluated regression.`,
      });
    }

    if (blockedOrigin || new URL(page.url()).origin !== server.origin) {
      return buildReport({
        journey,
        buildId: safeBuild,
        runId: randomUUID(),
        status: 'rejected',
        category: CATEGORIES.wrong_origin,
        message: `The fixture navigated toward ${blockedOrigin || page.url()} before the journey could finish. The run was rejected and was not scored as a regression.`,
      });
    }

    try {
      await page.waitForFunction(
        () => document.documentElement.dataset.appReady === 'true',
        null,
        { timeout: journey.limits.readyTimeoutMs },
      );
    } catch {
      return buildReport({
        journey,
        buildId: safeBuild,
        runId: randomUUID(),
        status: 'timeout',
        category: CATEGORIES.application_timeout,
        message: `The fixture did not set data-app-ready="true" within ${journey.limits.readyTimeoutMs} milliseconds. This is an application timeout, not an evaluated regression.`,
      });
    }

    if (blockedOrigin) {
      return buildReport({
        journey,
        buildId: safeBuild,
        runId: randomUUID(),
        status: 'rejected',
        category: CATEGORIES.wrong_origin,
        message: `The fixture requested ${blockedOrigin} before the journey could finish. The run was rejected and was not scored as a regression.`,
      });
    }

    const checkpoints = [];
    for (const step of journey.steps) {
      let observed;
      let limited = false;
      try {
        if (step.action.type === 'tab' && step.action.untilFocusId) {
          let presses = 0;
          observed = await readSemantics(page);
          while (presses < step.action.maxTabs && observed.focusId !== step.action.untilFocusId) {
            await page.keyboard.press('Tab');
            presses += 1;
            observed = await readSemantics(page);
          }
          limited = observed.focusId !== step.action.untilFocusId;
        } else {
          await press(page, step.action);
          observed = await readSemantics(page);
        }
      } catch (error) {
        const timedOut = error.name === 'TimeoutError';
        return buildReport({
          journey,
          buildId: safeBuild,
          runId: randomUUID(),
          status: timedOut ? 'timeout' : 'rejected',
          category: timedOut ? CATEGORIES.application_timeout : CATEGORIES.wrong_origin,
          firstFailingStep: step.id,
          message: timedOut
            ? `Step ${step.id} exceeded ${journey.limits.stepTimeoutMs} milliseconds. This is an application timeout, not an evaluated regression.`
            : `Step ${step.id} stopped because the browser left the fixture (${error.message}).`,
          checkpoints,
        });
      }

      if (blockedOrigin || new URL(page.url()).origin !== server.origin) {
        return buildReport({
          journey,
          buildId: safeBuild,
          runId: randomUUID(),
          status: 'rejected',
          category: CATEGORIES.wrong_origin,
          firstFailingStep: step.id,
          message: `Step ${step.id} requested ${blockedOrigin || page.url()}, outside the fixture origin. The journey was not completed.`,
          checkpoints,
        });
      }

      const axe = withAxe ? await scanAxe(page) : { ruleIds: [] };
      if (step.expect.observation === 'screen-reader-announcement') {
        checkpoints.push(checkpoint(
          step,
          observed,
          'unsupported',
          CATEGORIES.unsupported_observation,
          null,
          axe,
        ));
        return buildReport({
          journey,
          buildId: safeBuild,
          runId: randomUUID(),
          status: 'unsupported',
          category: CATEGORIES.unsupported_observation,
          firstFailingStep: step.id,
          message: `Step ${step.id} asks for a screen-reader announcement. Browser role "${observed.role}" and name "${observed.name}" were recorded and were not scored as a regression. Confirm speech on the manual run sheet.`,
          checkpoints,
        });
      }
      if (limited) {
        checkpoints.push(checkpoint(step, observed, 'fail', CATEGORIES.tab_limit, null, axe));
        return buildReport({
          journey,
          buildId: safeBuild,
          runId: randomUUID(),
          status: 'fail',
          category: CATEGORIES.tab_limit,
          firstFailingStep: step.id,
          message: `Step ${step.id} did not focus #${step.action.untilFocusId} within ${step.action.maxTabs} tabs. Last focus was #${observed.focusId} "${observed.name}". The journey stopped at the declared tab limit.`,
          checkpoints,
        });
      }
      const detail = mismatch(step.expect, observed);
      if (detail) {
        checkpoints.push(checkpoint(
          step,
          observed,
          'fail',
          CATEGORIES.evaluated_regression,
          detail,
          axe,
        ));
        return buildReport({
          journey,
          buildId: safeBuild,
          runId: randomUUID(),
          status: 'fail',
          category: CATEGORIES.evaluated_regression,
          firstFailingStep: step.id,
          message: regressionMessage(step, detail),
          checkpoints,
        });
      }
      checkpoints.push(checkpoint(step, observed, 'pass', null, null, axe));
    }

    return buildReport({
      journey,
      buildId: safeBuild,
      runId: randomUUID(),
      status: 'pass',
      message: `All ${checkpoints.length} checkpoints passed.`,
      checkpoints,
    });
  } finally {
    await browser.close();
    await server.close();
  }
}
