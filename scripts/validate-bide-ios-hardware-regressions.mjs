import assert from "node:assert/strict";
import fs from "node:fs";

const requiredFiles = [
  "ios/BideTests/CurrentGenerationDatabaseDriftTests.swift",
  "ios/BideTests/CurrentGenerationSchemaDriftTests.swift",
  "ios/BideTests/JoinPipelineTests.swift",
  "ios/BideTests/JoinSavedResultTests.swift",
  "ios/BideTests/EditableJoinQueryPersistenceTests.swift",
  "ios/BideTests/VerifiedResultRelaunchIntegrationTests.swift",
  "ios/BideTests/LargeSavedResultIntegrityTests.swift",
  "ios/BideTests/MultiSheetXLSXTests.swift",
  "ios/BideApp/Views/SQLJoinBuilderView.swift",
  "ios/BideApp/Views/SQLResultsView.swift",
  "ios/BideApp/Views/DatasetsView.swift",
];
for (const path of requiredFiles) {
  assert.ok(fs.existsSync(path), `Missing hardware-regression source guard: ${path}`);
}

const joinedTests = requiredFiles
  .filter((path) => path.includes("/BideTests/"))
  .map((path) => fs.readFileSync(path, "utf8"))
  .join("\n");

for (const testName of [
  "testCurrentGenerationEmptyTablesAreRebuiltBeforeLeftJoinRuns",
  "testCurrentGenerationSchemaDriftIsRebuiltEvenWhenRowCountsMatch",
  "testOrdersLeftJoinExportRoundTripPreservesRowsAndValues",
  "testCanonicalLeftJoinSaveResultCreatesVerifiedTwentySevenByTwelveDataset",
  "testGeneratedJoinSQLFilePersistsAndReopensAsActiveSQLDocument",
  "testImportedSourcesAndVerifiedSavedJoinSurviveFreshStoreReopen",
  "testTruncatedPreviewSaveVerifiesAndPersistsAllSixHundredFiftyRows",
  "testCanonicalWorkbookImportsAsTwoQueryableSQLTables",
]) {
  assert.ok(joinedTests.includes(testName), `Hardware regression lost deterministic coverage: ${testName}`);
}

for (const value of ["C999", "C888", "C001_2", "Starter Plan_2", "VA_2", "49.0_2"]) {
  assert.ok(joinedTests.includes(value), `Join corruption regression lost sentinel: ${value}`);
}

const joinBuilder = fs.readFileSync("ios/BideApp/Views/SQLJoinBuilderView.swift", "utf8");
for (const token of [
  ".sheet(item: $presentedJoinReport",
  "onJoinCompleted(report)",
  "presentedJoinReport = report",
  "workspace.createFile(named:",
  "workspace.saveActiveDocumentNow()",
  "could not activate the editable SQL file",
]) {
  assert.ok(joinBuilder.includes(token), `Join lifecycle/editable-query guard missing: ${token}`);
}

const resultsView = fs.readFileSync("ios/BideApp/Views/SQLResultsView.swift", "utf8");
assert.ok(resultsView.includes(".interactiveDismissDisabled(isWorking)"), "Result sheet must remain alive during share/save verification.");

const datasetsView = fs.readFileSync("ios/BideApp/Views/DatasetsView.swift", "utf8");
for (const token of ["Last Join Result", "Open Join Results", "lastCompletedJoinReport"]) {
  assert.ok(datasetsView.includes(token), `Recoverable join-result breadcrumb missing: ${token}`);
}

console.log("bIDE hardware-regression source map passed.");
