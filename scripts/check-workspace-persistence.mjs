import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexedDb = readFileSync(new URL('../src/hooks/useIndexedDB.ts', import.meta.url), 'utf8');
const cloud = readFileSync(new URL('../src/hooks/useCloudWorkspace.ts', import.meta.url), 'utf8');
const manager = readFileSync(new URL('../src/components/WorkspaceManager.tsx', import.meta.url), 'utf8');
const explorer = readFileSync(new URL('../src/components/FileExplorer.tsx', import.meta.url), 'utf8');
const ide = readFileSync(new URL('../src/pages/IDE.tsx', import.meta.url), 'utf8');
const codeEditor = readFileSync(new URL('../src/components/CodeEditor.tsx', import.meta.url), 'utf8');
const plotViewer = readFileSync(new URL('../src/components/PlotViewer.tsx', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20260825150500_harden_bide_cloud_workspaces.sql', import.meta.url), 'utf8');

assert.match(indexedDb, /const replaceFiles = async/, 'Cloud restore must atomically replace local files');
assert.match(indexedDb, /transaction\(\[STORE_NAME\], "readwrite"\)[\s\S]*?store\.clear\(\)[\s\S]*?store\.put/, 'Workspace replacement must clear and repopulate in one transaction');
assert.match(indexedDb, /transaction\.onabort/, 'Workspace replacement must surface aborted transactions');

assert.match(cloud, /scratch_code: string/, 'Cloud snapshot must include scratch editor content');
assert.match(cloud, /WORKSPACE_FILE_LIMIT = 100/, 'Cloud snapshots must bound file count');
assert.match(cloud, /WORKSPACE_JSON_LIMIT_BYTES = 5 \* 1024 \* 1024/, 'Cloud snapshots must bound serialized file size');
assert.match(cloud, /SCRATCH_LIMIT_BYTES = 1024 \* 1024/, 'Cloud snapshots must bound scratch size');
assert.match(cloud, /duplicate file identifiers/, 'Cloud snapshots must reject duplicate file IDs');
assert.doesNotMatch(cloud, /autoSaveSession/, 'UI must not imply continuous cloud autosave when none is wired');

assert.match(manager, /to="\/auth"/, 'Cloud-workspace sign-in button must navigate to a real auth route');
assert.match(manager, /currentScratchCode/, 'Workspace save flow must include scratch content');
assert.match(manager, /Restore Workspace/, 'Workspace UI must describe explicit snapshot restore');
assert.match(manager, /snapshot/i, 'Workspace UI must describe snapshots instead of continuous sync');

assert.match(explorer, /Delete All Local Files/, 'Explorer must expose one obvious delete-all action for browser-local files');
assert.match(explorer, /Cloud workspace snapshots are not affected/, 'Delete-all copy must distinguish local files from cloud snapshots');
assert.match(explorer, /for \(const file of \[\.\.\.files\]\)[\s\S]*?await Promise\.resolve\(onFileDelete\(file\.id\)\)/, 'Delete-all must reuse the canonical per-file deletion path so pending IndexedDB writes cannot resurrect files');
assert.match(explorer, /aria-label="Delete all local files"/, 'Delete-all action must have an explicit accessible name');

assert.match(ide, /replaceFiles\(restoredFiles\)/, 'IDE restore must persist the cloud snapshot to IndexedDB');
assert.match(ide, /setActiveFile\(restoredActiveFile\)/, 'IDE restore must clear or restore active-file state exactly');
assert.match(ide, /workspace\.scratch_code/, 'IDE restore must restore scratch content');
assert.match(ide, /file\.language === 'csv'[\s\S]*?parseCSV/, 'IDE restore must rebuild CSV dataset state');
assert.match(ide, /currentScratchCode=\{scratchCode\}/, 'Workspace manager must receive current scratch content');
assert.match(codeEditor, /onDidBlurEditorWidget\([\s\S]*?flushPendingChange\(\)/, 'Editor must flush debounced draft changes before toolbar/language interactions can swap buffers');
assert.match(ide, /editorRef\.current\?\.getValue\?\.\(\)/, 'Language switches must read the synchronous Monaco model value');
assert.match(ide, /createLanguageDraftTransition\([\s\S]*?languageCodeRef\.current/, 'Language switches must use the latest complete draft map');
assert.doesNotMatch(plotViewer, /Python plot output/, 'Shared plot accessibility text must not mislabel R output as Python');

assert.match(migration, /ADD COLUMN IF NOT EXISTS scratch_code/, 'Database must persist the scratch buffer');
assert.match(migration, /jsonb_array_length\(files\) <= 100/, 'Database must enforce file-count limit');
assert.match(migration, /octet_length\(files::text\) <= 5242880/, 'Database must enforce workspace file-size limit');
assert.match(migration, /octet_length\(scratch_code\) <= 1048576/, 'Database must enforce scratch-size limit');
assert.match(migration, /language IN \('python', 'r', 'javascript', 'sql'\)/, 'Database must enforce supported workspace language');

console.log('✓ Cloud workspace persistence regression guard passed');