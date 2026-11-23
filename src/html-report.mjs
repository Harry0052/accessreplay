function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function row(cells, tag = 'td') {
  return `<tr>${cells.map((cell) => `<${tag}>${escapeHtml(cell)}</${tag}>`).join('')}</tr>`;
}

export function renderHtmlReport({ summary, observations }) {
  const manualRows = observations.steps.map((step) => row([
    step.stepId,
    step.keys,
    step.expectedAnnouncement,
    step.state,
    step.observedAnnouncement || '',
  ]));
  const findingRows = summary.runs.flatMap((run) => {
    if (!run.firstFailingStep && run.status === 'pass') {
      return [row([run.buildId, 'pass', '', '', run.source])];
    }
    return [row([
      run.buildId,
      run.category || run.status,
      run.firstFailingStep || '',
      run.divergence || run.message,
      run.source,
    ])];
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AccessReplay demo</title>
  <style>
    body { font-family: sans-serif; margin: 1.5rem; color: #111; background: #fff; line-height: 1.4; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0 2rem; }
    th, td { border: 1px solid #222; padding: 0.4rem 0.5rem; text-align: left; vertical-align: top; }
    th { background: #f3f3f3; }
    code { font-family: ui-monospace, monospace; }
  </style>
</head>
<body>
  <h1>AccessReplay demo</h1>
  <p>${escapeHtml(summary.verdict)}</p>
  <h2>Provenance and limits</h2>
  <ul>
    <li>Schema ${escapeHtml(summary.schemaVersion)}. Time limits are milliseconds. Text limits are JavaScript string length.</li>
    <li>Fixture license: MIT. No remote page is loaded. Typed text is the synthetic journey value, not a captured key log.</li>
    <li>Browser role, name, focus, and status text are not screen-reader speech and are not a conformance result.</li>
    <li>axe-core rule ids are supplemental. They do not change the journey verdict.</li>
    <li>Manual rows stay unreviewed until a person records the screen reader, operating system, and version.</li>
  </ul>
  <h2>Keyboard sequence</h2>
  <ol>
    ${summary.keyboard.map((step) => `<li><code>${escapeHtml(step.stepId)}</code> ${escapeHtml(step.keys)}</li>`).join('\n    ')}
  </ol>
  <h2>Findings</h2>
  <table>
    <caption>First checkpoint that diverged, with the fixture a reviewer can open.</caption>
    <thead><tr><th>Build</th><th>Category</th><th>Step</th><th>Expected and observed</th><th>Source</th></tr></thead>
    <tbody>
      ${findingRows.join('\n      ')}
    </tbody>
  </table>
  <h2>Manual assistive-technology sheet</h2>
  <p>Screen reader: ${escapeHtml(observations.screenReader || '(not recorded)')}. Operating system: ${escapeHtml(observations.operatingSystem || '(not recorded)')}. Version: ${escapeHtml(observations.version || '(not recorded)')}.</p>
  <table>
    <caption>Announcements to verify by hand. State stays unreviewed until an observation is entered.</caption>
    <thead><tr><th>Step</th><th>Keys</th><th>Observation to verify</th><th>State</th><th>Recorded announcement</th></tr></thead>
    <tbody>
      ${manualRows.join('\n      ')}
    </tbody>
  </table>
</body>
</html>
`;
}
