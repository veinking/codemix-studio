import Foundation
import XCTest
@testable import bIDE

final class SQLExportIntegrityTests: XCTestCase {
    private func makeQueryFixture(projectID: UUID) throws -> (
        projectDirectory: URL,
        databaseURL: URL,
        report: SQLRunReport
    ) {
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)

        let table = ParsedDatasetTable(
            displayName: "export_fixture",
            sourceSheetName: nil,
            columns: [
                DatasetColumn(name: "id", type: .integer),
                DatasetColumn(name: "value", type: .text),
            ],
            rows: [
                ["1", "first"],
                ["2", "second"],
            ]
        )
        try SQLiteProjectEngine.importTable(
            databaseURL: databaseURL,
            sqliteName: "export_fixture",
            table: table
        )
        let report = try SQLiteProjectEngine.execute(
            databaseURL: databaseURL,
            sql: "SELECT id, value FROM \"export_fixture\" ORDER BY id;",
            rowLimit: 500
        )
        return (projectDirectory, databaseURL, report)
    }

    @MainActor
    func testNonTruncatedExportRefusesStaleRowCountEvenWhenOriginalSampleStillMatches() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let fixture = try makeQueryFixture(projectID: projectID)
        defer { try? manager.removeItem(at: fixture.projectDirectory) }

        let original = try XCTUnwrap(fixture.report.primaryResult)
        XCTAssertFalse(original.isTruncated)
        XCTAssertEqual(original.rowCount, 2)

        // Change only the tail of the query after the result was shown. Columns and the
        // original first two sampled rows still match, so exact non-truncated row-count
        // verification must be the check that refuses this stale export.
        _ = try SQLiteProjectEngine.execute(
            databaseURL: fixture.databaseURL,
            sql: "INSERT INTO \"export_fixture\" VALUES (3, 'late');"
        )

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        let exported = await store.exportSQLResult(
            fixture.report,
            projectID: projectID,
            registerAsDataset: false
        )

        XCTAssertNil(exported)
        XCTAssertEqual(
            store.dataError,
            "Export verification failed because the CSV row count no longer matches the SQL result. bIDE did not share or save the file."
        )
        XCTAssertFalse(store.isRunningSQL)
    }

    @MainActor
    func testExportRefusesWhileDatasetMutationOwnsProject() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let fixture = try makeQueryFixture(projectID: projectID)
        defer { try? manager.removeItem(at: fixture.projectDirectory) }

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.beginDataOperation(projectID: projectID, status: "Test mutation…"))
        defer { store.endDataOperation(projectID: projectID) }

        let exported = await store.exportSQLResult(
            fixture.report,
            projectID: projectID,
            registerAsDataset: false
        )

        XCTAssertNil(exported)
        XCTAssertEqual(
            store.dataError,
            "Finish the current dataset or SQL operation before exporting this result."
        )
    }
}
