import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const app = read('src/App.tsx');
const handoff = read('src/pages/PocketBIHandoff.tsx');
const handoffContract = read('src/lib/pocketBIHandoffV1.ts');
const outbound = read('src/lib/pocketBIOutboundHandoff.ts');
const datasetViewer = read('src/components/DatasetViewer.tsx');
const account = read('src/pages/Account.tsx');
const mobile = read('src/pages/use-cases/MobileCoding.tsx');
const docs = read('src/pages/docs/DocsIndex.tsx');
const ide = read('src/pages/IDE.tsx');
const features = read('src/pages/Features.tsx');
const focusedSeo = read('src/utils/focusedSeo.ts');
const sitemap = read('public/sitemap.xml');
const support = read('src/pages/Support.tsx');

// PocketBI browser-to-browser handoff must trust both the origin and the exact opener.
assert.match(handoff, /event\.source !== window\.opener/, 'PocketBI dataset handoff must reject messages from non-opener windows');
assert.match(handoff, /ALLOWED_ORIGINS\.has\(event\.origin\)/, 'PocketBI handoff must enforce the explicit origin allowlist');
assert.doesNotMatch(handoff, /postMessage\([^\n]*["']\*["']\)/, 'PocketBI handoff must never post to a wildcard target origin');
assert.match(handoff, /for \(const origin of ALLOWED_ORIGINS\)/, 'Ready handshakes must target only approved PocketBI origins');

// Shared Handoff V1 must validate independently and keep ordinary CSV as fallback.
assert.match(handoffContract, /POCKETBI_HANDOFF_FORMAT = "pocketbi-handoff"/);
assert.match(handoffContract, /POCKETBI_HANDOFF_VERSION = 1/);
assert.match(handoffContract, /pocketBISchemaFingerprint/);
assert.match(handoffContract, /dataset\.columnCount must match dataset\.schema\.columns length/);
assert.match(handoff, /handoffFormats: \["pocketbi-handoff@1"\]/);
assert.match(handoff, /validatePocketBIHandoffV1/);
assert.match(handoff, /declared row count/);
assert.match(handoff, /declared column count/);
assert.match(handoff, /declared schema columns do not match the CSV header/);
assert.match(handoff, /sha256Hex/);
assert.match(handoff, /declared payload SHA-256 is invalid/);
assert.match(handoff, /declared payload SHA-256 does not match the transferred CSV/);
assert.match(handoff, /await decideManifest/);
assert.match(handoff, /The CSV was imported normally instead/);
assert.match(handoff, /appendBIDELineage\(manifest, "bide\.open"/);
assert.match(handoff, /manifestAccepted: Boolean\(manifestDecision\.manifest\)/);
assert.match(handoff, /sessionStorage\.setItem\(CONTEXT_KEY/);

// bIDE -> PocketBI result handoff must also use exact-window/origin trust and never put data in URLs.
assert.match(outbound, /const POCKETBI_ORIGIN = "https:\/\/pocketbi\.app"/);
assert.match(outbound, /event\.origin === POCKETBI_ORIGIN && event\.source === target/);
assert.match(outbound, /bide:pocketbi:ready/);
assert.match(outbound, /bide:pocketbi:dataset/);
assert.match(outbound, /pocketbi-handoff@1/);
assert.match(outbound, /operation: isOriginalSource \? "bide\.return_source" : "bide\.dataset_result"/);
assert.match(outbound, /verification: isOriginalSource && parent/);
assert.match(outbound, /plainFileFallback: true/);
assert.doesNotMatch(outbound, /[?&](csv|data)=/i, 'bIDE must never place dataset contents in the PocketBI URL');
assert.doesNotMatch(outbound, /postMessage\([^\n]*["']\*["']\)/, 'bIDE -> PocketBI handoff must never post to a wildcard origin');
assert.match(datasetViewer, /Continue in PocketBI/);
assert.match(datasetViewer, /sendDatasetToPocketBI/);

// V1 team semantics are asynchronous handoff, not shared storage or silent live sync.
assert.match(account, /Product files are not automatically shared just because the account is shared/, 'Account page must preserve the identity-vs-file-sharing boundary');
assert.doesNotMatch(mobile, /Auto-Sync Across Devices|syncs automatically/i, 'Mobile marketing must not claim automatic cross-device sync');
assert.match(mobile, /does not silently live-sync edits between devices/, 'Mobile page must explain explicit snapshot semantics');
assert.doesNotMatch(ide, /Save and sync your coding sessions across devices/, 'IDE must not describe cloud snapshots as automatic sync');
assert.match(ide, /Save workspace snapshots and restore them across devices/, 'IDE must describe the real cloud snapshot behavior');
assert.doesNotMatch(features, /collaboration permanent toolbar clutter/, 'Features must not imply an unwired collaboration system');

// Public runtime promises must match the four V1 runtimes actually registered by the IDE.
assert.match(docs, /V1_RUNTIME_LANGUAGES = new Set\(\['python', 'r', 'javascript', 'sql'\]\)/, 'Docs hub must expose only shipped V1 runtimes as executable');
for (const path of ['php', 'ruby', 'lua', 'java', 'typescript', 'cpp', 'c', 'rust', 'go', 'swift', 'kotlin', 'csharp']) {
  assert.match(app, new RegExp(`<Route path="/docs/${path}" element=\\{<Navigate to="/docs" replace />\\} />`), `Legacy /docs/${path} must redirect to current docs`);
  const exactLoc = `<loc>https://bideide.com/docs/${path}</loc>`;
  assert.ok(!sitemap.includes(exactLoc), `Sitemap must not advertise unsupported runtime route /docs/${path}`);
}
assert.match(app, /<Route path="\/tutorials" element=\{<Navigate to="\/docs" replace \/>\} \/>/, 'Stale tutorials route must redirect to the current docs hub');
assert.ok(!sitemap.includes('<loc>https://bideide.com/upgrade</loc>'), 'Sitemap must not advertise the retired bIDE upgrade page');
assert.ok(!sitemap.includes('<loc>https://bideide.com/share</loc>'), 'Sitemap must not advertise a non-existent bare share route');
assert.doesNotMatch(sitemap, /16 Programming Languages|12 more languages/i, 'Crawler metadata must not restore the old 16-runtime claim');

assert.match(focusedSeo, /unlisted bIDE code link/, 'Shared-code metadata must describe unlisted handoff truthfully');
assert.doesNotMatch(support, /navigate\("\/tutorials"\)/, 'Support must link to current docs rather than the retired tutorial implementation');

console.log('✓ Team handoff + PocketBI V1 + public runtime boundary regression guard passed');
