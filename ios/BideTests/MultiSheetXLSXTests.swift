import Foundation
import XCTest
@testable import bIDE

final class MultiSheetXLSXTests: XCTestCase {
    private func fixtureURL() throws -> URL {
        try XCTUnwrap(
            Bundle(for: MultiSheetXLSXTests.self).url(
                forResource: "bIDE-Phase2-Test-MultiSheet",
                withExtension: "xlsx"
            )
        )
    }

    func testCanonicalWorkbookParsesInventoryAndRegionsExactly() throws {
        let tables = try DatasetParser.parse(url: fixtureURL(), format: .xlsx)
        XCTAssertEqual(tables.count, 2)

        let inventory = try XCTUnwrap(tables.first(where: { $0.sourceSheetName == "Inventory" }))
        XCTAssertEqual(inventory.displayName, "Inventory")
        XCTAssertEqual(inventory.columns.map(\.name), ["sku", "product", "category", "on_hand", "unit_cost"])
        XCTAssertEqual(inventory.rows.count, 6)
        XCTAssertEqual(inventory.rows[0], ["SKU-001", "Pocket Scanner", "Hardware", "18", "129.99"])
        XCTAssertEqual(inventory.rows[5], ["SKU-006", "Audit Session", "Services", "8", "225"])

        let regions = try XCTUnwrap(tables.first(where: { $0.sourceSheetName == "Regions" }))
        XCTAssertEqual(regions.displayName, "Regions")
        XCTAssertEqual(regions.columns.map(\.name), ["state", "region", "manager"])
        XCTAssertEqual(regions.rows.count, 3)
        XCTAssertEqual(regions.rows[0], ["VA", "Mid-Atlantic", "Alex Morgan"])
        XCTAssertEqual(regions.rows[2], ["DC", "Capital", "Robin Hayes"])
    }

    @MainActor
    func testCanonicalWorkbookImportsAsTwoQueryableSQLTables() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        await store.importDatasets([try fixtureURL()], projectID: projectID)

        XCTAssertNil(store.dataError)
        XCTAssertEqual(store.datasets.count, 1)
        let asset = try XCTUnwrap(store.datasets.first)
        XCTAssertEqual(asset.tables.count, 2)

        let inventory = try XCTUnwrap(asset.tables.first(where: { $0.sourceSheetName == "Inventory" }))
        XCTAssertEqual(inventory.sqliteName, "inventory")
        XCTAssertEqual(inventory.rowCount, 6)
        XCTAssertEqual(inventory.columns.count, 5)

        let regions = try XCTUnwrap(asset.tables.first(where: { $0.sourceSheetName == "Regions" }))
        XCTAssertEqual(regions.sqliteName, "regions")
        XCTAssertEqual(regions.rowCount, 3)
        XCTAssertEqual(regions.columns.count, 3)

        await store.executeSQL(
            "SELECT (SELECT COUNT(*) FROM \"inventory\") AS inventory_rows, (SELECT COUNT(*) FROM \"regions\") AS region_rows;",
            projectID: projectID
        )
        XCTAssertNil(store.sqlError)
        let result = try XCTUnwrap(store.lastSQLRun?.primaryResult)
        XCTAssertEqual(result.rows.first ?? [], ["6", "3"])
    }
}
