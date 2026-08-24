import assert from "node:assert/strict";
import fs from "node:fs";

const read = (filePath) => fs.readFileSync(filePath, "utf8");
const exists = (filePath) => fs.existsSync(filePath);

const required = [
  "ios/BideApp/Stores/WorkspaceStore.swift",
  "ios/BideApp/Stores/DataWorkspaceStore.swift",
  "ios/BideApp/Stores/DataWorkspaceStore+DatabaseMigration.swift",
  "ios/BideApp/Stores/DataWorkspaceStore+DeletionRecovery.swift",
  "ios/BideApp/Stores/DataWorkspaceStore+SQLExport.swift",
  "ios/BideApp/Views/ProjectsView.swift",
  "ios/BideApp/Views/DatasetsView.swift",
  "ios/BideApp/Views/SQLResultsView.swift",
  "ios/BideApp/BideApp.swift",
  "ios/BideTests/DatabaseMigrationEdgeCaseTests.swift",
  "ios/BideTests/RebuildDatabaseFailureTests.swift",
  "ios/BideTests/ProjectImportFormatTests.swift",
  "ios/BideTests/DatasetDeletionIntegrityTests.swift",
  "ios/BideTests/InterruptedDeletionRecoveryTests.swift",
  "ios/BideTests/DataOperationSerializationTests.swift",
  "ios/BideTests/SQLExportIntegrityTests.swift",
];

for (const filePath of required) {
  assert.ok(exists(filePath), `Phase 2 integrity file is missing: ${filePath}`);
}

const workspaceStore = read("ios/BideApp/Stores/WorkspaceStore.swift");
assert.ok(!workspaceStore.includes('"xls"'), "Legacy .xls must not be copied by native project import.");
assert.ok(!workspaceStore.includes('"parquet"'), "Parquet must not be copied until native parsing exists.");
for (const supported of ['"csv"', '"tsv"', '"json"', '"xlsx"', '"txt"']) {
  assert.ok(workspaceStore.includes(supported), `Supported project import extension missing: ${supported}`);
}

const migration = read("ios/BideApp/Stores/DataWorkspaceStore+DatabaseMigration.swift");
for (const capability of [
  "isDerivedDatabaseReadyForSQL",
  "prepareDerivedDatabaseForSQLIfNeeded",
  "storedGeneration == Self.derivedDatabaseGeneration",
  "datasets.isEmpty || manager.fileExists(atPath: databaseURL.path)",
  "if datasets.isEmpty",
  "databaseURL.path + \"-wal\"",
  "databaseURL.path + \"-shm\"",
  "Could not reset the empty project's local SQL database",
  "beginDataOperation(projectID: projectID, status: \"Refreshing local SQL state…\")",
  "rebuildDatabaseWithinDataOperation(projectID: projectID)",
  "defer { endDataOperation(projectID: projectID) }",
]) {
  assert.ok(migration.includes(capability), `Derived-database migration safeguard missing: ${capability}`);
}

const store = read("ios/BideApp/Stores/DataWorkspaceStore.swift");
for (const capability of [
  "dataOperationProjects: Set<UUID>",
  "sqlOperationProjects: Set<UUID>",
  "beginDataOperation(projectID: UUID, status: String)",
  "endDataOperation(projectID: UUID)",
  "beginSQLOperation(projectID: UUID)",
  "endSQLOperation(projectID: UUID)",
  "hasActiveDataOperation(projectID: UUID)",
  "hasActiveSQLOperation(projectID: UUID)",
  "prepareDerivedDatabaseForSQLIfNeeded(projectID: projectID)",
  "rebuildDatabaseWithinDataOperation",
  "removeDerivedDatabaseFiles(at: dbURL)",
  "incomplete derived database was discarded",
  "source datasets were left unchanged",
  "databaseURL.path + \"-wal\"",
  "databaseURL.path + \"-shm\"",
  ".bide-delete-",
  "saveRegistry(originalAssets, projectID: projectID)",
  "restored the source file, registry, and derived SQL state",
  "func preview",
  "beginSQLOperation(projectID: projectID)",
]) {
  assert.ok(store.includes(capability), `Phase 2 integrity safeguard missing: ${capability}`);
}

const recovery = read("ios/BideApp/Stores/DataWorkspaceStore+DeletionRecovery.swift");
for (const capability of [
  "recoverInterruptedDatasetDeletions",
  ".bide-delete-",
  "hasActiveDataOperation(projectID: projectID)",
  "hasActiveSQLOperation(projectID: projectID)",
  "registeredByID",
  "manager.moveItem(at: staged.url, to: destination)",
  "manager.removeItem(at: staged.url)",
  ".bide-sqlite-generation",
  "manager.removeItem(at: markerURL)",
]) {
  assert.ok(recovery.includes(capability), `Interrupted-delete recovery safeguard missing: ${capability}`);
}

const exportStore = read("ios/BideApp/Stores/DataWorkspaceStore+SQLExport.swift");
for (const capability of [
  "prepareDerivedDatabaseForSQLIfNeeded(projectID: projectID)",
  "beginSQLOperation(projectID: projectID)",
  "endSQLOperation(projectID: projectID)",
  "verificationSampleCount",
  "result.isTruncated",
  "exportSummary.columns == result.columns",
  "exportSummary.sampleRows == expectedSample",
  "!result.isTruncated, exportSummary.rowCount != result.rowCount",
  "Saved-result verification could not run because the local SQL database was not ready",
  "removeFailedSavedResult",
]) {
  assert.ok(exportStore.includes(capability), `Serialized SQL export safeguard missing: ${capability}`);
}

const projectsView = read("ios/BideApp/Views/ProjectsView.swift");
for (const capability of [
  "@EnvironmentObject private var dataWorkspace: DataWorkspaceStore",
  "projectHasDatabaseWork",
  "requestProjectDeletion",
  "hasActiveDataOperation(projectID: projectID)",
  "hasActiveSQLOperation(projectID: projectID)",
  "Project Is Busy",
  "Recheck at commit time",
]) {
  assert.ok(projectsView.includes(capability), `Project-deletion safety guard missing: ${capability}`);
}

const datasetsView = read("ios/BideApp/Views/DatasetsView.swift");
for (const capability of [
  "rebuildConfirmationPresented",
  "Rebuild SQL Database?",
  "Button(\"Rebuild Database\", role: .destructive)",
  "SQL-only CREATE/INSERT/UPDATE/DELETE changes",
  "Your original dataset files are not modified",
]) {
  assert.ok(datasetsView.includes(capability), `Derived-database rebuild warning missing: ${capability}`);
}

const resultsView = read("ios/BideApp/Views/SQLResultsView.swift");
for (const capability of [
  "if !result.isReadOnly",
  "local derived SQLite database",
  "Imported CSV/XLSX/JSON source files are unchanged",
  "Rebuilding or migrating the derived database can replace SQL-only edits",
]) {
  assert.ok(resultsView.includes(capability), `Mutating-SQL persistence disclosure missing: ${capability}`);
}

const app = read("ios/BideApp/BideApp.swift");
assert.ok(
  app.includes("recoverInterruptedDatasetDeletions(projectID: projectID)"),
  "Project startup must recover interrupted dataset deletions."
);
assert.ok(
  app.indexOf("recoverInterruptedDatasetDeletions") < app.indexOf("reconcileProjectFiles") &&
    app.indexOf("reconcileProjectFiles") < app.indexOf("migrateDerivedDatabaseIfNeeded"),
  "Deletion recovery must run before source reconciliation, which must run before SQLite migration."
);

const migrationTest = read("ios/BideTests/DatabaseMigrationEdgeCaseTests.swift");
for (const regression of [
  "testEmptyDatasetRegistryRemovesStaleDerivedDatabase",
  "testMigrationCannotMutateDatabaseWhileSQLSlotIsOwned",
  "testExecuteSQLRepairsStaleGenerationBeforeRunningQuery",
  "isDerivedDatabaseReadyForSQL",
  "XCTAssertEqual(blockedGeneration, \"1\")",
  "XCTAssertEqual(migratedGeneration, \"2\")",
  "XCTAssertEqual(store.lastSQLRun?.primaryResult?.rows.first?.first ?? nil, \"2\")",
  "OLD",
]) {
  assert.ok(migrationTest.includes(regression), `Migration regression missing: ${regression}`);
}

const rebuildFailureTest = read("ios/BideTests/RebuildDatabaseFailureTests.swift");
for (const regression of [
  "testFailedRebuildDiscardsPartialDatabaseAndPreservesSources",
  'try "a,b\\n1,2,3\\n".write',
  "incomplete derived database was discarded",
  "XCTAssertTrue(manager.fileExists(atPath: validURL.path))",
  "XCTAssertTrue(manager.fileExists(atPath: invalidURL.path))",
  "XCTAssertFalse(manager.fileExists(atPath: databaseURL.path))",
]) {
  assert.ok(rebuildFailureTest.includes(regression), `Failed-rebuild regression missing: ${regression}`);
}

const projectImportTest = read("ios/BideTests/ProjectImportFormatTests.swift");
for (const regression of [
  "testProjectImportSkipsUnsupportedXLSAndParquetFiles",
  "legacy.xls",
  "unsupported.parquet",
  "XCTAssertFalse",
]) {
  assert.ok(projectImportTest.includes(regression), `Project-format regression missing: ${regression}`);
}

const deletionTest = read("ios/BideTests/DatasetDeletionIntegrityTests.swift");
for (const regression of [
  "testDeleteDatasetRemovesSourceRegistryAndDerivedTable",
  "testDeleteDatasetRollsBackWhenSQLCleanupFails",
  "restored the source file, registry, and derived SQL state",
  "XCTAssertTrue(manager.fileExists(atPath: fixture.sourceURL.path))",
  "XCTAssertThrowsError",
  ".bide-delete-",
]) {
  assert.ok(deletionTest.includes(regression), `Dataset-deletion regression missing: ${regression}`);
}

const recoveryTest = read("ios/BideTests/InterruptedDeletionRecoveryTests.swift");
for (const regression of [
  "testRecoveryRestoresStagedSourceWhenRegistryStillOwnsAsset",
  "testRecoveryFinishesCommittedDeletionAndForcesEmptyDatabaseMigration",
  "testRecoveryDoesNotTouchStagedFileOwnedByLiveDataOperation",
  "recoverInterruptedDatasetDeletions",
  "XCTAssertFalse(store.recoverInterruptedDatasetDeletions(projectID: projectID))",
  "XCTAssertTrue(manager.fileExists(atPath: stagedURL.path))",
]) {
  assert.ok(recoveryTest.includes(regression), `Interrupted-delete recovery regression missing: ${regression}`);
}

const serializationTest = read("ios/BideTests/DataOperationSerializationTests.swift");
for (const regression of [
  "testImportRefusesToStartWhileSQLIsRunning",
  "testSQLRefusesToStartWhileDatabaseMutationIsOwned",
  "testSwitchingProjectsDoesNotForgetSQLOperationOwnership",
  "testPreviewOwnsTheSameSQLSlotAsEditorQueries",
  "store.openProject(projectB)",
  "store.openProject(projectA)",
  "XCTAssertTrue(store.isRunningSQL)",
]) {
  assert.ok(serializationTest.includes(regression), `Operation-serialization regression missing: ${regression}`);
}

const exportTest = read("ios/BideTests/SQLExportIntegrityTests.swift");
for (const regression of [
  "testNonTruncatedExportRefusesStaleRowCountEvenWhenOriginalSampleStillMatches",
  "testNonTruncatedExportVerifiesValuesBeyondFirstHundredRows",
  "testExportRefusesWhileDatasetMutationOwnsProject",
  "changed_tail",
  "CSV row count no longer matches the SQL result",
  "CSV values no longer match the SQL result",
  "Finish the current dataset or SQL operation before exporting this result",
]) {
  assert.ok(exportTest.includes(regression), `SQL-export integrity regression missing: ${regression}`);
}

console.log("bIDE iOS Phase 2 integrity cleanup validation passed.");
