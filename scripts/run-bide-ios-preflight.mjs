import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const scripts = [
  'scripts/generate-bide-appicon.mjs',
  'scripts/validate-bide-ios-phase1.mjs',
  'scripts/validate-bide-ios-phase2.mjs',
  'scripts/validate-bide-ios-phase2-integrity.mjs',
  'scripts/validate-bide-ios-multisheet-fixture.mjs',
  'scripts/validate-bide-ios-hardware-regressions.mjs',
  'scripts/validate-bide-ios-testflight.mjs',
];

for (const script of scripts) {
  console.log(`\n[bIDE RC2 source gate] ${script}`);
  execFileSync(process.execPath, [script], { stdio: 'inherit' });
}

const workflow = fs.readFileSync('.github/workflows/bide-ios-quality.yml', 'utf8');
assert.match(workflow, /workflow_dispatch:/, 'Paid macOS lane must keep workflow_dispatch.');
for (const forbidden of ['pull_request:', 'push:', 'schedule:']) {
  assert.ok(!workflow.includes(forbidden), `Paid macOS lane must not contain ${forbidden}`);
}
assert.ok(workflow.includes('runs-on: macos-15'), 'Paid lane must remain the explicit macOS/Xcode checkpoint.');
console.log('\nPaid bIDE macOS lane is manual-only.');
console.log('bIDE RC2 deterministic Source Preflight equivalent passed.');
