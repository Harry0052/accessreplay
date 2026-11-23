import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, fail } from './errors.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const fixtureRoot = path.join(root, 'fixtures');
export const manifestPath = path.join(fixtureRoot, 'manifest.json');

async function filesUnder(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await filesUnder(absolute, relative));
    } else if (entry.isFile() && entry.name !== 'manifest.json') {
      files.push(relative);
    }
  }
  return files;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export async function verifyManifest() {
  let raw;
  try {
    raw = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    fail(CATEGORIES.invalid_fixture, `Could not read the fixture manifest (${error.message}).`);
  }
  if (raw.schemaVersion !== '1.0.0' || raw.license !== 'MIT' || raw.generationSeed !== null) {
    fail(CATEGORIES.invalid_fixture, 'Fixture manifest identity fields do not match the contract.');
  }
  if (!Array.isArray(raw.files)) {
    fail(CATEGORIES.invalid_fixture, 'Fixture manifest is missing its file list.');
  }
  const listed = raw.files.map((item) => item.path);
  const found = (await filesUnder(fixtureRoot)).map((relative) => `fixtures/${relative}`);
  const listedSet = new Set(listed);
  const foundSet = new Set(found);
  const missing = listed.filter((item) => !foundSet.has(item));
  const extra = found.filter((item) => !listedSet.has(item));
  if (missing.length > 0 || extra.length > 0) {
    fail(
      CATEGORIES.invalid_fixture,
      `Fixture manifest does not match the tree. Missing: ${missing.join(', ') || 'none'}. Extra: ${extra.join(', ') || 'none'}.`,
    );
  }
  for (const item of raw.files) {
    const absolute = path.resolve(root, item.path);
    if (!absolute.startsWith(`${fixtureRoot}${path.sep}`)) {
      fail(CATEGORIES.invalid_fixture, `Manifest path escapes the fixture directory: ${item.path}`);
    }
    const buffer = await readFile(absolute);
    const digest = sha256(buffer);
    if (digest !== item.sha256 || buffer.length !== item.bytes) {
      fail(
        CATEGORIES.invalid_fixture,
        `${item.path} checksum or size does not match the manifest. Expected ${item.sha256} (${item.bytes} bytes), found ${digest} (${buffer.length} bytes).`,
      );
    }
  }
  return { files: raw.files.length, license: raw.license };
}
