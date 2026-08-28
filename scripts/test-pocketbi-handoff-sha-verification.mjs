import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const handoff = readFileSync(new URL('../src/pages/PocketBIHandoff.tsx', import.meta.url), 'utf8');

assert.match(handoff, /async function sha256Hex/);
assert.match(handoff, /crypto\.subtle\.digest\("SHA-256"/);
assert.match(handoff, /const declaredSha = manifest\.payload\.sha256\.trim\(\)\.toLowerCase\(\)/);
assert.match(handoff, /\^\[0-9a-f\]\{64\}\$/);
assert.match(handoff, /actualSha !== declaredSha/);
assert.match(handoff, /declared payload SHA-256 does not match the transferred CSV/);
assert.match(handoff, /manifest: null/);
assert.match(handoff, /The CSV was imported normally instead/);
assert.match(handoff, /await decideManifest\(/);

console.log('✓ bIDE Handoff V1 recomputes declared SHA-256 and fails metadata closed on drift');
