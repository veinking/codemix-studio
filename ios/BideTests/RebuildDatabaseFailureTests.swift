import Foundation
import XCTest
@testable import bIDE

final class RebuildDatabaseFailureTests: XCTestCase {
    @MainActor
    func testFailedRebuildDiscardsPartialDatabaseAndPreservesSources() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        let registryURL = projectDirectory.appendingPathComponent("datasets.bide.json")

        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        let validURL = dataDirectory.appendingPathComponent("valid.csv")
        let invalidURL = dataDirectory.appendingPathComponent("invalid.csv")
        try "id,value\n1,ok\n".write(to: validURL, atomically: true, encoding: .utf8)
        try "a,b\n1,2,3\n".write(to: invalidURL, atomically: true, encoding: .utf8)

        let validAsset = DatasetAsset(
            fileName: "valid.csv",
            relativePath: "data/valid.csv",
            format: .csv,
            sizeBytes: 14,
            importedAt: Date(timeIntervalSince1970: 1_700_000_100),
            tables: [
                DatasetTableDescriptor(
                    displayName: "valid",
                    sqliteName: "valid",
                    rowCount: 1,
                    columns: [
                        DatasetColumn(name: "id", type: .integer),
                        DatasetColumn(name: "value", type: .text),
                    ]
                )
            ]
        )
        let invalidAsset = DatasetAsset(
            fileName: "invalid.csv",
            relativePath: "data/invalid.csv",
            format: .csv,
            sizeBytes: 12,
            importedAt: Date(timeIntervalSince1970: 1_700_000_000),
            tables: [
                DatasetTableDescriptor(
                    displayName: "invalid",
                    sqliteName: "invalid",
                    rowCount: 1,
                    columns: [
                        DatasetColumn(name: "a", type: .integer),
                        DatasetColumn(name: "b", type: .integer),
                    ]
                )
            ]
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        // Preserve this order so the valid table is created before the invalid source fails.
        try encoder.encode([validAsset, invalidAsset]).write(to: registryURL, options: .atomic)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertEqual(store.datasets.count, 2)

        await store.rebuildDatabase(projectID: projectID)

        let error = try XCTUnwrap(store.dataError)
        XCTAssertTrue(error.contains("incomplete derived database was discarded"))
        XCTAssertFalse(manager.fileExists(atPath: databaseURL.path))
        XCTAssertFalse(manager.fileExists(atPath: databaseURL.path + "-wal"))
        XCTAssertFalse(manager.fileExists(atPath: databaseURL.path + "-shm"))

        XCTAssertTrue(manager.fileExists(atPath: validURL.path))
        XCTAssertTrue(manager.fileExists(atPath: invalidURL.path))
        XCTAssertTrue(manager.fileExists(atPath: registryURL.path))

        let persistedRegistry = try Data(contentsOf: registryURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let persistedAssets = try decoder.decode([DatasetAsset].self, from: persistedRegistry)
        XCTAssertEqual(persistedAssets.map(\.fileName), ["valid.csv", "invalid.csv"])
    }
}
