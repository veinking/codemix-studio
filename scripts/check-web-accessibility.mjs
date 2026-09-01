import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const consolePanel = readFileSync("src/components/ConsolePanel.tsx", "utf8");
const explorer = readFileSync("src/components/FileExplorer.tsx", "utf8");
const sidePanel = readFileSync("src/components/SidePanel.tsx", "utf8");

assert.match(consolePanel, /role="log"/, "Console output must expose log semantics.");
assert.match(consolePanel, /aria-live="polite"/, "Console output must announce new runtime results.");
assert.match(consolePanel, /displayedOutput\.slice\(-20\)/, "Collapsed console must keep recent output available to assistive technology.");
assert.match(consolePanel, /aria-label="Console output"/, "Console output region must have a durable accessible name.");
assert.match(explorer, /aria-label=\{`Delete \$\{file\.name\}`\}/, "Every file delete action must include its file name.");
assert.match(explorer, /onClick=\{\(\) => document\.getElementById\("file-upload"\)\?\.click\(\)\}/, "Upload files must be a real keyboard-operable button.");
assert.match(sidePanel, /aria-label="Close workspace tools"/, "Workspace tools close action must have an accessible name.");

console.log("bIDE web accessibility contract passed");
