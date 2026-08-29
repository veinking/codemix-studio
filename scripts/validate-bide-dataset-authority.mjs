import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("ios/BideApp/Stores/DataWorkspaceStore+DatabaseMigration.swift", "utf8");
const tests = fs.readFileSync("ios/BideTests/DatabaseMigrationFailureTests.swift", "utf8");

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
  assert.ok(tests.includes(regression), `Dataset authority regression missing: ${regression}`);
}

console.log("bIDE dataset authority and derived-SQL fail-closed validation passed.");
