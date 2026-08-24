import Foundation
import XCTest
@testable import bIDE

final class DatabaseMigrationEdgeCaseTests: XCTestCase {
    private func projectURLs(projectID: UUID) throws -> (
        projectDirectory: URL,
        dataDirectory: URL,
        databaseURL: URL,
        markerURL: URL,
        registryURL: URL
    ) {
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        return (
            projectDirectory,
            dataDirectory,
            dataDirectory.appendingPathComponent(".bide.sqlite"),
            dataDirectory.appendingPathComponent(".bide-sqlite-generation"),
            projectDirectory.appendingPathComponent("datasets.bide.json")
        )
    }

    @MainActor
    func testEmptyDatasetRegistryRemovesStaleDerivedDatabase() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)

        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        _ = try SQLiteProjectEngine.execute(
            databaseURL: urls.databaseURL,
            sql: "CREATE TABLE ghost_table (value TEXT); INSERT INTO ghost_table VALUES ('stale');"
        )
        XCTAssertTrue(manager.fileExists(atPath: urls.databaseURL.path))

        // No datasets.bide.json is created, so the registry is intentionally empty.
        try "1".write(to: urls.markerURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.datasets.isEmpty)

        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)

        XCTAssertNil(store.dataError)
        XCTAssertFalse(manager.fileExists(atPath: urls.databaseURL.path))
        XCTAssertFalse(manager.fileExists(atPath: urls.databaseURL.path + "-wal"))
        XCTAssertFalse(manager.fileExists(atPath: urls.databaseURL.path + "-shm"))

        let generation = try String(contentsOf: urls.markerURL, encoding: .utf8)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertEqual(generation, "2")
    }

    @MainActor
    func testMigrationCannotMutateDatabaseWhileSQLSlotIsOwned() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        _ = try SQLiteProjectEngine.execute(
            databaseURL: urls.databaseURL,
            sql: "CREATE TABLE ghost_table (value TEXT); INSERT INTO ghost_table VALUES ('stale');"
        )
        try "1".write(to: urls.markerURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.beginSQLOperation(projectID: projectID))

        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)

        XCTAssertTrue(manager.fileExists(atPath: urls.databaseURL.path))
        let blockedGeneration = try String(contentsOf: urls.markerURL, encoding: .utf8)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertEqual(blockedGeneration, "1")

        store.endSQLOperation(projectID: projectID)
        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)

        XCTAssertFalse(manager.fileExists(atPath: urls.databaseURL.path))
        let migratedGeneration = try String(contentsOf: urls.markerURL, encoding: .utf8)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertEqual(migratedGeneration, "2")
    }

    @MainActor
    func testExecuteSQLRepairsStaleGenerationBeforeRunningQuery() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        let sourceURL = urls.dataDirectory.appendingPathComponent("orders.csv")
        try "order_id,value\nO1,source-one\nO2,source-two\n".write(
            to: sourceURL,
            atomically: true,
            encoding: .utf8
        )
        let parsed = try XCTUnwrap(DatasetParser.parse(url: sourceURL, format: .csv).first)
        let asset = DatasetAsset(
            fileName: "orders.csv",
            relativePath: "data/orders.csv",
            format: .csv,
            sizeBytes: Int64((try Data(contentsOf: sourceURL)).count),
            tables: [
                DatasetTableDescriptor(
                    displayName: "orders",
                    sqliteName: "orders",
                    rowCount: parsed.rows.count,
                    columns: parsed.columns
                )
            ]
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        try encoder.encode([asset]).write(to: urls.registryURL, options: .atomic)

        // Simulate an older/corrupt derived database. The visible source-of-truth CSV has
        // two rows, while the stale SQLite table contains one unrelated row.
        _ = try SQLiteProjectEngine.execute(
            databaseURL: urls.databaseURL,
            sql: "CREATE TABLE orders (order_id TEXT, value TEXT); INSERT INTO orders VALUES ('OLD', 'stale');"
        )
        try "1".write(to: urls.markerURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertFalse(store.isDerivedDatabaseReadyForSQL(projectID: projectID))

        await store.executeSQL(
            "SELECT COUNT(*) AS row_count FROM \"orders\";",
            projectID: projectID
        )

        XCTAssertNil(store.sqlError)
        XCTAssertNil(store.dataError)
        XCTAssertTrue(store.isDerivedDatabaseReadyForSQL(projectID: projectID))
        XCTAssertEqual(store.lastSQLRun?.primaryResult?.rows.first?.first ?? nil, "2")

        let generation = try String(contentsOf: urls.markerURL, encoding: .utf8)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertEqual(generation, "2")

        let repairedRows = try SQLiteProjectEngine.execute(
            databaseURL: urls.databaseURL,
            sql: "SELECT order_id, value FROM \"orders\" ORDER BY order_id;"
        ).primaryResult?.rows
        XCTAssertEqual(repairedRows, [["O1", "source-one"], ["O2", "source-two"]])
    }
}
