export const CATEGORIES = Object.freeze({
  invalid_fixture: 'invalid_fixture',
  unapproved_action: 'unapproved_action',
  external_navigation: 'external_navigation',
  wrong_origin: 'wrong_origin',
  application_timeout: 'application_timeout',
  unsupported_observation: 'unsupported_observation',
  evaluated_regression: 'evaluated_regression',
  tab_limit: 'tab_limit',
});

export class FixtureError extends Error {
  constructor(category, message, details = {}) {
    super(message);
    this.name = 'FixtureError';
    this.category = category;
    this.details = details;
  }
}

export function fail(category, message, details) {
  throw new FixtureError(category, message, details);
}
