import assert from 'node:assert/strict';
import net from 'node:net';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { FixtureError } from '../src/errors.mjs';
import { assertBuildId } from '../src/parse.mjs';
import { writeReport } from '../src/report.mjs';
import { startShopServer } from '../src/serve.mjs';

const shop = path.resolve('fixtures/shop');

async function statusOf(origin, pathname) {
  const response = await fetch(origin + pathname);
  return response.status;
}

function rawStatus(origin, requestPath) {
  const url = new URL(origin);
  return new Promise((resolve, reject) => {
    const socket = net.connect(Number(url.port), url.hostname, () => {
      socket.write(`GET ${requestPath} HTTP/1.1\r\nHost: ${url.host}\r\nConnection: close\r\n\r\n`);
    });
    let data = '';
    socket.on('data', (chunk) => {
      data += chunk;
    });
    socket.on('end', () => {
      const status = Number(data.split(' ')[1]);
      resolve(status);
    });
    socket.on('error', reject);
  });
}

test('the fixture server rejects traversal and serves only shop files', async () => {
  const server = await startShopServer(shop);
  try {
    assert.equal(await statusOf(server.origin, '/control/'), 200);
    const escaped = await fetch(`${server.origin}/../package.json`);
    assert.notEqual(escaped.status, 200);
    assert.equal((await escaped.text()).includes('"name": "accessreplay"'), false);
    assert.equal(await rawStatus(server.origin, '/control/%2e%2e/%2e%2e/package.json'), 403);
    assert.equal(await statusOf(server.origin, '/control/missing.html'), 404);
  } finally {
    await server.close();
  }
});

test('report writes stay inside the output directory', async () => {
  assert.throws(() => assertBuildId('../secret'), FixtureError);
  const out = await mkdtemp(path.join(tmpdir(), 'accessreplay-out-'));
  const outside = path.join(tmpdir(), `accessreplay-outside-${Date.now()}.json`);
  await assert.rejects(
    () => writeReport(out, {
      buildId: '../secret',
      schemaVersion: '1.0.0',
    }),
    FixtureError,
  );
  const written = await writeReport(out, {
    schemaVersion: '1.0.0',
    journeyId: 'shop-checkout',
    buildId: 'control',
    runId: 'test',
    status: 'pass',
    category: null,
    firstFailingStep: null,
    message: '',
    checkpoints: [],
  });
  assert.equal(path.dirname(written), out);
  await writeFile(outside, 'leave-me');
  const leftover = await import('node:fs/promises').then((fs) => fs.readFile(outside, 'utf8'));
  assert.equal(leftover, 'leave-me');
});
