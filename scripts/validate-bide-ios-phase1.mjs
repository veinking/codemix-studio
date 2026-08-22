import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (filePath) => fs.readFileSync(filePath, "utf8");
const exists = (filePath) => fs.existsSync(filePath);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(next) : [next];
  });
}

const required = [
  "ios/project.yml",
  "ios/PHASE_1_EDITOR_ACCEPTANCE.md",
  "ios/BideApp/BideApp.swift",
  "ios/BideApp/Editor/BideCodeEditor.swift",
  "ios/BideApp/Editor/EditorCommand.swift",
  "ios/BideApp/Editor/CompletionProvider.swift",
  "ios/BideApp/Views/CodingToolbar.swift",
  "ios/BideApp/Views/WorkspaceView.swift",
  "ios/BideApp/Views/ProjectFileBrowser.swift",
  "ios/BideApp/Views/ProjectsView.swift",
  "ios/BideApp/Stores/WorkspaceStore.swift",
  "ios/BideApp/Stores/WorkspaceStore+CodeImport.swift",
  "ios/BideApp/Models/CodeLanguage.swift",
  "ios/BideApp/Models/ProjectModels.swift",
];

for (const filePath of required) {
  assert.ok(exists(filePath), `Phase 1 native file is missing: ${filePath}`);
}

const project = read("ios/project.yml");
assert.match(project, /TARGETED_DEVICE_FAMILY:\s*"1,2"/);
assert.ok(project.includes("Runestone"), "Native editor dependency must stay wired.");
assert.ok(project.includes("from: 0.5.2"), "Runestone must stay pinned to the reviewed 0.5.2 release line.");
assert.ok(
  project.includes("revision: 15cf3a9ec3ab95e0d058b7df9f35619123c9e02d"),
  "TreeSitterLanguages must stay pinned to the reviewed revision."
);
for (const product of ["TreeSitterPythonRunestone", "TreeSitterSQLRunestone", "TreeSitterRRunestone"]) {
  assert.ok(project.includes(product), `Missing syntax product: ${product}`);
}
for (const capability of [
  "CFBundleDocumentTypes",
  "public.python-script",
  "com.bideide.sql-source",
  "com.bideide.r-source",
]) {
  assert.ok(project.includes(capability), `Native document-open registration missing: ${capability}`);
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
  "case .indent",
  "case .outdent",
  "case .findNext",
  "case .replaceNext",
  "case .replaceAll",
  "case .runSelection",
]) {
  assert.ok(editor.includes(capability), `Native editor capability missing: ${capability}`);
}

const workspaceView = read("ios/BideApp/Views/WorkspaceView.swift");
for (const capability of [
  "CodingToolbar",
  "FindReplaceSheet",
  ".keyboardShortcut(\"r\", modifiers: .command)",
  "ProjectFileBrowser",
]) {
  assert.ok(workspaceView.includes(capability), `Workspace UI capability missing: ${capability}`);
}

const projectsView = read("ios/BideApp/Views/ProjectsView.swift");
for (const capability of [
  "Import Project Folder",
  "Import Code Files",
  "allowedContentTypes: importableCodeTypes",
  "importCodeFilesAsProject",
]) {
  assert.ok(projectsView.includes(capability), `Project import capability missing: ${capability}`);
}

const app = read("ios/BideApp/BideApp.swift");
assert.ok(app.includes(".onOpenURL"), "bIDE must handle source files opened from Files/share surfaces.");
assert.ok(app.includes("importCodeFilesAsProject"), "Incoming source files must enter the local project model.");

const store = read("ios/BideApp/Stores/WorkspaceStore.swift");
for (const capability of [
  "bIDE Projects",
  "project.bide.json",
  "scheduleAutosave",
  "createProject",
  "createFile",
  "renameFile",
  "deleteFile",
  "dateDecodingStrategy = .iso8601",
]) {
  assert.ok(store.includes(capability), `Project core capability missing: ${capability}`);
}

const codeImport = read("ios/BideApp/Stores/WorkspaceStore+CodeImport.swift");
for (const capability of [
  "importCodeFilesAsProject",
  "startAccessingSecurityScopedResource",
  "String(contentsOf: sourceURL",
]) {
  assert.ok(codeImport.includes(capability), `Standalone source import capability missing: ${capability}`);
}

const nativeFiles = walk("ios/BideApp")
  .filter((filePath) => filePath.endsWith(".swift"))
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
