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

        XCTAssertTrue(store.beginSQLOperation(projectID: projectID))
        XCTAssertTrue(store.isRunningSQL)
        defer { store.endSQLOperation(projectID: projectID) }

        let incoming = manager.temporaryDirectory
            .appendingPathComponent("blocked-import-\(UUID().uuidString).csv")
        try "id,value\n1,blocked\n".write(to: incoming, atomically: true, encoding: .utf8)
        defer { try? manager.removeItem(at: incoming) }

        await store.importDatasets([incoming], projectID: projectID)
        XCTAssertEqual(store.dataError, "Finish the current SQL run before importing another dataset.")
        XCTAssertTrue(store.datasets.isEmpty)
    }

    @MainActor
    func testSQLRefusesToStartWhileDatabaseMutationIsOwned() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        let store = DataWorkspaceStore()
        store.openProject(projectID)

        XCTAssertTrue(store.beginDataOperation(projectID: projectID, status: "Test mutation…"))
        XCTAssertTrue(store.isImporting)
        defer { store.endDataOperation(projectID: projectID) }

        await store.executeSQL("SELECT 1;", projectID: projectID)
        XCTAssertEqual(store.sqlError, "Finish the current dataset operation before running SQL.")
        XCTAssertNil(store.lastSQLRun)
    }

    @MainActor
    func testSwitchingProjectsDoesNotForgetSQLOperationOwnership() async throws {
        let projectA = UUID()
        let projectB = UUID()
        let manager = FileManager.default
        let urlsA = try projectURLs(projectID: projectA)
        let urlsB = try projectURLs(projectID: projectB)
        try manager.createDirectory(at: urlsA.dataDirectory, withIntermediateDirectories: true)
        try manager.createDirectory(at: urlsB.dataDirectory, withIntermediateDirectories: true)
        defer {
            try? manager.removeItem(at: urlsA.projectDirectory)
            try? manager.removeItem(at: urlsB.projectDirectory)
        }

        let store = DataWorkspaceStore()
        store.openProject(projectA)
        XCTAssertTrue(store.beginSQLOperation(projectID: projectA))
        XCTAssertTrue(store.isRunningSQL)

        store.openProject(projectB)
        XCTAssertFalse(store.isRunningSQL)

        store.openProject(projectA)
        XCTAssertTrue(store.isRunningSQL)

        let incoming = manager.temporaryDirectory
            .appendingPathComponent("project-switch-blocked-\(UUID().uuidString).csv")
        try "id,value\n1,blocked\n".write(to: incoming, atomically: true, encoding: .utf8)
        defer { try? manager.removeItem(at: incoming) }

        await store.importDatasets([incoming], projectID: projectA)
        XCTAssertEqual(store.dataError, "Finish the current SQL run before importing another dataset.")
        XCTAssertTrue(store.datasets.isEmpty)

        store.endSQLOperation(projectID: projectA)
        XCTAssertFalse(store.isRunningSQL)
    }

    @MainActor
    func testPreviewOwnsTheSameSQLSlotAsEditorQueries() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let urls = try projectURLs(projectID: projectID)
        try manager.createDirectory(at: urls.dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: urls.projectDirectory) }

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.beginSQLOperation(projectID: projectID))
        defer { store.endSQLOperation(projectID: projectID) }

        let table = DatasetTableDescriptor(
            displayName: "blocked_preview",
            sqliteName: "blocked_preview",
            rowCount: 0,
            columns: [DatasetColumn(name: "id", type: .integer)]
        )

        let preview = await store.preview(table, projectID: projectID)
        XCTAssertNil(preview)
        XCTAssertEqual(store.dataError, "Finish the current dataset or SQL operation before loading a preview.")
    }
}
