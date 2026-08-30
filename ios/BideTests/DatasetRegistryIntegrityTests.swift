import Foundation
import XCTest
@testable import bIDE

final class DatasetRegistryIntegrityTests: XCTestCase {
    private func projectURLs(projectID: UUID) throws -> (
        projectDirectory: URL,
        dataDirectory: URL,
        registryURL: URL,
        databaseURL: URL,
        generationURL: URL
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
            projectDirectory.appendingPathComponent("datasets.bide.json"),
            dataDirectory.appendingPathComponent(".bide.sqlite"),
            dataDirectory.appendingPathComponent(".bide-sqlite-generation")
        )
    }

    @MainActor
    func testCorruptRegistryStopsRecoveryPreservesStagedSourceAndInvalidatesSQL() throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        try "{ definitely-not-valid-json".write(to: urls.registryURL, atomically: true, encoding: .utf8)
        try "3".write(to: urls.generationURL, atomically: true, encoding: .utf8)
        _ = try SQLiteProjectEngine.execute(
            databaseURL: urls.databaseURL,
            sql: "CREATE TABLE stale_table (value TEXT); INSERT INTO stale_table VALUES ('ghost');"
        )

        let stagedURL = urls.dataDirectory.appendingPathComponent(
            ".bide-delete-\(UUID().uuidString)-\(UUID().uuidString)"
        )
        try "id,value\n1,authoritative-source\n".write(to: stagedURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertEqual(store.datasetRegistryIntegrityStatus(projectID: projectID), .unreadable)
        XCTAssertTrue(store.datasets.isEmpty)

        XCTAssertFalse(store.validateDatasetRegistryBeforeRecovery(projectID: projectID))
        XCTAssertTrue(manager.fileExists(atPath: stagedURL.path))
        XCTAssertTrue(manager.fileExists(atPath: urls.databaseURL.path))
        XCTAssertFalse(manager.fileExists(atPath: urls.generationURL.path))
        XCTAssertFalse(store.isDerivedDatabaseReadyForSQL(projectID: projectID))
        XCTAssertTrue(store.dataError?.contains("could not read this project's dataset registry") == true)
    }

    @MainActor
    func testMissingRegistryWithRecoveryArtifactPreservesFilesAndInvalidatesSQL() throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        try "3".write(to: urls.generationURL, atomically: true, encoding: .utf8)
        let stagedURL = urls.dataDirectory.appendingPathComponent(
            ".bide-delete-\(UUID().uuidString)-\(UUID().uuidString)"
        )
        try "id,value\n1,ambiguous\n".write(to: stagedURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertEqual(store.datasetRegistryIntegrityStatus(projectID: projectID), .missing)

        XCTAssertFalse(store.validateDatasetRegistryBeforeRecovery(projectID: projectID))
        XCTAssertTrue(manager.fileExists(atPath: stagedURL.path))
        XCTAssertFalse(manager.fileExists(atPath: urls.generationURL.path))
        XCTAssertTrue(store.dataError?.contains("registry is missing") == true)
    }

    @MainActor
    func testMissingRegistryWithoutRecoveryArtifactPreservesLegitimateSQLOnlyProject() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        _ = try SQLiteProjectEngine.execute(
            databaseURL: urls.databaseURL,
            sql: "CREATE TABLE scratch (value TEXT); INSERT INTO scratch VALUES ('kept');"
        )
        try "3".write(to: urls.generationURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertEqual(store.datasetRegistryIntegrityStatus(projectID: projectID), .missing)
        XCTAssertTrue(store.validateDatasetRegistryBeforeRecovery(projectID: projectID))
        XCTAssertTrue(manager.fileExists(atPath: urls.generationURL.path))
        XCTAssertTrue(store.isDerivedDatabaseReadyForSQL(projectID: projectID))

        await store.executeSQL("SELECT value FROM scratch;", projectID: projectID)
        XCTAssertNil(store.sqlError)
        XCTAssertEqual(store.lastSQLRun?.primaryResult?.rows.first?.first ?? nil, "kept")
        XCTAssertTrue(manager.fileExists(atPath: urls.databaseURL.path))
    }

    @MainActor
    func testMigrationClearsStaleErrorBeforeCommittingSuccessfulGeneration() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        let sourceURL = urls.dataDirectory.appendingPathComponent("orders.csv")
        try "id,value\n1,fresh\n".write(to: sourceURL, atomically: true, encoding: .utf8)
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
        try "1".write(to: urls.generationURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        store.dataError = "old unrelated error"

        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)

        XCTAssertNil(store.dataError)
        let generation = try String(contentsOf: urls.generationURL, encoding: .utf8)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertEqual(generation, "3")

        let report = try SQLiteProjectEngine.execute(
            databaseURL: urls.databaseURL,
            sql: "SELECT value FROM orders;"
        )
        XCTAssertEqual(report.primaryResult?.rows.first?.first ?? nil, "fresh")
    }
}
