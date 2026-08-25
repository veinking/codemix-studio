import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Papa from 'papaparse';

const ideSource = readFileSync(new URL('../src/pages/IDE.tsx', import.meta.url), 'utf8');
const dataOpsSource = readFileSync(new URL('../src/components/DataOperations.tsx', import.meta.url), 'utf8');
const dataLabSource = readFileSync(new URL('../src/components/DataLab.tsx', import.meta.url), 'utf8');

// First-run persistence must survive an early reload before IndexedDB is ready.
assert.match(ideSource, /bide_starter_seed_pending/, 'Starter workspace must use a durable pending seed marker');
assert.match(ideSource, /starterFilesRef\.current = demoFiles/, 'Starter files must remain available until IndexedDB is ready');
assert.match(ideSource, /for \(const file of starterFiles\)[\s\S]*?await saveFile\(file\)/, 'Starter files must be persisted to IndexedDB');

// Monaco must be able to save a truly empty file.
assert.match(ideSource, /if \(value === undefined\) return;/, 'Empty string must remain a valid editor state');
assert.doesNotMatch(ideSource, /if \(!value\) return;/, 'Editor must not reject empty-string changes');

// CSV preview/import paths preserve source strings instead of normalizing IDs.
assert.doesNotMatch(ideSource, /dynamicTyping:\s*true/, 'IDE CSV parsing must not coerce source values');
assert.doesNotMatch(dataLabSource, /dynamicTyping:\s*true/, 'DataLab CSV parsing must not coerce source values');
assert.match(ideSource, /dynamicTyping:\s*false/, 'IDE must explicitly preserve CSV strings');
assert.match(dataLabSource, /dynamicTyping:\s*false/, 'DataLab must explicitly preserve CSV strings');

// Python CSV preparation must never rebuild rows with comma joins.
assert.doesNotMatch(ideSource, /row\.join\(['"] ,?['"]\)|row\.join\(['"],['"]\)/, 'CSV rows must not be reconstructed with Array.join');
assert.doesNotMatch(ideSource, /dataset\.headers\.join\(['"],['"]\)/, 'CSV headers must not be reconstructed with Array.join');
assert.match(ideSource, /sourceFile\?\.content\s*\?\?\s*Papa\.unparse/, 'Python must prefer original CSV content and safely serialize generated datasets');

// Uploading a CSV should immediately show that dataset rather than an empty data view.
assert.match(ideSource, /setShowDataset\(firstFile\.name\)/, 'File Explorer CSV upload must open its dataset');
assert.match(ideSource, /setShowDataset\(fileItem\.name\)/, 'Mobile CSV upload must open its dataset');

// Data Ops should target the selected CSV instead of silently inserting data.csv.
assert.match(dataOpsSource, /activeCsvName/, 'Data Ops must resolve the active CSV');
assert.match(dataOpsSource, /JSON\.stringify\(activeCsvName\)/, 'Data Ops must safely quote the active CSV filename');
assert.match(dataOpsSource, /operation\.name !== 'Load CSV'/, 'Only Load CSV should receive filename substitution');

// Scratch file extensions must match every supported language.
assert.match(ideSource, /javascript:\s*'js'/, 'JavaScript scratch downloads must use .js');
assert.match(ideSource, /sql:\s*'sql'/, 'SQL scratch downloads must use .sql');

// The fixed worker path should not still warn successful mobile users away from browser plotting.
assert.doesNotMatch(ideSource, /Complex plots may have limited rendering on mobile devices/, 'Successful mobile plotting must not show the stale limitation warning');
assert.doesNotMatch(ideSource, /View on desktop/, 'Plot failure UX must remain browser-first');

// Cross-language templates should not be overwritten by stale scratch state.
assert.match(ideSource, /\[template\.language\]: template\.code/, 'Template language switch must preserve the selected template code');

// Real CSV behavior check: quoted commas and leading-zero identifiers survive parsing + serialization.
const sourceCsv = 'customer_id,customer_name,notes\n00123,"ACME, Inc.","Line one, still same cell"\n';
const parsed = Papa.parse(sourceCsv, {
  header: true,
  dynamicTyping: false,
  skipEmptyLines: true,
});
assert.equal(parsed.data[0].customer_id, '00123', 'Leading-zero identifiers must survive parsing');
assert.equal(parsed.data[0].customer_name, 'ACME, Inc.', 'Quoted commas must remain inside one cell');

const headers = parsed.meta.fields;
assert.ok(headers, 'CSV test must expose headers');
const rows = parsed.data.map((row) => headers.map((header) => row[header] ?? ''));
const serialized = Papa.unparse([headers, ...rows]);
const reparsed = Papa.parse(serialized, {
  header: true,
  dynamicTyping: false,
  skipEmptyLines: true,
});
assert.equal(reparsed.data[0].customer_id, '00123', 'Leading-zero identifiers must survive safe CSV serialization');
assert.equal(reparsed.data[0].customer_name, 'ACME, Inc.', 'Quoted commas must survive safe CSV serialization');
assert.equal(reparsed.data[0].notes, 'Line one, still same cell', 'Comma-containing text must survive safe CSV serialization');

console.log('✓ Solo workflow persistence + CSV integrity regression guard passed');
