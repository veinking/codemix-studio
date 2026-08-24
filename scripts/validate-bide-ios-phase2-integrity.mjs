import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const exists = (path) => fs.existsSync(path);
const requireFile = (path) => assert.ok(exists(path), `Missing Phase 2 integrity file: ${path}`);
const requireTokens = (path, tokens) => {
  const source = read(path);
  for (const token of tokens) {
    assert.ok(source.includes(token), `${path} is missing integrity capability: ${token}`);
  }
  return source;
};

const files = [
  "ios/BideApp/Models/DatasetModels.swift",
  "ios/BideApp/Data/SQLiteProjectEngine.swift",
  "ios/BideApp/Stores/WorkspaceStore.swift",
  "ios/BideApp/Stores/DataWorkspaceStore.swift",
  "ios/BideApp/Stores/DataWorkspaceStore+DatabaseMigration.swift",
  "ios/BideApp/Stores/DataWorkspaceStore+DeletionRecovery.swift",
  "ios/BideApp/Stores/DataWorkspaceStore+SavedResultRecovery.swift",
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
  "ios/BideTests/SavedResultRecoveryTests.swift",
  "ios/BideTests/DataOperationSerializationTests.swift",
  "ios/BideTests/SQLExportIntegrityTests.swift",
  "ios/BideTests/LargeSavedResultIntegrityTests.swift",
];
files.forEach(requireFile);

const workspace = read("ios/BideApp/Stores/WorkspaceStore.swift");
assert.ok(!workspace.includes('"xls"'), "Native project import must not advertise legacy .xls support.");
assert.ok(!workspace.includes('"parquet"'), "Native project import must not advertise Parquet support yet.");

requireTokens("ios/BideApp/Stores/DataWorkspaceStore.swift", [
  "dataOperationProjects: Set<UUID>",
  "sqlOperationProjects: Set<UUID>",
  "beginDataOperation(projectID:",
  "beginSQLOperation(projectID:",
  "prepareDerivedDatabaseForSQLIfNeeded(projectID:",
  "rebuildDatabaseWithinDataOperation",
  ".bide-delete-",
]);

requireTokens("ios/BideApp/Stores/DataWorkspaceStore+DatabaseMigration.swift", [
  "isDerivedDatabaseReadyForSQL",
  "prepareDerivedDatabaseForSQLIfNeeded",
  ".bide-sqlite-generation",
  "refreshDatasetRegistryFromSourceAssets",
  "rebuildDatabaseWithinDataOperation",
]);

requireTokens("ios/BideApp/Stores/DataWorkspaceStore+DeletionRecovery.swift", [
  "recoverInterruptedDatasetDeletions",
  ".bide-delete-",
  ".bide-sqlite-generation",
]);

requireTokens("ios/BideApp/Stores/DataWorkspaceStore+SavedResultRecovery.swift", [
  "pendingSavedResultMarkerPrefix",
  "beginSavedResultVerification",
  "commitSavedResultVerification",
  "recoverInterruptedSavedResults",
  "savedResultFileName",
  '"pending"',
  '"verified"',
]);

requireTokens("ios/BideApp/Models/DatasetModels.swift", [
  "SQLQueryIntegritySummary",
  "SQLCSVExportSummary",
  "valueFingerprint: UInt64",
]);

requireTokens("ios/BideApp/Data/SQLiteProjectEngine.swift", [
  "StableRowFingerprint",
  "exportReadOnlyQueryToCSV",
  "integritySummaryForReadOnlyQuery",
  "fingerprint.append(row: row)",
]);

requireTokens("ios/BideApp/Stores/DataWorkspaceStore+SQLExport.swift", [
  "verificationSampleCount",
  "exportSummary.columns == result.columns",
  "exportSummary.sampleRows == expectedSample",
  "beginSavedResultVerification",
  "integritySummaryForReadOnlyQuery",
  "valueFingerprint == exportSummary.valueFingerprint",
  "ORDER BY rowid",
  "commitSavedResultVerification",
  "rejectUnverifiedSavedResult",
  "remains marked pending",
]);

const app = requireTokens("ios/BideApp/BideApp.swift", [
  "recoverInterruptedDatasetDeletions",
  "recoverInterruptedSavedResults",
  "reconcileProjectFiles",
  "migrateDerivedDatabaseIfNeeded",
]);
assert.ok(
  app.indexOf("recoverInterruptedDatasetDeletions") < app.indexOf("recoverInterruptedSavedResults") &&
    app.indexOf("recoverInterruptedSavedResults") < app.indexOf("reconcileProjectFiles") &&
    app.indexOf("reconcileProjectFiles") < app.indexOf("migrateDerivedDatabaseIfNeeded"),
  "Startup recovery order must be delete recovery → saved-result recovery → source reconciliation → SQLite migration."
);

requireTokens("ios/BideApp/Views/ProjectsView.swift", [
  "projectHasDatabaseWork",
  "Project Is Busy",
  "hasActiveDataOperation",
  "hasActiveSQLOperation",
]);
requireTokens("ios/BideApp/Views/DatasetsView.swift", [
  "Rebuild SQL Database?",
  "SQL-only CREATE/INSERT/UPDATE/DELETE changes",
  "Your original dataset files are not modified",
]);
requireTokens("ios/BideApp/Views/SQLResultsView.swift", [
  "local derived SQLite database",
  "Imported CSV/XLSX/JSON source files are unchanged",
]);

const regressions = [
  ["ios/BideTests/DatabaseMigrationEdgeCaseTests.swift", "testExecuteSQLRepairsStaleGenerationBeforeRunningQuery"],
  ["ios/BideTests/RebuildDatabaseFailureTests.swift", "testFailedRebuildDiscardsPartialDatabaseAndPreservesSources"],
  ["ios/BideTests/ProjectImportFormatTests.swift", "testProjectImportSkipsUnsupportedXLSAndParquetFiles"],
  ["ios/BideTests/DatasetDeletionIntegrityTests.swift", "testDeleteDatasetRollsBackWhenSQLCleanupFails"],
  ["ios/BideTests/InterruptedDeletionRecoveryTests.swift", "testRecoveryDoesNotTouchStagedFileOwnedByLiveDataOperation"],
  ["ios/BideTests/SavedResultRecoveryTests.swift", "testPendingSavedResultIsRemovedAndDerivedDatabaseIsRebuiltFromRemainingRegistry"],
  ["ios/BideTests/SavedResultRecoveryTests.swift", "testVerifiedSavedResultSurvivesRecoveryAndOnlyMarkerIsRemoved"],
  ["ios/BideTests/SavedResultRecoveryTests.swift", "testRecoveryDoesNotDeleteManualFileThatOnlySharesTokenPrefix"],
  ["ios/BideTests/DataOperationSerializationTests.swift", "testSwitchingProjectsDoesNotForgetSQLOperationOwnership"],
  ["ios/BideTests/SQLExportIntegrityTests.swift", "testSaveResultAsDatasetCommitsVerificationAndLeavesNoPendingMarker"],
  ["ios/BideTests/LargeSavedResultIntegrityTests.swift", "testTruncatedPreviewSaveVerifiesAndPersistsAllSixHundredFiftyRows"],
  ["ios/BideTests/LargeSavedResultIntegrityTests.swift", "testStreamingFingerprintDetectsTailMutationBeyondPreviewLimit"],
];
for (const [path, testName] of regressions) {
  assert.ok(read(path).includes(testName), `Missing native integrity regression: ${testName}`);
}

console.log("bIDE iOS Phase 2 integrity validation passed.");
