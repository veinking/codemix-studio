import Foundation
import XCTest
@testable import bIDE

final class CurrentGenerationSchemaDriftTests: XCTestCase {
    private let sourceCSV = """
    order_id,customer_id,order_total
    O1001,C001,49.0
    O1002,C002,30.0
    """

    @MainActor
    func testCurrentGenerationSchemaDriftIsRebuiltEvenWhenRowCountsMatch() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        let sourceURL = dataDirectory.appendingPathComponent("Orders.csv")
        try sourceCSV.write(to: sourceURL, atomically: true, encoding: .utf8)
        let parsed = try XCTUnwrap(DatasetParser.parse(url: sourceURL, format: .csv).first)

        let registeredTable = DatasetTableDescriptor(
            displayName: parsed.displayName,
            sqliteName: "orders",
            rowCount: parsed.rows.count,
            columns: parsed.columns
        )
        let asset = DatasetAsset(
            fileName: sourceURL.lastPathComponent,
            relativePath: "data/\(sourceURL.lastPathComponent)",
            format: .csv,
            sizeBytes: Int64(sourceCSV.utf8.count),
            tables: [registeredTable]
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        try encoder.encode([asset]).write(
            to: projectDirectory.appendingPathComponent("datasets.bide.json"),
            options: .atomic
        )

        // Reproduce a subtler stale-state variant: the generation marker and row count are
        // both current, but the physical SQLite schema does not match the authoritative
        // source/registry. A row-count-only readiness check would incorrectly trust this.
        let staleColumns = [
            DatasetColumn(name: "order_id", type: .text),
            DatasetColumn(name: "customer_code", type: .text),
            DatasetColumn(name: "order_total", type: .real),
        ]
        let staleTable = ParsedDatasetTable(
            displayName: parsed.displayName,
            sourceSheetName: parsed.sourceSheetName,
            columns: staleColumns,
            rows: parsed.rows
        )
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        try SQLiteProjectEngine.importTable(
            databaseURL: databaseURL,
            sqliteName: registeredTable.sqliteName,
            table: staleTable
        )
        try "3".write(
            to: dataDirectory.appendingPathComponent(".bide-sqlite-generation"),
            atomically: true,
            encoding: .utf8
        )

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.isDerivedDatabaseReadyForSQL(projectID: projectID))

        await store.executeSQL(
            "SELECT order_id, customer_id, order_total FROM \"orders\" ORDER BY order_id;",
            projectID: projectID
        )

        XCTAssertNil(store.sqlError)
        XCTAssertNil(store.dataError)
        let result = try XCTUnwrap(store.lastSQLRun?.primaryResult)
        XCTAssertEqual(result.columns, ["order_id", "customer_id", "order_total"])
        XCTAssertEqual(result.rows.count, 2)
        XCTAssertEqual(result.rows[0][0], "O1001")
        XCTAssertEqual(result.rows[0][1], "C001")
        XCTAssertEqual(result.rows[0][2], "49.0")
        XCTAssertEqual(result.rows[1][1], "C002")
    }
}
