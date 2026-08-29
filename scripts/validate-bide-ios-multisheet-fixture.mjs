import assert from "node:assert/strict";
import fs from "node:fs";

const fixtureDirectory = "ios/BideTests/Fixtures";
const fixturePath = `${fixtureDirectory}/bIDE-Phase2-Test-MultiSheet.xlsx`;
const testPath = "ios/BideTests/MultiSheetXLSXTests.swift";
const projectPath = "ios/project.yml";

for (const path of [fixtureDirectory, fixturePath, testPath, projectPath]) {
  assert.ok(fs.existsSync(path), `Missing canonical multi-sheet XLSX regression asset: ${path}`);
}

const fixture = fs.readFileSync(fixturePath);
assert.ok(fixture.length > 5_000, "Canonical multi-sheet XLSX fixture is unexpectedly small/truncated.");
assert.equal(fixture[0], 0x50, "XLSX fixture must begin with ZIP PK signature.");
assert.equal(fixture[1], 0x4b, "XLSX fixture must begin with ZIP PK signature.");

const project = fs.readFileSync(projectPath, "utf8");
for (const required of [
  "Runestone:",
  "TreeSitterLanguages:",
  "CoreXLSX:",
  "- Fixtures",
  "CURRENT_PROJECT_VERSION: 11",
]) {
  assert.ok(project.includes(required), `XcodeGen config lost required RC2/test-fixture wiring: ${required}`);
}

// XcodeGen target resources must be declared as target sources and explicitly placed in
// Copy Bundle Resources. A separate `resources:` target key can be silently ignored,
// leaving Bundle(for:) unable to locate the fixture even though the file exists in Git.
const legacyResourceBlock = /\n  bIDETests:[\s\S]*?\n    resources:\s*\n\s*- path: BideTests\/Fixtures/;
assert.ok(!legacyResourceBlock.test(project), "bIDETests must not use the unsupported standalone resources: block for XCTest fixtures.");

const fixtureFiles = fs.readdirSync(fixtureDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
  .map((entry) => entry.name)
  .sort();
assert.deepEqual(fixtureFiles, ["bIDE-Phase2-Test-MultiSheet.xlsx"], "Unexpected native XCTest fixture set; wire every new fixture explicitly before release.");

for (const fixtureName of fixtureFiles) {
  const expectedPath = `BideTests/Fixtures/${fixtureName}`;
  const escapedPath = expectedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const resourceSource = new RegExp(`- path: ${escapedPath}\\n\\s+buildPhase: resources`);
  assert.match(
    project,
    resourceSource,
    `XCTest fixture ${fixtureName} must be an explicit XcodeGen source with buildPhase: resources.`
  );
}

const test = fs.readFileSync(testPath, "utf8");
for (const required of [
  "Bundle(for: MultiSheetXLSXTests.self).url(",
  "testCanonicalWorkbookParsesInventoryAndRegionsExactly",
  "testCanonicalWorkbookImportsAsTwoQueryableSQLTables",
  '["sku", "product", "category", "on_hand", "unit_cost"]',
  '["state", "region", "manager"]',
  "XCTAssertEqual(inventory.rows.count, 6)",
  "XCTAssertEqual(regions.rows.count, 3)",
  'XCTAssertEqual(inventory.sqliteName, "inventory")',
  'XCTAssertEqual(regions.sqliteName, "regions")',
]) {
  assert.ok(test.includes(required), `Canonical XLSX regression lost expected assertion: ${required}`);
}

console.log("bIDE canonical multi-sheet XLSX fixture + native test-bundle wiring passed.");
