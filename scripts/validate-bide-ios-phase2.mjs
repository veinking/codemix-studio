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
  "ios/PHASE_2_DATA_SQL_ACCEPTANCE.md",
  "ios/BideApp/Models/DatasetModels.swift",
  "ios/BideApp/Data/DatasetParser.swift",
  "ios/BideApp/Data/SQLiteProjectEngine.swift",
  "ios/BideApp/Stores/DataWorkspaceStore.swift",
  "ios/BideApp/Stores/DataWorkspaceStore+SQLExport.swift",
  "ios/BideApp/Views/DatasetsView.swift",
  "ios/BideApp/Views/SQLResultsView.swift",
  "ios/BideApp/Views/SQLJoinBuilderView.swift",
  "ios/BideApp/Editor/CompletionProvider.swift",
  "ios/BideApp/Views/WorkspaceView.swift",
  "ios/BideApp/BideApp.swift",
  "ios/BideTests/JoinPipelineTests.swift",
];

for (const filePath of required) {
  assert.ok(exists(filePath), `Phase 2 native file is missing: ${filePath}`);
}

const project = read("ios/project.yml");
for (const expected of [
  "CoreXLSX:",
  "exactVersion: 0.14.2",
  "product: CoreXLSX",
  "sdk: libsqlite3.tbd",
  "public.comma-separated-values-text",
  "public.tab-separated-values-text",
  "public.json",
  "public.plain-text",
  "org.openxmlformats.spreadsheetml.sheet",
  "MARKETING_VERSION: 0.2.5",
  "CURRENT_PROJECT_VERSION: 7",
  "bIDETests:",
  "type: bundle.unit-test",
]) {
  assert.ok(project.includes(expected), `Phase 2 project wiring missing: ${expected}`);
}

const models = read("ios/BideApp/Models/DatasetModels.swift");
for (const format of ["case csv", "case tsv", "case json", "case text", "case xlsx"]) {
  assert.ok(models.includes(format), `Dataset format missing: ${format}`);
}
for (const resultCapability of [
  "statementSQL",
  "isReadOnly",
  "isTruncated",
  "SQLRunReport",
  "SQLCSVExportSummary",
  "sampleRows",
]) {
  assert.ok(models.includes(resultCapability), `Structured SQL result capability missing: ${resultCapability}`);
}

const parser = read("ios/BideApp/Data/DatasetParser.swift");
for (const parserCapability of [
  "parseDelimited",
  "parseText",
  "parseJSON",
  "parseXLSX",
  "parseWorksheetPathsAndNames",
  "parseSharedStrings",
  "delimitedRecords",
  "isStrictInteger",
  "uniqueHeaders",
  "malformedDelimited",
  "validateDelimitedShape",
  "damaged row separators",
  "unterminated quoted field",
]) {
  assert.ok(parser.includes(parserCapability), `Dataset parser capability missing: ${parserCapability}`);
}

const sqlite = read("ios/BideApp/Data/SQLiteProjectEngine.swift");
for (const sqlCapability of [
  "import SQLite3",
  "sqlite3_prepare_v2",
  "sqlite3_stmt_readonly",
  "rowLimit: Int = 500",
  "isTruncated",
  "exportReadOnlyQueryToCSV",
  "SQLCSVExportSummary",
  "sampleLimit: Int = 100",
  "sampleRows.append(row)",
  "BEGIN IMMEDIATE TRANSACTION",
]) {
  assert.ok(sqlite.includes(sqlCapability), `Native SQLite capability missing: ${sqlCapability}`);
}
assert.ok(!sqlite.includes("sql.js"), "Native Phase 2 SQL must not depend on sql.js.");

const store = read("ios/BideApp/Stores/DataWorkspaceStore.swift");
for (const dataCapability of [
  "datasets.bide.json",
  ".bide.sqlite",
  "importDatasets",
  "reconcileProjectFiles",
  "rebuildDatabase",
  "executeSQL",
  "preview",
  "registerDataset",
  "requestedBase = sheetName",
]) {
  assert.ok(store.includes(dataCapability), `Dataset workspace capability missing: ${dataCapability}`);
}
assert.ok(
  store.includes("parsedTable.sourceSheetName"),
  "Multi-sheet Excel imports must derive their SQL table base from the worksheet name."
);

const exportStore = read("ios/BideApp/Stores/DataWorkspaceStore+SQLExport.swift");
for (const exportCapability of [
  "exportSQLResult",
  "exportReadOnlyQueryToCSV",
  "registerAsDataset",
  "exportSummary.columns == result.columns",
  "exportSummary.sampleRows == expectedSample",
  "exportSummary.rowCount",
  "verification.primaryResult?.rows == expectedRows",
  "removeFailedSavedResult",
]) {
  assert.ok(exportStore.includes(exportCapability), `SQL export/integrity capability missing: ${exportCapability}`);
}

const datasetsView = read("ios/BideApp/Views/DatasetsView.swift");
for (const uiCapability of [
  "Quick Actions",
  "Import Dataset",
  "Project Datasets",
  "Query in SQL",
  "Join Two Tables",
  "Rebuild SQL Database",
  "Share Original Dataset Files",
  "join/query CSV export lives inside SQL Results",
  "Export This Dataset",
  "joinResultReport",
  "Join Results",
  "lastCompletedJoinReport",
  "Last Join Result",
  "Open Join Results",
  "Share Result as CSV",
  "openWorkspaceAfterJoinDismiss",
  "handleJoinBuilderDismissal",
  "await Task.yield()",
]) {
  assert.ok(datasetsView.includes(uiCapability), `Datasets UI capability missing: ${uiCapability}`);
}
assert.ok(
  datasetsView.includes("dataWorkspace.lastSQLRun = nil"),
  "Starting a guided join must clear stale SQL results before presenting the builder."
);
assert.ok(
  datasetsView.includes("session.selectedSection = .workspace"),
  "Editable join query navigation must occur after the Join Builder dismisses."
);
assert.ok(
  datasetsView.includes("lastCompletedJoinReport = report"),
  "A successful guided join must leave a recoverable result breadcrumb in Datasets."
);
assert.ok(
  datasetsView.includes("lastCompletedJoinReport = nil"),
  "Recoverable join results must be cleared when the active project changes."
);

const resultsView = read("ios/BideApp/Views/SQLResultsView.swift");
for (const resultUI of [
  "SQLResultTableView",
  "First 500",
  "Result Actions",
  "Share Result as CSV",
  "Save Result as Dataset",
  "SQL that ran",
  "No Rows Returned",
  "View Datasets",
  "defaultScrollAnchor(.top)",
]) {
  assert.ok(resultsView.includes(resultUI), `SQL results UI capability missing: ${resultUI}`);
}

const joinBuilder = read("ios/BideApp/Views/SQLJoinBuilderView.swift");
for (const joinCapability of [
  "INNER JOIN",
  "LEFT JOIN",
  "Run Join & View Results",
  "Create Editable Join Query",
  "dataWorkspace.executeSQL",
  "suggestJoinColumns",
  "hasSuffix(\"_id\")",
  "SELECT l.*, r.*",
  "onEditableQueryCreated",
  "previousFileID",
  "The Join Builder will stay open so nothing is lost",
]) {
  assert.ok(joinBuilder.includes(joinCapability), `Guided join capability missing: ${joinCapability}`);
}
assert.ok(
  !joinBuilder.includes("session.selectedSection = .workspace"),
  "The Join Builder must not switch tabs while its modal sheet is still dismissing."
);

const joinTests = read("ios/BideTests/JoinPipelineTests.swift");
for (const regression of [
  "testOrdersLeftJoinExportRoundTripPreservesRowsAndValues",
  "testFlattenedCSVShapeFailsClosedInsteadOfTurningValuesIntoHeaders",
  "XCTAssertEqual(orders.rows.count, 27)",
  "C999",
  "C888",
  "customer_id_2",
  "Starter Plan",
  "49.0",
  "XCTAssertEqual(exportSummary.rowCount, 27)",
  "XCTAssertEqual(roundTrip.rows.count, 27)",
]) {
  assert.ok(joinTests.includes(regression), `Phone join regression coverage missing: ${regression}`);
}

const completion = read("ios/BideApp/Editor/CompletionProvider.swift");
assert.ok(completion.includes("datasets: [DatasetAsset]"), "Autocomplete must receive project datasets.");
assert.ok(completion.includes("table.sqliteName"), "SQL autocomplete must include imported table names.");
assert.ok(completion.includes("table.columns"), "SQL autocomplete must include dataset columns.");

const workspace = read("ios/BideApp/Views/WorkspaceView.swift");
assert.ok(workspace.includes("dataWorkspace.executeSQL"), "Run Selection/File must execute SQL natively.");
assert.ok(workspace.includes("SQLResultsView"), "Workspace must present structured SQL results.");
assert.ok(
  workspace.includes("workspace.activeFile?.language ?? workspace.documentLanguage"),
  "The active file must be authoritative for runtime routing to prevent stale language state."
);

const app = read("ios/BideApp/BideApp.swift");
assert.ok(app.includes("DatasetFormat.infer"), "Open in bIDE must route dataset file types.");
assert.ok(app.includes("reconcileProjectFiles"), "Project open must discover existing local datasets.");

const nativeSource = walk("ios/BideApp")
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
  assert.ok(!nativeSource.includes(forbidden), `Phase 2 scope leak detected: ${forbidden}`);
}

console.log("bIDE iOS Phase 2 audited data + SQL validation passed.");
