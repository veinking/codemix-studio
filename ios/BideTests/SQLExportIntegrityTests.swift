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
        let markerURL = dataDirectory.appendingPathComponent(".bide-sqlite-generation")
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
        // These export tests model a database that has already passed the generation-2
        // migration. Tests for stale generation handling live in DatabaseMigrationEdgeCaseTests.
        try "2".write(to: markerURL, atomically: true, encoding: .utf8)

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
    func testNonTruncatedExportVerifiesValuesBeyondFirstHundredRows() async throws {
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

        let rows: [[String?]] = (1...150).map { index in
            [String(index), "value_\(index)"]
        }
        let table = ParsedDatasetTable(
            displayName: "wide_sample",
            sourceSheetName: nil,
            columns: [
                DatasetColumn(name: "id", type: .integer),
                DatasetColumn(name: "value", type: .text),
            ],
            rows: rows
        )
        try SQLiteProjectEngine.importTable(
            databaseURL: databaseURL,
            sqliteName: "wide_sample",
            table: table
        )
        try "2".write(to: markerURL, atomically: true, encoding: .utf8)

        let report = try SQLiteProjectEngine.execute(
            databaseURL: databaseURL,
            sql: "SELECT id, value FROM \"wide_sample\" ORDER BY id;",
            rowLimit: 500
        )
        let original = try XCTUnwrap(report.primaryResult)
        XCTAssertEqual(original.rowCount, 150)
        XCTAssertFalse(original.isTruncated)

        // Mutate row 150 only. Row count and the old first-100 sample are unchanged, so the
        // export must verify every non-truncated row to catch this stale tail value.
        _ = try SQLiteProjectEngine.execute(
            databaseURL: databaseURL,
            sql: "UPDATE \"wide_sample\" SET value = 'changed_tail' WHERE id = 150;"
        )

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        let exported = await store.exportSQLResult(
            report,
            projectID: projectID,
            registerAsDataset: false
        )

        XCTAssertNil(exported)
        XCTAssertEqual(
            store.dataError,
            "Export verification failed because the CSV values no longer match the SQL result. bIDE did not share or save the file."
        )
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
