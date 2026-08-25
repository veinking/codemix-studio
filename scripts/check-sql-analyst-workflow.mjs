import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const runtime = read('src/runtimes/SQLRuntime.ts');
const ide = read('src/pages/IDE.tsx');
const viewer = read('src/components/DatasetViewer.tsx');
const docs = read('src/pages/docs/SQLDocs.tsx');
const toolbar = read('src/components/Toolbar.tsx');

assert.match(runtime, /sql-wasm\.wasm\?url/, 'SQL wasm must be served from the bIDE build');
assert.doesNotMatch(runtime, /https:\/\/sql\.js\.org/, 'SQL runtime must not depend on the sql.js.org runtime CDN');
assert.doesNotMatch(runtime, /code\.split\(['"];/, 'SQL must not split programs on raw semicolons');
assert.match(runtime, /this\.db\.exec\(code\)/, 'SQLite must parse the complete SQL program');
assert.match(runtime, /syncDatasets\(datasets: RuntimeDataset\[\]\)/, 'SQL must refresh workspace datasets');
assert.match(runtime, /identifierLike/, 'SQL import must protect identifier-like columns as text');
assert.match(runtime, /db\.prepare\(/, 'SQL dataset import must use prepared inserts');
assert.match(runtime, /name: queryResults\.length === 1 \? 'SQL Result'/, 'SELECT results must become structured datasets');

assert.match(ide, /runtime\.syncDatasets\(collectSQLDatasets\(\)\)/, 'IDE must load workspace data before SQL execution');
assert.match(ide, /const latestResultName = result\.datasets\[result\.datasets\.length - 1\]\.name;[\s\S]*setShowDataset\(latestResultName\);[\s\S]*setActiveFile\(null\)/, 'Latest SQL result must open separately from an active CSV');
assert.match(ide, /onExportCSV=\{\(\) => handleExportDataset\(showDataset\)\}/, 'Result datasets must export as CSV');
assert.match(ide, /onSaveAsFile=\{\(\) => handleSaveDatasetAsFile\(showDataset\)\}/, 'Result datasets must save back to Files');
assert.match(ide, /if \(validLang\)/, 'Language-only documentation deep links must be honored');
assert.match(ide, /showScratchLanguageSelector=\{currentFile\?\.language === 'csv' && csvViewMode === 'code'\}/, 'CSV Write Code mode must request the scratch language selector');
assert.match(toolbar, /const shouldShowLanguageSelector = !currentFile \|\| showScratchLanguageSelector;/, 'Toolbar must show language switching for CSV Write Code mode');

assert.match(ide, /const currentFileDataset = currentFile\?\.language === 'csv'/, 'CSV source preview must resolve from the active file');
assert.match(ide, /View Result/, 'CSV workflow must keep a path back to the latest query result');
assert.doesNotMatch(ide, /title=\{currentFile\.name\}\s+headers=\{currentDataset\.headers\}/, 'A query result must never masquerade as the active CSV preview');
assert.match(ide, /preloadedFromCSV[\s\S]*currentFileDataset/, 'Data Lab must preload the active CSV source rather than a query result');

assert.match(viewer, /Back to Code/, 'Result viewer needs an obvious path back to the editor');
assert.match(viewer, /Export CSV/, 'Result viewer needs CSV export');
assert.match(viewer, /Save to Files/, 'Result viewer needs persistence into the file workspace');

assert.match(docs, /Uploaded CSVs refresh into SQLite tables before each SQL run/, 'SQL docs must explain CSV-backed tables');
assert.match(docs, /Identifier-like columns/, 'SQL docs must explain join-key preservation');
assert.match(docs, /session-only/, 'SQL docs must explain in-memory table persistence');

console.log('✓ SQL analyst CSV → SQLite → result/export regression guard passed');
