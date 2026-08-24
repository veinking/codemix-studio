import Foundation
import XCTest
@testable import bIDE

final class DatabaseMigrationEdgeCaseTests: XCTestCase {
    @MainActor
    func testEmptyDatasetRegistryRemovesStaleDerivedDatabase() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        let markerURL = dataDirectory.appendingPathComponent(".bide-sqlite-generation")

        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        _ = try SQLiteProjectEngine.execute(
            databaseURL: databaseURL,
            sql: "CREATE TABLE ghost_table (value TEXT); INSERT INTO ghost_table VALUES ('stale');"
        )
        XCTAssertTrue(manager.fileExists(atPath: databaseURL.path))

        // No datasets.bide.json is created, so the registry is intentionally empty.
        try "1".write(to: markerURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.datasets.isEmpty)

        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)

        XCTAssertNil(store.dataError)
        XCTAssertFalse(manager.fileExists(atPath: databaseURL.path))
        XCTAssertFalse(manager.fileExists(atPath: databaseURL.path + "-wal"))
        XCTAssertFalse(manager.fileExists(atPath: databaseURL.path + "-shm"))

        let generation = try String(contentsOf: markerURL, encoding: .utf8)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertEqual(generation, "2")
    }
}
