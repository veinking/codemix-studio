import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const exists = (path) => fs.existsSync(path);

const required = [
  "ios/project.yml",
  "ios/BideApp/Editor/BideCodeEditor.swift",
  "ios/BideApp/Editor/CompletionProvider.swift",
  "ios/BideApp/Views/CodingToolbar.swift",
  "ios/BideApp/Views/WorkspaceView.swift",
  "ios/BideApp/Views/ProjectFileBrowser.swift",
  "ios/BideApp/Views/ProjectsView.swift",
  "ios/BideApp/Stores/WorkspaceStore.swift",
  "ios/BideApp/Models/CodeLanguage.swift",
  "ios/BideApp/Models/ProjectModels.swift",
];

for (const path of required) {
  assert.ok(exists(path), `Phase 1 native file is missing: ${path}`);
}

const project = read("ios/project.yml");
assert.match(project, /TARGETED_DEVICE_FAMILY:\s*"1,2"/);
assert.ok(project.includes("Runestone"), "Native editor dependency must stay wired.");
for (const product of ["TreeSitterPythonRunestone", "TreeSitterSQLRunestone", "TreeSitterRRunestone"]) {
  assert.ok(project.includes(product), `Missing syntax product: ${product}`);
}

const language = read("ios/BideApp/Models/CodeLanguage.swift");
for (const expected of ["case python", "case sql", "case r"]) {
  assert.ok(language.includes(expected), `V1 language is missing: ${expected}`);
}
for (const forbidden of ["case javascript", "case java", "case swift", "case rust", "case go", "case cpp"]) {
  assert.ok(!language.includes(forbidden), `Phase 1 must not expand the native language surface: ${forbidden}`);
}

const editor = read("ios/BideApp/Editor/BideCodeEditor.swift");
for (const capability of [
  "showLineNumbers = true",
  "textViewDidChangeSelection",
  "presentFindNavigator",
  "case .indent",
  "case .outdent",
  "case .runSelection",
]) {
  assert.ok(editor.includes(capability), `Native editor capability missing: ${capability}`);
}

const store = read("ios/BideApp/Stores/WorkspaceStore.swift");
for (const capability of [
  "bIDE Projects",
  "project.bide.json",
  "scheduleAutosave",
  "createProject",
  "createFile",
  "renameFile",
  "deleteFile",
]) {
  assert.ok(store.includes(capability), `Project core capability missing: ${capability}`);
}

const nativeFiles = required
  .filter((path) => path.endsWith(".swift"))
  .map(read)
  .join("\n");

for (const forbidden of [
  "import StoreKit",
  "import Supabase",
  "WKWebView",
  "Pyodide",
  "webR",
]) {
  assert.ok(!nativeFiles.includes(forbidden), `Phase 1 scope leak detected: ${forbidden}`);
}

console.log("bIDE iOS Phase 1 scope validation passed.");
