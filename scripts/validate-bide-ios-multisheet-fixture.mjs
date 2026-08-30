import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";

const fixtureDirectory = "ios/BideTests/Fixtures";
const fixturePath = `${fixtureDirectory}/bIDE-Phase2-Test-MultiSheet.xlsx`;
const testPath = "ios/BideTests/MultiSheetXLSXTests.swift";
const projectPath = "ios/project.yml";
const canonicalFixtureSHA256 = "1bbc808d6539899c1a8b02ee3452faa1dd060122833e1539cfc516b8d6375d91";

for (const path of [fixtureDirectory, fixturePath, testPath, projectPath]) {
  assert.ok(fs.existsSync(path), `Missing canonical multi-sheet XLSX regression asset: ${path}`);
}

const fixture = fs.readFileSync(fixturePath);
assert.ok(fixture.length > 5_000, "Canonical multi-sheet XLSX fixture is unexpectedly small/truncated.");
assert.equal(fixture[0], 0x50, "XLSX fixture must begin with ZIP PK signature.");
assert.equal(fixture[1], 0x4b, "XLSX fixture must begin with ZIP PK signature.");
assert.equal(
  crypto.createHash("sha256").update(fixture).digest("hex"),
  canonicalFixtureSHA256,
  "Canonical multi-sheet XLSX fixture bytes changed. Revalidate the complete OOXML package and update the pinned digest intentionally."
);

// `PK` is not enough to prove an XLSX is usable. The previous RC fixture had the
// expected prefix and was copied into bIDETests.xctest, but CoreXLSX rejected it
// before worksheet parsing. Validate the complete ZIP central directory, required
// OOXML members, workbook relationships, sheet names, and canonical row data on
// Ubuntu before a paid macOS TestFlight job is allowed to start.
const pythonCheck = String.raw`
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import PurePosixPath

path = sys.argv[1]
if not zipfile.is_zipfile(path):
    raise SystemExit("Canonical XLSX fixture is not a valid ZIP archive.")

with zipfile.ZipFile(path) as archive:
    broken = archive.testzip()
    if broken is not None:
        raise SystemExit(f"Canonical XLSX fixture has a corrupt ZIP member: {broken}")

    required = {
        "[Content_Types].xml",
        "_rels/.rels",
        "xl/workbook.xml",
        "xl/_rels/workbook.xml.rels",
        "xl/worksheets/sheet1.xml",
        "xl/worksheets/sheet2.xml",
    }
    names = set(archive.namelist())
    missing = sorted(required - names)
    if missing:
        raise SystemExit(f"Canonical XLSX fixture is missing required OOXML members: {missing}")

    main_ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    doc_rel_ns = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    pkg_rel_ns = "http://schemas.openxmlformats.org/package/2006/relationships"
    ns = {"m": main_ns, "r": doc_rel_ns, "p": pkg_rel_ns}

    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    sheet_nodes = workbook.findall("m:sheets/m:sheet", ns)
    sheet_names = [node.attrib["name"] for node in sheet_nodes]
    if sheet_names != ["Inventory", "Regions"]:
        raise SystemExit(f"Canonical XLSX sheet names changed: {sheet_names}")

    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    relation_targets = {
        node.attrib["Id"]: node.attrib["Target"]
        for node in relationships.findall("p:Relationship", ns)
    }

    shared_strings = []
    if "xl/sharedStrings.xml" in names:
        shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        for item in shared_root.findall("m:si", ns):
            shared_strings.append("".join(text.text or "" for text in item.iter(f"{{{main_ns}}}t")))

    def resolve_sheet_target(target):
        if target.startswith("/"):
            return target.lstrip("/")
        return str(PurePosixPath("xl") / target)

    def column_index(reference):
        match = re.match(r"([A-Z]+)", reference)
        if not match:
            raise SystemExit(f"Invalid XLSX cell reference: {reference}")
        value = 0
        for char in match.group(1):
            value = value * 26 + (ord(char) - 64)
        return value - 1

    def cell_value(cell):
        cell_type = cell.attrib.get("t")
        if cell_type == "inlineStr":
            inline = cell.find("m:is", ns)
            if inline is None:
                return ""
            return "".join(text.text or "" for text in inline.iter(f"{{{main_ns}}}t"))

        value_node = cell.find("m:v", ns)
        value = "" if value_node is None or value_node.text is None else value_node.text
        if cell_type == "s":
            return shared_strings[int(value)]
        return value

    def rows_for(sheet_node):
        relation_id = sheet_node.attrib[f"{{{doc_rel_ns}}}id"]
        if relation_id not in relation_targets:
            raise SystemExit(f"Missing workbook relationship for {sheet_node.attrib['name']}")
        sheet_path = resolve_sheet_target(relation_targets[relation_id])
        if sheet_path not in names:
            raise SystemExit(f"Workbook relationship points to missing worksheet: {sheet_path}")

        root = ET.fromstring(archive.read(sheet_path))
        rows = []
        for row in root.findall(".//m:sheetData/m:row", ns):
            sparse = {}
            for cell in row.findall("m:c", ns):
                sparse[column_index(cell.attrib["r"])] = cell_value(cell)
            width = max(sparse.keys(), default=-1) + 1
            rows.append([sparse.get(index, "") for index in range(width)])
        return rows

    inventory = rows_for(sheet_nodes[0])
    regions = rows_for(sheet_nodes[1])

    if inventory[0] != ["sku", "product", "category", "on_hand", "unit_cost"]:
        raise SystemExit(f"Inventory headers changed: {inventory[0]}")
    if len(inventory) != 7:
        raise SystemExit(f"Inventory workbook row count changed: expected 7 including header, found {len(inventory)}")
    if inventory[1] != ["SKU-001", "Pocket Scanner", "Hardware", "18", "129.99"]:
        raise SystemExit(f"Inventory first data row changed: {inventory[1]}")
    if inventory[-1] != ["SKU-006", "Audit Session", "Services", "8", "225"]:
        raise SystemExit(f"Inventory last data row changed: {inventory[-1]}")

    if regions[0] != ["state", "region", "manager"]:
        raise SystemExit(f"Regions headers changed: {regions[0]}")
    if len(regions) != 4:
        raise SystemExit(f"Regions workbook row count changed: expected 4 including header, found {len(regions)}")
    if regions[1] != ["VA", "Mid-Atlantic", "Alex Morgan"]:
        raise SystemExit(f"Regions first data row changed: {regions[1]}")
    if regions[-1] != ["DC", "Capital", "Robin Hayes"]:
        raise SystemExit(f"Regions last data row changed: {regions[-1]}")

print("Canonical XLSX ZIP/OOXML integrity + row-content validation passed.")
`;
execFileSync("python3", ["-c", pythonCheck, fixturePath], { stdio: "inherit" });

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
