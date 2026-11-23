#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { FixtureError } from './src/errors.mjs';
import { loadJourney } from './src/parse.mjs';
import { verifyManifest } from './src/manifest.mjs';

const HELP = `AccessReplay ${'0.1.0'}

Validate a local keyboard journey before a browser run.

Commands
  node cli.mjs validate <journey.json>   Accept a journey or print an actionable error
  node cli.mjs verify-manifest           Check fixture checksums and the MIT fixture terms
  node cli.mjs --help                    Show this help

Exit codes
  0   validation succeeded
  2   the fixture was rejected
  64  the command was not understood
`;

function send(ok, payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
  if (!ok) process.stderr.write(`${payload.message}\n`);
}

async function main(argv) {
  const [command, file] = argv;
  if (command === '--help' || command === '-h' || command === 'help') {
    process.stdout.write(HELP);
    return 0;
  }
  if (command === 'validate') {
    if (!file) {
      process.stderr.write('Usage: node cli.mjs validate <journey.json>\n');
      return 64;
    }
    const journey = await loadJourney(file);
    send(true, {
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
    send(true, { ok: true, ...result });
    return 0;
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
        send(false, { ok: false, category: error.category, message: error.message });
        process.exitCode = 2;
        return;
      }
      process.stderr.write(`${error.stack || error.message}\n`);
      process.exitCode = 1;
    });
}
