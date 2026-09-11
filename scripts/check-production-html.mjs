import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const built = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

assert.doesNotMatch(
  source,
  /<link[^>]+rel=["']modulepreload["'][^>]+href=["']\/src\//i,
  'Source index.html must not manually modulepreload /src files; Vite owns production module preloads.',
);

assert.doesNotMatch(
  built,
  /modulepreload[^>]+application\/octet-stream|application\/octet-stream[^>]+modulepreload/i,
  'Built production HTML must not emit application/octet-stream module preloads.',
);

assert.doesNotMatch(
  built,
  /<link[^>]+rel=["']modulepreload["'][^>]+href=["']\/src\//i,
  'Built production HTML must not reference source module paths.',
);

console.log('Production HTML preload regression passed.');
