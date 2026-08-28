import assert from "node:assert/strict";
import fs from "node:fs";

const fixturePath = "ios/BideTests/Fixtures/bIDE-Phase2-Test-MultiSheet.xlsx";
const testPath = "ios/BideTests/MultiSheetXLSXTests.swift";
const projectPath = "ios/project.yml";

for (const path of [fixturePath, testPath, projectPath]) {
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
  "- path: BideTests/Fixtures",
  "- Fixtures",
  "CURRENT_PROJECT_VERSION: 11",
]) {
  assert.ok(project.includes(required), `XcodeGen config lost required RC2/test-fixture wiring: ${required}`);
}

const test = fs.readFileSync(testPath, "utf8");
for (const required of [
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

console.log("bIDE canonical multi-sheet XLSX fixture + native regression wiring passed.");
