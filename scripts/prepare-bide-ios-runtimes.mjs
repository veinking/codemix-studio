import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outputRoot = path.join(repoRoot, 'ios', 'BideApp', 'RuntimeAssets');
const hostTemplate = path.join(repoRoot, 'ios', 'RuntimeSupport', 'runtime-host.html');
const manifestPath = path.join(outputRoot, 'runtime-manifest.json');

const runtimes = {
  pyodide: {
    version: '314.0.6',
    url: 'https://github.com/pyodide/pyodide/releases/download/314.0.6/pyodide-core-314.0.6.tar.bz2',
    sha256: '1016c31e39ce3764d9a418cbb491a392c802c1b86ccc1367f009f5c59bf8f5fd',
    archive: 'pyodide-core-314.0.6.tar.bz2',
    marker: 'pyodide.mjs',
  },
  webr: {
    version: '0.6.0',
    url: 'https://github.com/r-wasm/webr/releases/download/v0.6.0/webr-0.6.0.zip',
    sha256: 'd476e1d6e23cd6572450e2cf3b5faf93d8bd0c0284f4f8bb7b7f8aa4cd01aaf1',
    archive: 'webr-0.6.0.zip',
    marker: 'webr.mjs',
  },
};

const expectedManifest = {
  schema: 1,
  python: { engine: 'Pyodide', version: runtimes.pyodide.version, sha256: runtimes.pyodide.sha256 },
  r: { engine: 'webR', version: runtimes.webr.version, sha256: runtimes.webr.sha256 },
};

function existingBundleIsValid() {
  try {
    const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return JSON.stringify(existing) === JSON.stringify(expectedManifest)
      && fs.existsSync(path.join(outputRoot, 'runtime-host.html'))
      && fs.existsSync(path.join(outputRoot, 'pyodide', runtimes.pyodide.marker))
      && fs.existsSync(path.join(outputRoot, 'webr', runtimes.webr.marker));
  } catch {
    return false;
  }
}

async function download(url, destination) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status}) for ${url}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destination, bytes);
}

function sha256(file) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(file));
  return hash.digest('hex');
}

function findMarker(root, marker) {
  const pending = [root];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(full);
      if (entry.isFile() && entry.name === marker) return full;
    }
  }
  throw new Error(`Could not find ${marker} after extraction.`);
}

function copyRuntimeTree(extractedRoot, marker, destination) {
  const markerPath = findMarker(extractedRoot, marker);
  const runtimeRoot = path.dirname(markerPath);
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(runtimeRoot, destination, { recursive: true });
}

if (existingBundleIsValid()) {
  console.log(`bIDE iOS runtimes already prepared: Python ${runtimes.pyodide.version}, R ${runtimes.webr.version}`);
  process.exit(0);
}

assert.ok(fs.existsSync(hostTemplate), 'Missing ios/RuntimeSupport/runtime-host.html');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bide-ios-runtimes-'));

try {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });

  for (const [name, runtime] of Object.entries(runtimes)) {
    const archivePath = path.join(tempRoot, runtime.archive);
    const extractRoot = path.join(tempRoot, `${name}-extract`);
    fs.mkdirSync(extractRoot, { recursive: true });

    console.log(`Downloading ${name} ${runtime.version}...`);
    await download(runtime.url, archivePath);
    const digest = sha256(archivePath);
    assert.equal(digest, runtime.sha256, `${name} SHA-256 mismatch`);

    if (runtime.archive.endsWith('.zip')) {
      execFileSync('unzip', ['-q', archivePath, '-d', extractRoot], { stdio: 'inherit' });
    } else {
      execFileSync('tar', ['-xjf', archivePath, '-C', extractRoot], { stdio: 'inherit' });
    }

    copyRuntimeTree(extractRoot, runtime.marker, path.join(outputRoot, name));
  }

  fs.copyFileSync(hostTemplate, path.join(outputRoot, 'runtime-host.html'));
  fs.writeFileSync(manifestPath, `${JSON.stringify(expectedManifest, null, 2)}\n`);

  assert.ok(existingBundleIsValid(), 'Prepared runtime bundle failed self-check.');
  console.log(`Prepared bIDE iOS runtimes in ${path.relative(repoRoot, outputRoot)}`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
