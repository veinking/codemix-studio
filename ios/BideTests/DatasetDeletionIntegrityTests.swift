import Foundation
import XCTest
@testable import bIDE

final class DatasetDeletionIntegrityTests: XCTestCase {
    private func makeProjectFixture(projectID: UUID) throws -> (
        projectDirectory: URL,
        dataDirectory: URL,
        sourceURL: URL,
        databaseURL: URL,
        registryURL: URL,
        asset: DatasetAsset
    ) {
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let sourceURL = dataDirectory.appendingPathComponent("delete-me.csv")
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        let registryURL = projectDirectory.appendingPathComponent("datasets.bide.json")

        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        try "id,value\n1,keep-me-safe\n".write(to: sourceURL, atomically: true, encoding: .utf8)

        let parsed = try XCTUnwrap(DatasetParser.parse(url: sourceURL, format: .csv).first)
        let table = DatasetTableDescriptor(
            displayName: "delete-me",
            sqliteName: "delete_me",
            rowCount: parsed.rows.count,
            columns: parsed.columns
        )
        let asset = DatasetAsset(
            fileName: sourceURL.lastPathComponent,
            relativePath: "data/\(sourceURL.lastPathComponent)",
            format: .csv,
            sizeBytes: Int64((try Data(contentsOf: sourceURL)).count),
            tables: [table]
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        try encoder.encode([asset]).write(to: registryURL, options: .atomic)

        return (projectDirectory, dataDirectory, sourceURL, databaseURL, registryURL, asset)
    }

    @MainActor
    func testDeleteDatasetRemovesSourceRegistryAndDerivedTable() async throws {
        let projectID = UUID()
        let fixture = try makeProjectFixture(projectID: projectID)
        let manager = FileManager.default
        defer { try? manager.removeItem(at: fixture.projectDirectory) }

        let parsed = try XCTUnwrap(DatasetParser.parse(url: fixture.sourceURL, format: .csv).first)
        try SQLiteProjectEngine.importTable(
            databaseURL: fixture.databaseURL,
            sqliteName: "delete_me",
            table: parsed
        )

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertEqual(store.datasets.count, 1)

        await store.deleteDataset(fixture.asset, projectID: projectID)

        XCTAssertNil(store.dataError)
        XCTAssertTrue(store.datasets.isEmpty)
        XCTAssertFalse(manager.fileExists(atPath: fixture.sourceURL.path))

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let registryData = try Data(contentsOf: fixture.registryURL)
        let assets = try decoder.decode([DatasetAsset].self, from: registryData)
        XCTAssertTrue(assets.isEmpty)

        XCTAssertThrowsError(
            try SQLiteProjectEngine.execute(
                databaseURL: fixture.databaseURL,
                sql: "SELECT * FROM \"delete_me\";"
            )
        )

        let remainingNames = try manager.contentsOfDirectory(atPath: fixture.dataDirectory.path)
        XCTAssertFalse(remainingNames.contains(where: { $0.hasPrefix(".bide-delete-") }))
    }

    @MainActor
    func testDeleteDatasetRollsBackWhenSQLCleanupFails() async throws {
        let projectID = UUID()
        let fixture = try makeProjectFixture(projectID: projectID)
        let manager = FileManager.default
        defer { try? manager.removeItem(at: fixture.projectDirectory) }

        // A directory at the SQLite file path forces sqlite3_open_v2/dropTables to fail
        // after the source has been staged and the registry has been tentatively updated.
        try manager.createDirectory(at: fixture.databaseURL, withIntermediateDirectories: false)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        await store.deleteDataset(fixture.asset, projectID: projectID)

        let error = try XCTUnwrap(store.dataError)
        XCTAssertTrue(error.contains("restored the source file, registry, and derived SQL state"))
        XCTAssertTrue(manager.fileExists(atPath: fixture.sourceURL.path))
        XCTAssertEqual(store.datasets.map(\.id), [fixture.asset.id])

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let registryData = try Data(contentsOf: fixture.registryURL)
        let restoredAssets = try decoder.decode([DatasetAsset].self, from: registryData)
        XCTAssertEqual(restoredAssets.map(\.id), [fixture.asset.id])

        let report = try SQLiteProjectEngine.execute(
            databaseURL: fixture.databaseURL,
            sql: "SELECT COUNT(*) AS row_count FROM \"delete_me\";"
        )
        let rowCount = report.primaryResult?.rows.first?.first ?? nil
        XCTAssertEqual(rowCount, "1")

        let remainingNames = try manager.contentsOfDirectory(atPath: fixture.dataDirectory.path)
        XCTAssertFalse(remainingNames.contains(where: { $0.hasPrefix(".bide-delete-") }))
    }
}
