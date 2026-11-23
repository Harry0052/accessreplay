#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { FixtureError } from './src/errors.mjs';
import { loadJourney } from './src/parse.mjs';
import { verifyManifest } from './src/manifest.mjs';
import { exitCode, writeReport } from './src/report.mjs';
import { runDemo } from './src/demo.mjs';
import { runJourney } from './src/run.mjs';

const HELP = `AccessReplay 0.1.0

Replay a declared keyboard journey against one local fixture build.

Commands
  node cli.mjs demo [--out <dir>]
  node cli.mjs validate <journey.json>
  node cli.mjs run --journey <journey.json> --build <id> --out <dir>
  node cli.mjs verify-manifest
  node cli.mjs --help

Exit codes
  0   pass, or the journey file is valid
  1   evaluated regression or tab limit
  2   rejected fixture, action, or origin
  3   application timeout
  4   unsupported observation
  64  the command was not understood

Machine-readable JSON is written to stdout. Explanations are written to stderr.
`;

function send(payload, explain) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
  if (explain) process.stderr.write(`${explain}\n`);
}

function option(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] ?? null;
}

async function main(argv) {
  const [command] = argv;
  if (command === '--help' || command === '-h' || command === 'help') {
    process.stdout.write(HELP);
    return 0;
  }
  if (command === 'validate') {
    const file = argv[1];
    if (!file) {
      process.stderr.write('Usage: node cli.mjs validate <journey.json>\n');
      return 64;
    }
    const journey = await loadJourney(file);
    send({
      ok: true,
      journeyId: journey.id,
      fixtureLabel: journey.fixtureLabel,
      steps: journey.steps.length,
      schemaVersion: journey.schemaVersion,
    });
    return 0;
  }
  if (command === 'verify-manifest') {
    const result = await verifyManifest();
    send({ ok: true, ...result });
    return 0;
  }
  if (command === 'demo') {
    const out = option(argv.slice(1), '--out');
    const result = await runDemo({ outDir: out || undefined });
    const lines = [
      result.summary.verdict,
      '',
      'Keyboard sequence',
      ...result.summary.keyboard.map((step, index) => `${index + 1}. ${step.stepId}: ${step.keys}`),
      '',
      ...result.summary.runs.map((item) => {
        const where = item.firstFailingStep ? ` at ${item.firstFailingStep}` : '';
        return `${item.buildId}: ${item.status}${where}${item.divergence ? ` — ${item.divergence}` : ''}`;
      }),
      '',
      `Manual screen-reader sheet: ${result.summary.manual.state}`,
      `HTML report: ${result.htmlPath}`,
      `JSON summary: ${result.jsonPath}`,
    ];
    send(result.summary, lines.join('\n'));
    return result.summary.ok ? 0 : 1;
  }
  if (command === 'run') {
    const journeyPath = option(argv.slice(1), '--journey');
    const build = option(argv.slice(1), '--build');
    const out = option(argv.slice(1), '--out');
    if (!journeyPath || !build || !out) {
      process.stderr.write('Usage: node cli.mjs run --journey <journey.json> --build <id> --out <dir>\n');
      return 64;
    }
    const journey = await loadJourney(journeyPath);
    const report = await runJourney({ journey, buildId: build });
    const written = await writeReport(out, report);
    send(
      {
        ok: report.status === 'pass',
        status: report.status,
        category: report.category,
        firstFailingStep: report.firstFailingStep,
        report: written,
      },
      report.message,
    );
    return exitCode(report);
  }
  process.stderr.write(HELP);
  return 64;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      if (error instanceof FixtureError) {
        send({ ok: false, category: error.category, message: error.message }, error.message);
        process.exitCode = 2;
        return;
      }
      process.stderr.write(`${error.stack || error.message}\n`);
      process.exitCode = 1;
    });
}
