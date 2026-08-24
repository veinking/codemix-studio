import Foundation
import XCTest
@testable import bIDE

final class LargeSavedResultIntegrityTests: XCTestCase {
    @MainActor
    func testTruncatedPreviewSaveVerifiesAndPersistsAllSixHundredFiftyRows() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        let generationURL = dataDirectory.appendingPathComponent(".bide-sqlite-generation")
        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        let rows: [[String?]] = (1...650).map { index in
            [String(index), "value_\(index)"]
        }
        let table = ParsedDatasetTable(
            displayName: "large_export",
            sourceSheetName: nil,
            columns: [
                DatasetColumn(name: "id", type: .integer),
                DatasetColumn(name: "value", type: .text),
            ],
            rows: rows
        )
        try SQLiteProjectEngine.importTable(
            databaseURL: databaseURL,
            sqliteName: "large_export",
            table: table
        )
        try "2".write(to: generationURL, atomically: true, encoding: .utf8)

        let report = try SQLiteProjectEngine.execute(
            databaseURL: databaseURL,
            sql: "SELECT id, value FROM \"large_export\" ORDER BY id;",
            rowLimit: 500
        )
        let visible = try XCTUnwrap(report.primaryResult)
        XCTAssertTrue(visible.isTruncated)
        XCTAssertEqual(visible.rows.count, 500)
        XCTAssertEqual(visible.rows.first, ["1", "value_1"])
        XCTAssertEqual(visible.rows.last, ["500", "value_500"])

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        let savedCandidate = await store.exportSQLResult(
            report,
            projectID: projectID,
            registerAsDataset: true
        )
        let savedURL = try XCTUnwrap(savedCandidate)

        XCTAssertNil(store.dataError)
        let saved = try XCTUnwrap(store.datasets.first)
        XCTAssertEqual(saved.totalRows, 650)
        XCTAssertEqual(saved.tables.first?.columns.count, 2)

        let parsed = try XCTUnwrap(DatasetParser.parse(url: savedURL, format: .csv).first)
        XCTAssertEqual(parsed.rows.count, 650)
        XCTAssertEqual(parsed.rows[499], ["500", "value_500"])
        XCTAssertEqual(parsed.rows[649], ["650", "value_650"])

        let names = try manager.contentsOfDirectory(atPath: dataDirectory.path)
        XCTAssertFalse(
            names.contains { $0.hasPrefix(DataWorkspaceStore.pendingSavedResultMarkerPrefix) }
        )
    }

    func testStreamingFingerprintDetectsTailMutationBeyondPreviewLimit() throws {
        let manager = FileManager.default
        let root = manager.temporaryDirectory
            .appendingPathComponent("bide-fingerprint-\(UUID().uuidString)", isDirectory: true)
        let databaseURL = root.appendingPathComponent("fingerprint.sqlite")
        let exportURL = root.appendingPathComponent("full.csv")
        try manager.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: root) }

        let rows: [[String?]] = (1...650).map { index in
            [String(index), "value_\(index)"]
        }
        try SQLiteProjectEngine.importTable(
            databaseURL: databaseURL,
            sqliteName: "fingerprint_source",
            table: ParsedDatasetTable(
                displayName: "fingerprint_source",
                sourceSheetName: nil,
                columns: [
                    DatasetColumn(name: "id", type: .integer),
                    DatasetColumn(name: "value", type: .text),
                ],
                rows: rows
            )
        )

        let exported = try SQLiteProjectEngine.exportReadOnlyQueryToCSV(
            databaseURL: databaseURL,
            sql: "SELECT id, value FROM \"fingerprint_source\" ORDER BY id;",
            outputURL: exportURL,
            sampleLimit: 100
        )
        XCTAssertEqual(exported.rowCount, 650)

        _ = try SQLiteProjectEngine.execute(
            databaseURL: databaseURL,
            sql: "UPDATE \"fingerprint_source\" SET value = 'mutated_tail' WHERE id = 650;"
        )
        let mutated = try SQLiteProjectEngine.integritySummaryForReadOnlyQuery(
            databaseURL: databaseURL,
            sql: "SELECT id, value FROM \"fingerprint_source\" ORDER BY id;"
        )

        XCTAssertEqual(mutated.rowCount, exported.rowCount)
        XCTAssertNotEqual(mutated.valueFingerprint, exported.valueFingerprint)
    }
}
