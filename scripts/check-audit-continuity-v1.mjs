import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const explorer = read("src/components/FileExplorer.tsx");
const toolbar = read("src/components/Toolbar.tsx");
const viewer = read("src/components/DatasetViewer.tsx");
const handoff = read("src/pages/PocketBIHandoff.tsx");
const consolePanel = read("src/components/ConsolePanel.tsx");

assert.match(explorer, /value="javascript"[^>]*>JavaScript \(\.js\)/, "New File must offer JavaScript.");
assert.match(explorer, /value="sql"[^>]*>SQL \(\.sql\)/, "New File must offer SQL.");
assert.match(explorer, /bide\.pending-open-file\.v1/, "Explorer must consume inbound PocketBI file-open intent.");
assert.match(explorer, /bide:restore-source-file/, "Explorer must restore the exact source file after result viewing.");
assert.match(explorer, /aria-label={`Delete \$\{file\.name\}`}/, "Explorer delete actions need file-specific accessible names.");
assert.match(explorer, /onKeyDown=.*Enter.*\|\|.*' '/s, "Explorer file rows must support keyboard activation.");

assert.match(toolbar, /bide\.last-run-context\.v1/, "Run must record the exact source context before result navigation.");
assert.match(toolbar, /fileId: currentFile/, "Run context must retain the active Explorer file ID.");
assert.match(toolbar, /Loading \$\{languageLabel\} runtime/, "Run UI must distinguish runtime initialization from execution.");

assert.match(viewer, /\^SQL Result/, "Result return behavior must be scoped to SQL result datasets.");
assert.match(viewer, /bide:restore-source-file/, "Back to Code must request restoration of the source file.");
assert.match(viewer, /sessionStorage\.removeItem\(LAST_RUN_CONTEXT_KEY\)/, "Result source context must be one-time.");

assert.match(handoff, /bide\.pending-open-file\.v1/, "PocketBI handoff must mark the saved CSV for immediate opening.");
assert.match(handoff, /fileId: id/, "Inbound handoff must target the exact saved CSV ID.");
assert.match(handoff, /requestedView: "data"/, "Inbound CSV should request the dataset/DataLab view.");

assert.match(consolePanel, /role="log"/, "Console printed output must be exposed as an accessible log.");
assert.match(consolePanel, /aria-live="polite"/, "Console updates must be announced without interrupting the user.");
assert.match(consolePanel, /Latest console output:/, "Collapsed console must still expose its newest readable output.");

console.log("bIDE audit continuity V1 passed: SQL context restore, PocketBI CSV auto-open, JS/SQL New File, Explorer a11y, runtime progress, and accessible console output are guarded.");