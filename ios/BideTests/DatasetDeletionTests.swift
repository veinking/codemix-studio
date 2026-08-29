import Foundation
import XCTest
@testable import bIDE

final class DatasetDeletionTests: XCTestCase {
    @MainActor
    func testSafeDatasetDeletionRemovesRegistrySourceAndSQLTableTogether() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let sourceURL = dataDirectory.appendingPathComponent("delete_me.csv")
        let registryURL = projectDirectory.appendingPathComponent("datasets.bide.json")
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")

        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        try "id,value\n1,alpha\n2,beta\n".write(
            to: sourceURL,
            atomically: true,
            encoding: .utf8
        )

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        await store.reconcileProjectFiles(projectID: projectID)

        XCTAssertNil(store.dataError)
        XCTAssertEqual(store.datasets.count, 1)
        let asset = try XCTUnwrap(store.datasets.first)
        let table = try XCTUnwrap(asset.tables.first)
        XCTAssertTrue(manager.fileExists(atPath: sourceURL.path))
        XCTAssertTrue(manager.fileExists(atPath: registryURL.path))
        XCTAssertTrue(manager.fileExists(atPath: databaseURL.path))

        let tableLiteral = table.sqliteName.replacingOccurrences(of: "'", with: "''")
        let before = try SQLiteProjectEngine.execute(
            databaseURL: databaseURL,
            sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '\(tableLiteral)';"
        )
        XCTAssertEqual(before.primaryResult?.rows.count, 1)

        await store.deleteDatasetSafely(asset, projectID: projectID)

        XCTAssertNil(store.dataError)
        XCTAssertTrue(store.datasets.isEmpty)
        XCTAssertFalse(manager.fileExists(atPath: sourceURL.path))

        let registryData = try Data(contentsOf: registryURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        XCTAssertEqual(try decoder.decode([DatasetAsset].self, from: registryData), [])

        let after = try SQLiteProjectEngine.execute(
            databaseURL: databaseURL,
            sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '\(tableLiteral)';"
        )
        XCTAssertEqual(after.primaryResult?.rows.count, 0)
    }
}
