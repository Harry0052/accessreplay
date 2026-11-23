import { readFile } from 'node:fs/promises';
import { CATEGORIES, fail } from './errors.mjs';
import {
  APPROVED_ACTIONS,
  BUILD_ID_PATTERN,
  FOCUS_ID_PATTERN,
  ID_PATTERN,
  LIMIT_BOUNDS,
  LIVE_REGION_MAX,
  MAX_JOURNEY_BYTES,
  NAME_MAX,
  OBSERVATIONS,
  ROLE_PATTERN,
  SCHEMA_VERSION,
  STATE_PATTERN,
  TEXT_PATTERN,
} from './bounds.mjs';

const LIMIT_KEYS = Object.keys(LIMIT_BOUNDS);
const JOURNEY_KEYS = new Set([
  'schemaVersion',
  'fixtureLabel',
  'id',
  'title',
  'limits',
  'ready',
  'steps',
]);
const STEP_KEYS = new Set(['id', 'action', 'expect']);
const EXPECT_KEYS = new Set([
  'role',
  'name',
  'focusId',
  'liveRegion',
  'appState',
  'observation',
]);
const ACTION_KEYS = {
  tab: new Set(['type', 'untilFocusId', 'maxTabs']),
  shiftTab: new Set(['type']),
  enter: new Set(['type']),
  escape: new Set(['type']),
  type: new Set(['type', 'text']),
};

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function rejectExtra(value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      fail(
        CATEGORIES.invalid_fixture,
        `${path} has unsupported property "${key}". Remove it and validate again.`,
      );
    }
  }
}

function requireString(value, path, pattern, label) {
  if (typeof value !== 'string' || !pattern.test(value)) {
    fail(
      CATEGORIES.invalid_fixture,
      `${path} must be ${label}.`,
    );
  }
  return value;
}

function boundedInteger(value, path, [min, max], unit) {
  if (!Number.isInteger(value) || value < min || value > max) {
    fail(
      CATEGORIES.invalid_fixture,
      `${path} must be an integer from ${min} to ${max} ${unit}.`,
    );
  }
  return value;
}

function findExternal(value, path) {
  if (typeof value === 'string' && /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    fail(
      CATEGORIES.external_navigation,
      `${path} requests "${value}", which is outside the local fixture. The journey was not started.`,
    );
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => findExternal(item, `${path}[${index}]`));
    return;
  }
  if (isObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      findExternal(item, `${path}.${key}`);
    }
  }
}

export function parseJourney(text, source = 'journey') {
  if (typeof text !== 'string') {
    fail(CATEGORIES.invalid_fixture, `${source} must be UTF-8 JSON text.`);
  }
  const bytes = Buffer.byteLength(text);
  if (bytes > MAX_JOURNEY_BYTES) {
    fail(
      CATEGORIES.invalid_fixture,
      `${source} is ${bytes} bytes. The maximum journey size is ${MAX_JOURNEY_BYTES} bytes.`,
    );
  }
  if (text.charCodeAt(0) === 0xfeff) {
    fail(CATEGORIES.invalid_fixture, `${source} must not start with a byte-order mark.`);
  }

  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(
      CATEGORIES.invalid_fixture,
      `${source} is not valid JSON (${error.message}).`,
    );
  }
  findExternal(raw, source);
  if (!isObject(raw)) {
    fail(CATEGORIES.invalid_fixture, `${source} must be a JSON object.`);
  }
  rejectExtra(raw, JOURNEY_KEYS, source);
  if (raw.schemaVersion !== SCHEMA_VERSION) {
    fail(
      CATEGORIES.invalid_fixture,
      `${source} schemaVersion must be "${SCHEMA_VERSION}".`,
    );
  }
  requireString(raw.fixtureLabel, `${source}.fixtureLabel`, ID_PATTERN, 'a lowercase id');
  requireString(raw.id, `${source}.id`, ID_PATTERN, 'a lowercase id');
  if (typeof raw.title !== 'string' || raw.title.trim() === '' || raw.title.length > 140) {
    fail(CATEGORIES.invalid_fixture, `${source}.title must be 1 to 140 characters.`);
  }
  if (!isObject(raw.limits)) {
    fail(CATEGORIES.invalid_fixture, `${source}.limits must be an object.`);
  }
  rejectExtra(raw.limits, new Set(LIMIT_KEYS), `${source}.limits`);
  const limits = {};
  for (const key of LIMIT_KEYS) {
    const unit = key.endsWith('Ms')
      ? 'milliseconds'
      : key === 'maxInputChars'
        ? 'characters'
        : key.toLowerCase().includes('tab')
          ? 'tabs'
          : 'steps';
    limits[key] = boundedInteger(raw.limits[key], `${source}.limits.${key}`, LIMIT_BOUNDS[key], unit);
  }
  if (!isObject(raw.ready)) {
    fail(CATEGORIES.invalid_fixture, `${source}.ready must be an object.`);
  }
  rejectExtra(raw.ready, new Set(['attribute', 'equals']), `${source}.ready`);
  if (raw.ready.attribute !== 'data-app-ready') {
    fail(
      CATEGORIES.invalid_fixture,
      `${source}.ready.attribute must be "data-app-ready".`,
    );
  }
  if (raw.ready.equals !== 'true') {
    fail(CATEGORIES.invalid_fixture, `${source}.ready.equals must be "true".`);
  }
  if (!Array.isArray(raw.steps) || raw.steps.length < 1 || raw.steps.length > limits.maxSteps) {
    fail(
      CATEGORIES.invalid_fixture,
      `${source}.steps must contain 1 to ${limits.maxSteps} steps.`,
    );
  }

  const seen = new Set();
  const steps = raw.steps.map((step, index) => parseStep(step, index, limits, source, seen));
  return {
    schemaVersion: SCHEMA_VERSION,
    fixtureLabel: raw.fixtureLabel,
    id: raw.id,
    title: raw.title,
    limits,
    ready: { attribute: 'data-app-ready', equals: 'true' },
    steps,
  };
}

function parseStep(step, index, limits, source, seen) {
  const path = `${source}.steps[${index}]`;
  if (!isObject(step)) {
    fail(CATEGORIES.invalid_fixture, `${path} must be an object.`);
  }
  rejectExtra(step, STEP_KEYS, path);
  const id = requireString(step.id, `${path}.id`, ID_PATTERN, 'a lowercase id');
  if (seen.has(id)) {
    fail(CATEGORIES.invalid_fixture, `${path}.id "${id}" is duplicated.`);
  }
  seen.add(id);
  const action = parseAction(step.action, id, limits, path);
  const expect = parseExpect(step.expect, path);
  return { id, action, expect };
}

function parseAction(action, stepId, limits, path) {
  const actionPath = `${path}.action`;
  if (!isObject(action) || typeof action.type !== 'string') {
    fail(CATEGORIES.invalid_fixture, `${actionPath}.type must be a string.`);
  }
  if (!APPROVED_ACTIONS.includes(action.type)) {
    fail(
      CATEGORIES.unapproved_action,
      `Step ${stepId} uses action "${action.type}", which is not approved. Approved actions are tab, shiftTab, enter, escape, and type. The journey was not started.`,
      { stepId, action: action.type },
    );
  }
  rejectExtra(action, ACTION_KEYS[action.type], actionPath);
  if (action.type === 'type') {
    if (typeof action.text !== 'string' || !TEXT_PATTERN.test(action.text)) {
      fail(
        CATEGORIES.invalid_fixture,
        `Step ${stepId} type text must be letters, digits, spaces, or periods, with no control characters.`,
      );
    }
    if (action.text.length > limits.maxInputChars) {
      fail(
        CATEGORIES.invalid_fixture,
        `Step ${stepId} types ${action.text.length} characters. The journey limit is ${limits.maxInputChars} characters.`,
      );
    }
    return { type: 'type', text: action.text };
  }
  if (action.type === 'tab') {
    const tab = { type: 'tab' };
    if (action.untilFocusId !== undefined) {
      tab.untilFocusId = requireString(
        action.untilFocusId,
        `${actionPath}.untilFocusId`,
        FOCUS_ID_PATTERN,
        'an element id or "body"',
      );
    }
    if (action.maxTabs !== undefined) {
      tab.maxTabs = boundedInteger(
        action.maxTabs,
        `${actionPath}.maxTabs`,
        [1, limits.maxTabsToTarget],
        'tabs',
      );
    }
    if ((action.untilFocusId === undefined) !== (action.maxTabs === undefined)) {
      fail(
        CATEGORIES.invalid_fixture,
        `Step ${stepId} tab must set untilFocusId and maxTabs together, or neither.`,
      );
    }
    return tab;
  }
  return { type: action.type };
}

function parseExpect(expect, path) {
  const expectPath = `${path}.expect`;
  if (!isObject(expect)) {
    fail(CATEGORIES.invalid_fixture, `${expectPath} must be an object.`);
  }
  rejectExtra(expect, EXPECT_KEYS, expectPath);
  const role = requireString(expect.role, `${expectPath}.role`, ROLE_PATTERN, 'a lowercase ARIA role');
  if (typeof expect.name !== 'string' || expect.name.length > NAME_MAX) {
    fail(CATEGORIES.invalid_fixture, `${expectPath}.name must be a string of at most ${NAME_MAX} characters.`);
  }
  const focusId = requireString(
    expect.focusId,
    `${expectPath}.focusId`,
    FOCUS_ID_PATTERN,
    'an element id or "body"',
  );
  if (typeof expect.liveRegion !== 'string' || expect.liveRegion.length > LIVE_REGION_MAX) {
    fail(
      CATEGORIES.invalid_fixture,
      `${expectPath}.liveRegion must be a string of at most ${LIVE_REGION_MAX} characters.`,
    );
  }
  const appState = requireString(
    expect.appState,
    `${expectPath}.appState`,
    STATE_PATTERN,
    'a lowercase state id',
  );
  const observation = expect.observation === undefined
    ? 'browser-semantics'
    : expect.observation;
  if (!OBSERVATIONS.includes(observation)) {
    fail(
      CATEGORIES.invalid_fixture,
      `${expectPath}.observation must be "browser-semantics" or "screen-reader-announcement".`,
    );
  }
  return {
    role,
    name: expect.name,
    focusId,
    liveRegion: expect.liveRegion,
    appState,
    observation,
  };
}

export function assertBuildId(buildId) {
  if (typeof buildId !== 'string' || !BUILD_ID_PATTERN.test(buildId) || buildId.includes('..')) {
    fail(
      CATEGORIES.invalid_fixture,
      `Build id "${buildId}" is not a lowercase fixture name.`,
    );
  }
  return buildId;
}

export async function loadJourney(filePath) {
  let text;
  try {
    text = await readFile(filePath, 'utf8');
  } catch (error) {
    fail(
      CATEGORIES.invalid_fixture,
      `Could not read ${filePath} (${error.code || error.message}).`,
    );
  }
  return parseJourney(text, filePath);
}
