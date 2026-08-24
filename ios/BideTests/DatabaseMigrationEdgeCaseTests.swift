import Foundation
import XCTest
@testable import bIDE

final class DatabaseMigrationEdgeCaseTests: XCTestCase {
    private func projectURLs(projectID: UUID) throws -> (
        projectDirectory: URL,
        dataDirectory: URL,
        databaseURL: URL,
        markerURL: URL
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
            dataDirectory.appendingPathComponent(".bide-sqlite-generation")
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
}
