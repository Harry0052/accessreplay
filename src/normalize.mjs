/**
 * The normalized trace is the acceptance comparison.
 * Run ids, timestamps, ports, durations, and supplemental axe ids are omitted.
 */
export function projectExpectations(journey) {
  return journey.steps.map((step) => ({
    stepId: step.id,
    action: step.action.type,
    role: step.expect.role,
    name: step.expect.name,
    focusId: step.expect.focusId,
    liveRegion: step.expect.liveRegion,
    appState: step.expect.appState,
    result: 'pass',
  }));
}

export function normalizeTrace(checkpoints) {
  return checkpoints.map((checkpoint) => ({
    stepId: checkpoint.stepId,
    action: checkpoint.action,
    role: checkpoint.observed.role,
    name: checkpoint.observed.name,
    focusId: checkpoint.observed.focusId,
    liveRegion: checkpoint.observed.liveRegion,
    appState: checkpoint.observed.appState,
    result: checkpoint.result,
  }));
}

export function tracesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
