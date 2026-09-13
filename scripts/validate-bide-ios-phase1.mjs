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
  "ios/BideApp/Views/ActivityShareSheet.swift",
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
for (const documentCapability of [
  "CFBundleDocumentTypes",
  "public.python-script",
  "com.bideide.sql-source",
  "com.bideide.r-source",
  "LSSupportsOpeningDocumentsInPlace: false",
]) {
  assert.ok(project.includes(documentCapability), `External document ingress is missing: ${documentCapability}`);
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
  "allowedContentTypes: [.folder]",
  "allowsMultipleSelection: true",
  "importCodeFilesAsProject",
]) {
  assert.ok(projectsView.includes(capability), `Project ingress capability missing: ${capability}`);
}

const app = read("ios/BideApp/BideApp.swift");
assert.ok(app.includes(".onOpenURL"), "Open/Share in bIDE URL handling must stay wired.");
assert.ok(app.includes("importCodeFilesAsProject"), "External source files must route through local project import.");

const codeImport = read("ios/BideApp/Stores/WorkspaceStore+CodeImport.swift");
for (const capability of [
  "importCodeFilesAsProject",
  "startAccessingSecurityScopedResource",
  "String(contentsOf: sourceURL, encoding: .utf8)",
]) {
  assert.ok(codeImport.includes(capability), `Standalone code import capability missing: ${capability}`);
}

const fileBrowser = read("ios/BideApp/Views/ProjectFileBrowser.swift");
for (const capability of [
  "Export project files",
  "Share File",
  "shareProjectFiles",
  "ActivityShareSheet",
]) {
  assert.ok(fileBrowser.includes(capability), `Source export capability missing: ${capability}`);
}

const shareSheet = read("ios/BideApp/Views/ActivityShareSheet.swift");
assert.ok(shareSheet.includes("UIActivityViewController"), "Native iOS share sheet must back source export.");

const store = read("ios/BideApp/Stores/WorkspaceStore.swift");
for (const capability of [
  "bIDE Projects",
  "project.bide.json",
  "scheduleAutosave",
  "createProject",
  "importProject",
  "createFile",
  "renameFile",
  "deleteFile",
  "dateDecodingStrategy = .iso8601",
]) {
  assert.ok(store.includes(capability), `Project core capability missing: ${capability}`);
}

const swiftFiles = walk("ios/BideApp").filter((filePath) => filePath.endsWith(".swift"));
const allNativeFiles = swiftFiles.map(read).join("\n");
const nonRuntimeFiles = swiftFiles
  .filter((filePath) => !filePath.split(path.sep).includes("Runtime"))
  .map(read)
  .join("\n");

for (const forbidden of ["import StoreKit", "import Supabase"]) {
  assert.ok(!allNativeFiles.includes(forbidden), `Phase 1 scope leak detected: ${forbidden}`);
}

for (const runtimeBoundary of ["WKWebView", "Pyodide", "webR"]) {
  assert.ok(
    !nonRuntimeFiles.includes(runtimeBoundary),
    `Runtime implementation leaked outside BideApp/Runtime: ${runtimeBoundary}`
  );
}

console.log("bIDE iOS Phase 1 structural validation passed.");
