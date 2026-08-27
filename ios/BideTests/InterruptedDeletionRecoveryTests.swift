import Foundation
import XCTest
@testable import bIDE

final class InterruptedDeletionRecoveryTests: XCTestCase {
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

    private func writeRegistry(_ assets: [DatasetAsset], to url: URL) throws {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        try encoder.encode(assets).write(to: url, options: .atomic)
    }

    @MainActor
    func testRecoveryRestoresStagedSourceWhenRegistryStillOwnsAsset() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        let sourceURL = urls.dataDirectory.appendingPathComponent("orders.csv")
        try "id,value\n1,safe\n".write(to: sourceURL, atomically: true, encoding: .utf8)
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
        try writeRegistry([asset], to: urls.registryURL)
        try SQLiteProjectEngine.importTable(databaseURL: urls.databaseURL, sqliteName: "orders", table: parsed)
        try "3".write(to: urls.markerURL, atomically: true, encoding: .utf8)

        let stagedURL = urls.dataDirectory.appendingPathComponent(
            ".bide-delete-\(asset.id.uuidString)-\(UUID().uuidString)"
        )
        try manager.moveItem(at: sourceURL, to: stagedURL)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertEqual(store.datasets.map(\.id), [asset.id])

        XCTAssertTrue(store.recoverInterruptedDatasetDeletions(projectID: projectID))
        XCTAssertNil(store.dataError)
        XCTAssertTrue(manager.fileExists(atPath: sourceURL.path))
        XCTAssertFalse(manager.fileExists(atPath: stagedURL.path))
        XCTAssertFalse(manager.fileExists(atPath: urls.markerURL.path))

        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)
        XCTAssertNil(store.dataError)

        let report = try SQLiteProjectEngine.execute(
            databaseURL: urls.databaseURL,
            sql: "SELECT COUNT(*) AS row_count FROM \"orders\";"
        )
        XCTAssertEqual(report.primaryResult?.rows.first?.first ?? nil, "1")
    }

    @MainActor
    func testRecoveryFinishesCommittedDeletionAndForcesEmptyDatabaseMigration() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        let deletedAssetID = UUID()
        let stagedURL = urls.dataDirectory.appendingPathComponent(
            ".bide-delete-\(deletedAssetID.uuidString)-\(UUID().uuidString)"
        )
        try "id,value\n1,deleted\n".write(to: stagedURL, atomically: true, encoding: .utf8)
        try writeRegistry([], to: urls.registryURL)
        try "3".write(to: urls.markerURL, atomically: true, encoding: .utf8)

        _ = try SQLiteProjectEngine.execute(
            databaseURL: urls.databaseURL,
            sql: "CREATE TABLE stale_deleted_table (value TEXT); INSERT INTO stale_deleted_table VALUES ('ghost');"
        )
        XCTAssertTrue(manager.fileExists(atPath: urls.databaseURL.path))

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.datasets.isEmpty)

        XCTAssertTrue(store.recoverInterruptedDatasetDeletions(projectID: projectID))
        XCTAssertNil(store.dataError)
        XCTAssertFalse(manager.fileExists(atPath: stagedURL.path))
        XCTAssertFalse(manager.fileExists(atPath: urls.markerURL.path))

        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)
        XCTAssertNil(store.dataError)
        XCTAssertFalse(manager.fileExists(atPath: urls.databaseURL.path))

        let generation = try String(contentsOf: urls.markerURL, encoding: .utf8)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertEqual(generation, "3")
    }

    @MainActor
    func testRecoveryDoesNotTouchStagedFileOwnedByLiveDataOperation() throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        let liveAssetID = UUID()
        let stagedURL = urls.dataDirectory.appendingPathComponent(
            ".bide-delete-\(liveAssetID.uuidString)-\(UUID().uuidString)"
        )
        try "id,value\n1,still-live\n".write(to: stagedURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.beginDataOperation(projectID: projectID, status: "Deleting live fixture…"))
        defer { store.endDataOperation(projectID: projectID) }

        XCTAssertFalse(store.recoverInterruptedDatasetDeletions(projectID: projectID))
        XCTAssertNil(store.dataError)
        XCTAssertTrue(manager.fileExists(atPath: stagedURL.path))
    }

    @MainActor
    func testMalformedDeleteArtifactInvalidatesDerivedDatabaseBeforeFailing() throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        let malformedURL = urls.dataDirectory.appendingPathComponent(".bide-delete-not-a-valid-transaction")
        try "do not touch".write(to: malformedURL, atomically: true, encoding: .utf8)
        try writeRegistry([], to: urls.registryURL)
        try "3".write(to: urls.markerURL, atomically: true, encoding: .utf8)
        _ = try SQLiteProjectEngine.execute(
            databaseURL: urls.databaseURL,
            sql: "CREATE TABLE stale_table (value TEXT);"
        )

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.isDerivedDatabaseReadyForSQL(projectID: projectID))

        XCTAssertFalse(store.recoverInterruptedDatasetDeletions(projectID: projectID))
        XCTAssertTrue(manager.fileExists(atPath: malformedURL.path))
        XCTAssertFalse(manager.fileExists(atPath: urls.markerURL.path))
        XCTAssertFalse(store.isDerivedDatabaseReadyForSQL(projectID: projectID))
        XCTAssertTrue(store.dataError?.contains("unrecognized interrupted-delete file") == true)
    }

    @MainActor
    func testDuplicateDeleteArtifactsStopBeforeMovingFilesAndInvalidateSQL() throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        let assetID = UUID()
        let first = urls.dataDirectory.appendingPathComponent(
            ".bide-delete-\(assetID.uuidString)-\(UUID().uuidString)"
        )
        let second = urls.dataDirectory.appendingPathComponent(
            ".bide-delete-\(assetID.uuidString)-\(UUID().uuidString)"
        )
        try "first".write(to: first, atomically: true, encoding: .utf8)
        try "second".write(to: second, atomically: true, encoding: .utf8)
        try writeRegistry([], to: urls.registryURL)
        try "3".write(to: urls.markerURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)

        XCTAssertFalse(store.recoverInterruptedDatasetDeletions(projectID: projectID))
        XCTAssertTrue(manager.fileExists(atPath: first.path))
        XCTAssertTrue(manager.fileExists(atPath: second.path))
        XCTAssertFalse(manager.fileExists(atPath: urls.markerURL.path))
        XCTAssertTrue(store.dataError?.contains("multiple interrupted-delete copies") == true)
    }

    @MainActor
    func testSourceAndStagedConflictStopsBeforeMutationAndInvalidatesSQL() throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        let sourceURL = urls.dataDirectory.appendingPathComponent("orders.csv")
        try "id,value\n1,original\n".write(to: sourceURL, atomically: true, encoding: .utf8)
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
        try writeRegistry([asset], to: urls.registryURL)
        try "3".write(to: urls.markerURL, atomically: true, encoding: .utf8)

        let stagedURL = urls.dataDirectory.appendingPathComponent(
            ".bide-delete-\(asset.id.uuidString)-\(UUID().uuidString)"
        )
        try "id,value\n1,staged\n".write(to: stagedURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)

        XCTAssertFalse(store.recoverInterruptedDatasetDeletions(projectID: projectID))
        XCTAssertTrue(manager.fileExists(atPath: sourceURL.path))
        XCTAssertTrue(manager.fileExists(atPath: stagedURL.path))
        XCTAssertFalse(manager.fileExists(atPath: urls.markerURL.path))
        XCTAssertTrue(store.dataError?.contains("both the registered source and an interrupted-delete copy") == true)
    }
}
