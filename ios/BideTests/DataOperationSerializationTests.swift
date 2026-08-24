import Foundation
import XCTest
@testable import bIDE

final class DataOperationSerializationTests: XCTestCase {
    private func projectURLs(projectID: UUID) throws -> (
        projectDirectory: URL,
        dataDirectory: URL,
        databaseURL: URL,
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
            projectDirectory.appendingPathComponent("datasets.bide.json")
        )
    }

    @MainActor
    func testImportRefusesToStartWhileSQLIsRunning() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        let store = DataWorkspaceStore()
        store.openProject(projectID)

        let sqlTask = Task { @MainActor in
            await store.executeSQL(
                """
                WITH RECURSIVE count_up(x) AS (
                    SELECT 1
                    UNION ALL
                    SELECT x + 1 FROM count_up WHERE x < 500000
                )
                SELECT SUM(x) AS total FROM count_up;
                """,
                projectID: projectID
            )
        }

        for _ in 0..<1_000 where !store.isRunningSQL {
            await Task.yield()
        }
        XCTAssertTrue(store.isRunningSQL)

        let incoming = manager.temporaryDirectory
            .appendingPathComponent("blocked-import-\(UUID().uuidString).csv")
        try "id,value\n1,blocked\n".write(to: incoming, atomically: true, encoding: .utf8)
        defer { try? manager.removeItem(at: incoming) }

        await store.importDatasets([incoming], projectID: projectID)
        XCTAssertEqual(store.dataError, "Finish the current SQL run before importing another dataset.")
        XCTAssertTrue(store.datasets.isEmpty)

        await sqlTask.value
        XCTAssertFalse(store.isRunningSQL)
        XCTAssertNil(store.sqlError)
    }

    @MainActor
    func testSQLRefusesToStartWhileDatabaseRebuildIsRunning() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        let sourceURL = urls.dataDirectory.appendingPathComponent("moderate.csv")
        var csv = "id,value\n"
        csv.reserveCapacity(250_000)
        for index in 1...10_000 {
            csv.append("\(index),value_\(index)\n")
        }
        try csv.write(to: sourceURL, atomically: true, encoding: .utf8)

        let parsed = try XCTUnwrap(DatasetParser.parse(url: sourceURL, format: .csv).first)
        let asset = DatasetAsset(
            fileName: sourceURL.lastPathComponent,
            relativePath: "data/\(sourceURL.lastPathComponent)",
            format: .csv,
            sizeBytes: Int64((try Data(contentsOf: sourceURL)).count),
            tables: [
                DatasetTableDescriptor(
                    displayName: "moderate",
                    sqliteName: "moderate",
                    rowCount: parsed.rows.count,
                    columns: parsed.columns
                )
            ]
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        try encoder.encode([asset]).write(to: urls.registryURL, options: .atomic)

        let store = DataWorkspaceStore()
        store.openProject(projectID)

        let rebuildTask = Task { @MainActor in
            await store.rebuildDatabase(projectID: projectID)
        }

        for _ in 0..<1_000 where !store.isImporting {
            await Task.yield()
        }
        XCTAssertTrue(store.isImporting)

        await store.executeSQL("SELECT 1;", projectID: projectID)
        XCTAssertEqual(store.sqlError, "Finish the current dataset operation before running SQL.")
        XCTAssertNil(store.lastSQLRun)

        await rebuildTask.value
        XCTAssertFalse(store.isImporting)
        XCTAssertNil(store.dataError)
    }
}
