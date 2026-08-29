import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("ios/BideApp/Stores/DataWorkspaceStore+DatabaseMigration.swift", "utf8");
const migrationTests = fs.readFileSync("ios/BideTests/DatabaseMigrationFailureTests.swift", "utf8");
const deletion = fs.readFileSync("ios/BideApp/Stores/DataWorkspaceStore+SafeDeletion.swift", "utf8");
const datasetsView = fs.readFileSync("ios/BideApp/Views/DatasetsView.swift", "utf8");
const deletionTestsPath = "ios/BideTests/DatasetDeletionTests.swift";
const deletionTests = fs.existsSync(deletionTestsPath) ? fs.readFileSync(deletionTestsPath, "utf8") : "";

for (const required of [
  "strictRegistryAssetsIfPresent(",
  "projectDirectory: projectDirectory",
  "sourceURL.path.hasPrefix(projectPrefix)",
  ".isRegularFileKey",
  "invalidateDerivedDatabase",
  'databaseURL.path + "-wal"',
  'databaseURL.path + "-shm"',
  "Derived SQL was disabled",
  "no authoritative registered datasets",
]) {
  assert.ok(migration.includes(required), `Dataset authority guard missing: ${required}`);
}

assert.ok(
  migration.indexOf("strictRegistryAssetsIfPresent(") <
    migration.indexOf("guard storedGeneration != Self.derivedDatabaseGeneration || !databaseExists else { return }"),
  "Registry and source authority must be verified before the current-generation SQLite fast path."
);
assert.ok(
  migration.indexOf("if datasets.isEmpty") <
    migration.indexOf("guard storedGeneration != Self.derivedDatabaseGeneration || !databaseExists else { return }"),
  "Orphan derived SQL must be invalidated before the current-generation fast path."
);

for (const regression of [
  "testCorruptRegistryIsRejectedEvenWhenDerivedDatabaseGenerationIsCurrent",
  "testMissingRegisteredSourceInvalidatesCurrentDerivedDatabase",
  "testOrphanCurrentGenerationDatabaseIsRemovedBeforeSourceReconciliation",
  "A corrupt authoritative registry must invalidate the derived SQLite database",
  "A missing authoritative source must invalidate stale derived SQL",
  "Fail-closed validation must not rewrite or reconcile over the damaged registry",
  "Authority failure must not silently rewrite the user's dataset registry",
  "Reconciliation should rebuild SQLite only from the real source file after orphan cleanup",
]) {
  assert.ok(migrationTests.includes(regression), `Dataset authority regression missing: ${regression}`);
}

for (const required of [
  "deleteDatasetSafely",
  "writeDatasetRegistrySnapshot(updatedAssets, to: registryURL)",
  "dropDatasetTablesTransactionally",
  "BEGIN IMMEDIATE TRANSACTION;",
  "COMMIT;",
  "restoreDatasetRegistrySnapshot",
  "await rebuildDatabase(projectID: projectID)",
  "await reconcileProjectFiles(projectID: projectID)",
  "manager.removeItem(at: sourceURL)",
]) {
  assert.ok(deletion.includes(required), `Recoverable dataset deletion guard missing: ${required}`);
}

const registryCommit = deletion.indexOf("writeDatasetRegistrySnapshot(updatedAssets, to: registryURL)");
const sqlDrop = deletion.indexOf("try await dropDatasetTablesTransactionally(");
const sourceDelete = deletion.indexOf("try manager.removeItem(at: sourceURL)");
assert.ok(
  registryCommit >= 0 && registryCommit < sqlDrop && sqlDrop < sourceDelete,
  "Dataset deletion must commit registry metadata first, drop SQL transactionally second, and delete the authoritative source last."
);
assert.ok(
  datasetsView.includes("dataWorkspace.deleteDatasetSafely(asset, projectID: projectID)"),
  "The user-facing Datasets delete action must route through the recoverable deletion path."
);
assert.ok(
  !datasetsView.includes("dataWorkspace.deleteDataset(asset, projectID: projectID)"),
  "The Datasets UI must not call the legacy non-transactional delete path."
);

assert.ok(
  deletionTests.includes("testSafeDatasetDeletionRemovesRegistrySourceAndSQLTableTogether"),
  "Native deletion regression must verify registry, source, and SQLite state converge after a successful delete."
);

console.log("bIDE dataset authority, derived-SQL fail-closed, and recoverable deletion validation passed.");
