import Foundation
import XCTest
@testable import bIDE

final class SQLExportLimitTests: XCTestCase {
    func testFullCSVExportIsNotLimitedTo500RowPreview() throws {
        let root = FileManager.default.temporaryDirectory
            .appendingPathComponent("bide-full-export-regression-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }

        let rows: [[String?]] = (1...650).map { index in
            [String(index), "row_\(index)"]
        }
        let table = ParsedDatasetTable(
            displayName: "large_result",
            sourceSheetName: nil,
            columns: [
                DatasetColumn(name: "id", type: .integer),
                DatasetColumn(name: "label", type: .text),
            ],
            rows: rows
        )

        let databaseURL = root.appendingPathComponent("large.sqlite")
        try SQLiteProjectEngine.importTable(
            databaseURL: databaseURL,
            sqliteName: "large_result",
            table: table
        )

        let sql = "SELECT * FROM \"large_result\" ORDER BY id;"
        let previewReport = try SQLiteProjectEngine.execute(
            databaseURL: databaseURL,
            sql: sql,
            rowLimit: 500
        )
        let preview = try XCTUnwrap(previewReport.primaryResult)
        XCTAssertEqual(preview.rows.count, 500)
        XCTAssertEqual(preview.rowCount, 500)
        XCTAssertTrue(preview.isTruncated)
        XCTAssertEqual(preview.rows.first?[0], "1")
        XCTAssertEqual(preview.rows.last?[0], "500")

        let exportURL = root.appendingPathComponent("large-result.csv")
        let summary = try SQLiteProjectEngine.exportReadOnlyQueryToCSV(
            databaseURL: databaseURL,
            sql: sql,
            outputURL: exportURL,
            sampleLimit: 100
        )

        XCTAssertEqual(summary.rowCount, 650)
        XCTAssertEqual(summary.columns, ["id", "label"])
        XCTAssertEqual(summary.sampleRows.count, 100)
        XCTAssertEqual(summary.sampleRows.first?[0], "1")
        XCTAssertEqual(summary.sampleRows.last?[0], "100")

        let roundTrip = try XCTUnwrap(DatasetParser.parse(url: exportURL, format: .csv).first)
        XCTAssertEqual(roundTrip.columns.count, 2)
        XCTAssertEqual(roundTrip.rows.count, 650)
        XCTAssertEqual(roundTrip.rows.first?[0], "1")
        XCTAssertEqual(roundTrip.rows.last?[0], "650")
        XCTAssertEqual(roundTrip.rows.last?[1], "row_650")
    }
}
