export const SCHEMA_VERSION = '1.0.0';

/** Journey files larger than this are rejected before JSON.parse. */
export const MAX_JOURNEY_BYTES = 65_536;

export const LIMIT_BOUNDS = Object.freeze({
  maxSteps: Object.freeze([1, 40]),
  stepTimeoutMs: Object.freeze([100, 10_000]),
  readyTimeoutMs: Object.freeze([100, 10_000]),
  maxInputChars: Object.freeze([1, 80]),
  maxTabsToTarget: Object.freeze([1, 30]),
});

export const APPROVED_ACTIONS = Object.freeze([
  'tab',
  'shiftTab',
  'enter',
  'escape',
  'type',
]);

export const OBSERVATIONS = Object.freeze([
  'browser-semantics',
  'screen-reader-announcement',
]);

export const NAME_MAX = 120;
export const LIVE_REGION_MAX = 200;
export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const FOCUS_ID_PATTERN = /^(?:body|[A-Za-z][A-Za-z0-9_-]{0,63})$/;
export const ROLE_PATTERN = /^[a-z][a-z0-9]{0,29}$/;
export const STATE_PATTERN = /^[a-z0-9-]{1,32}$/;
export const TEXT_PATTERN = /^[A-Za-z0-9 .]+$/;
export const BUILD_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
