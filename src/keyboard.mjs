export function describeAction(action) {
  if (action.type === 'tab' && action.untilFocusId) {
    return `Tab until #${action.untilFocusId} (at most ${action.maxTabs} tabs)`;
  }
  if (action.type === 'tab') return 'Tab';
  if (action.type === 'shiftTab') return 'Shift+Tab';
  if (action.type === 'enter') return 'Enter';
  if (action.type === 'escape') return 'Escape';
  if (action.type === 'type') return `Type "${action.text}"`;
  return action.type;
}

export function keyboardSequence(journey) {
  return journey.steps.map((step) => ({
    stepId: step.id,
    keys: describeAction(step.action),
  }));
}
