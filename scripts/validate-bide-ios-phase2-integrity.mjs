import assert from "node:assert/strict";
import fs from "node:fs";

const read = (filePath) => fs.readFileSync(filePath, "utf8");
const exists = (filePath) => fs.existsSync(filePath);

const required = [
  "ios/BideApp/Stores/WorkspaceStore.swift",
  "ios/BideApp/Stores/DataWorkspaceStore.swift",
  "ios/BideApp/Stores/DataWorkspaceStore+DatabaseMigration.swift",
  "ios/BideTests/DatabaseMigrationEdgeCaseTests.swift",
  "ios/BideTests/RebuildDatabaseFailureTests.swift",
  "ios/BideTests/ProjectImportFormatTests.swift",
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
  "if datasets.isEmpty",
  "databaseURL.path + \"-wal\"",
  "databaseURL.path + \"-shm\"",
  "Could not reset the empty project's local SQL database",
]) {
  assert.ok(migration.includes(capability), `Empty-registry migration safeguard missing: ${capability}`);
}

const store = read("ios/BideApp/Stores/DataWorkspaceStore.swift");
for (const capability of [
  "removeDerivedDatabaseFiles(at: dbURL)",
  "incomplete derived database was discarded",
  "source datasets were left unchanged",
  "databaseURL.path + \"-wal\"",
  "databaseURL.path + \"-shm\"",
]) {
  assert.ok(store.includes(capability), `Rebuild fail-closed safeguard missing: ${capability}`);
}

const emptyRegistryTest = read("ios/BideTests/DatabaseMigrationEdgeCaseTests.swift");
for (const regression of [
  "testEmptyDatasetRegistryRemovesStaleDerivedDatabase",
  "ghost_table",
  "XCTAssertFalse(manager.fileExists(atPath: databaseURL.path))",
  "XCTAssertEqual(generation, \"2\")",
]) {
  assert.ok(emptyRegistryTest.includes(regression), `Empty-registry regression missing: ${regression}`);
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

console.log("bIDE iOS Phase 2 integrity cleanup validation passed.");
