import Foundation
import XCTest
@testable import bIDE

final class JoinPipelineTests: XCTestCase {
    private let customersCSV = """
    customer_id,customer_name,state,segment,signup_date
    C001,Avery Brooks,VA,Small Business,2026-01-08
    C002,Jordan Lee,MD,Consumer,2026-01-14
    C003,Morgan Reed,DC,Enterprise,2026-01-22
    C004,Cameron Diaz,VA,Consumer,2026-02-03
    C005,Riley Chen,NC,Small Business,2026-02-11
    C006,Taylor Morgan,VA,Enterprise,2026-02-19
    C007,Parker James,MD,Consumer,2026-03-01
    C008,Casey Patel,DC,Small Business,2026-03-12
    C009,Drew Wilson,VA,Consumer,2026-03-23
    C010,Quinn Davis,NC,Enterprise,2026-04-02
    C011,Skyler Adams,VA,Small Business,2026-04-14
    C012,Reese Thompson,MD,Consumer,2026-04-28
    C013,Emerson Clark,DC,Enterprise,2026-05-09
    C014,Rowan Lewis,VA,Consumer,2026-05-21
    C015,Finley Scott,NC,Small Business,2026-06-04
    """

    private let ordersCSV = """
    order_id,customer_id,order_date,product,quantity,order_total,status
    O1001,C001,2026-05-03,Starter Plan,1,49.0,Paid
    O1002,C002,2026-05-05,Data Export,2,30.0,Paid
    O1003,C003,2026-05-07,Pro Plan,1,199.0,Paid
    O1004,C001,2026-05-18,Data Export,1,15.0,Paid
    O1005,C004,2026-05-21,Starter Plan,1,49.0,Refunded
    O1006,C005,2026-05-23,Pro Plan,1,199.0,Paid
    O1007,C006,2026-05-27,Team Seats,4,120.0,Paid
    O1008,C007,2026-06-02,Starter Plan,1,49.0,Pending
    O1009,C003,2026-06-04,Team Seats,3,90.0,Paid
    O1010,C008,2026-06-08,Data Export,3,45.0,Paid
    O1011,C009,2026-06-11,Starter Plan,1,49.0,Paid
    O1012,C010,2026-06-15,Pro Plan,1,199.0,Paid
    O1013,C001,2026-06-19,Team Seats,2,60.0,Paid
    O1014,C006,2026-06-22,Pro Plan,1,199.0,Paid
    O1015,C011,2026-06-26,Starter Plan,1,49.0,Cancelled
    O1016,C002,2026-07-01,Team Seats,2,60.0,Paid
    O1017,C005,2026-07-06,Data Export,5,75.0,Paid
    O1018,C007,2026-07-10,Starter Plan,1,49.0,Paid
    O1019,C008,2026-07-14,Pro Plan,1,199.0,Paid
    O1020,C010,2026-07-18,Team Seats,6,180.0,Paid
    O1021,C003,2026-07-22,Data Export,2,30.0,Paid
    O1022,C004,2026-07-26,Starter Plan,1,49.0,Paid
    O1023,C009,2026-08-02,Pro Plan,1,199.0,Paid
    O1024,C001,2026-08-05,Data Export,4,60.0,Paid
    O1025,C999,2026-08-09,Starter Plan,1,49.0,Paid
    O1026,C888,2026-08-12,Pro Plan,1,199.0,Pending
    O1027,C012,2026-08-16,Data Export,2,30.00,Paid
    """

    func testOrdersLeftJoinExportRoundTripPreservesRowsAndValues() throws {
        let root = FileManager.default.temporaryDirectory
            .appendingPathComponent("bide-join-regression-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }

        let customersURL = root.appendingPathComponent("bIDE_Join_Practice_Customers.csv")
        let ordersURL = root.appendingPathComponent("bIDE_Join_Practice_Orders.csv")
        try customersCSV.write(to: customersURL, atomically: true, encoding: .utf8)
        try ordersCSV.write(to: ordersURL, atomically: true, encoding: .utf8)

        let customers = try XCTUnwrap(DatasetParser.parse(url: customersURL, format: .csv).first)
        let orders = try XCTUnwrap(DatasetParser.parse(url: ordersURL, format: .csv).first)

        XCTAssertEqual(customers.columns.count, 5)
        XCTAssertEqual(customers.rows.count, 15)
        XCTAssertEqual(orders.columns.count, 7)
        XCTAssertEqual(orders.rows.count, 27)

        let databaseURL = root.appendingPathComponent("join.sqlite")
        try SQLiteProjectEngine.importTable(databaseURL: databaseURL, sqliteName: "orders", table: orders)
        try SQLiteProjectEngine.importTable(databaseURL: databaseURL, sqliteName: "customers", table: customers)

        let sql = """
        SELECT o.*, c.*
        FROM "orders" AS o
        LEFT JOIN "customers" AS c
          ON o."customer_id" = c."customer_id";
        """

        let report = try SQLiteProjectEngine.execute(databaseURL: databaseURL, sql: sql, rowLimit: 500)
        let result = try XCTUnwrap(report.primaryResult)

        XCTAssertEqual(result.columns.count, 12)
        XCTAssertEqual(result.rows.count, 27)
        XCTAssertFalse(result.isTruncated)

        let c999 = try XCTUnwrap(result.rows.first(where: { $0.first ?? nil == "O1025" }))
        XCTAssertEqual(c999[1], "C999")
        XCTAssertNil(c999[7])
        XCTAssertNil(c999[8])
        XCTAssertNil(c999[9])
        XCTAssertNil(c999[10])
        XCTAssertNil(c999[11])

        let c888 = try XCTUnwrap(result.rows.first(where: { $0.first ?? nil == "O1026" }))
        XCTAssertEqual(c888[1], "C888")
        XCTAssertNil(c888[7])

        let firstOrder = try XCTUnwrap(result.rows.first(where: { $0.first ?? nil == "O1001" }))
        XCTAssertEqual(firstOrder[1], "C001")
        XCTAssertEqual(firstOrder[3], "Starter Plan")
        XCTAssertEqual(firstOrder[4], "1")
        XCTAssertEqual(firstOrder[5], "49.0")
        XCTAssertEqual(firstOrder[7], "C001")
        XCTAssertEqual(firstOrder[8], "Avery Brooks")

        let exportURL = root.appendingPathComponent("join-result.csv")
        let exportSummary = try SQLiteProjectEngine.exportReadOnlyQueryToCSV(
            databaseURL: databaseURL,
            sql: sql,
            outputURL: exportURL,
            sampleLimit: 100
        )

        XCTAssertEqual(exportSummary.rowCount, 27)
        XCTAssertEqual(exportSummary.columns, result.columns)
        XCTAssertEqual(exportSummary.sampleRows, result.rows)

        let roundTrip = try XCTUnwrap(DatasetParser.parse(url: exportURL, format: .csv).first)
        XCTAssertEqual(roundTrip.rows.count, 27)
        XCTAssertEqual(roundTrip.columns.count, 12)
        XCTAssertEqual(roundTrip.columns.map(\.name), [
            "order_id", "customer_id", "order_date", "product", "quantity", "order_total", "status",
            "customer_id_2", "customer_name", "state", "segment", "signup_date",
        ])

        let roundTripFirst = try XCTUnwrap(roundTrip.rows.first(where: { $0.first ?? nil == "O1001" }))
        XCTAssertEqual(roundTripFirst[1], "C001")
        XCTAssertEqual(roundTripFirst[3], "Starter Plan")
        XCTAssertEqual(roundTripFirst[4], "1")
        XCTAssertEqual(roundTripFirst[5], "49.0")

        let roundTripC999 = try XCTUnwrap(roundTrip.rows.first(where: { $0.first ?? nil == "O1025" }))
        XCTAssertEqual(roundTripC999[1], "C999")
        XCTAssertNil(roundTripC999[7])
    }

    func testFlattenedCSVShapeFailsClosedInsteadOfTurningValuesIntoHeaders() throws {
        let root = FileManager.default.temporaryDirectory
            .appendingPathComponent("bide-flat-regression-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }

        let flattenedHeader = ordersCSV
            .split(whereSeparator: \.isNewline)
            .map(String.init)
            .joined(separator: ",")
        let damaged = flattenedHeader + "\nC001,Avery Brooks,VA,Small Business,2026-01-08\n"
        let damagedURL = root.appendingPathComponent("damaged.csv")
        try damaged.write(to: damagedURL, atomically: true, encoding: .utf8)

        XCTAssertThrowsError(try DatasetParser.parse(url: damagedURL, format: .csv)) { error in
            guard case DatasetParserError.malformedDelimited(let message) = error else {
                return XCTFail("Expected malformedDelimited, got \(error)")
            }
            XCTAssertTrue(message.contains("damaged row separators"))
        }
    }

    func testPhoneExportConcatenationShapeFailsClosed() throws {
        let root = FileManager.default.temporaryDirectory
            .appendingPathComponent("bide-phone-export-regression-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }

        let damaged = """
        order_id,customer_id,order_date,product,quantity,order_total,status
        O1001,C001,2026-05-03,Starter Plan,1,49.0,Paid
        O1027,C012,2026-08-16,Data Export,2,30.00,Paid,customer_id,customer_name,state,segment,signup_date
        C001,Avery Brooks,VA,Small Business,2026-01-08
        """
        let damagedURL = root.appendingPathComponent("bide_query_result_phone_corrupt.csv")
        try damaged.write(to: damagedURL, atomically: true, encoding: .utf8)

        XCTAssertThrowsError(try DatasetParser.parse(url: damagedURL, format: .csv)) { error in
            guard case DatasetParserError.malformedDelimited(let message) = error else {
                return XCTFail("Expected malformedDelimited, got \(error)")
            }
            XCTAssertTrue(message.contains("structurally inconsistent"))
            XCTAssertTrue(message.contains("12 fields"))
            XCTAssertTrue(message.contains("header declares 7"))
        }
    }

    @MainActor
    func testDerivedDatabaseMigrationRepairsStaleZeroBy234MetadataFromSource() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        let ordersURL = dataDirectory.appendingPathComponent("bIDE_Join_Practice_Orders.csv")
        try ordersCSV.write(to: ordersURL, atomically: true, encoding: .utf8)

        let staleColumns = (1...234).map { index in
            DatasetColumn(name: "stale_\(index)", type: .text)
        }
        let staleTable = DatasetTableDescriptor(
            displayName: "bIDE_Join_Practice_Orders",
            sqliteName: "orders",
            rowCount: 0,
            columns: staleColumns
        )
        let staleAsset = DatasetAsset(
            fileName: ordersURL.lastPathComponent,
            relativePath: "data/\(ordersURL.lastPathComponent)",
            format: .csv,
            sizeBytes: Int64(ordersCSV.utf8.count),
            importedAt: Date(timeIntervalSince1970: 1_700_000_000),
            tables: [staleTable]
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        try encoder.encode([staleAsset]).write(
            to: projectDirectory.appendingPathComponent("datasets.bide.json"),
            options: .atomic
        )
        try Data().write(to: dataDirectory.appendingPathComponent(".bide.sqlite"), options: .atomic)
        try "2".write(
            to: dataDirectory.appendingPathComponent(".bide-sqlite-generation"),
            atomically: true,
            encoding: .utf8
        )

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertEqual(store.datasets.first?.tables.first?.rowCount, 0)
        XCTAssertEqual(store.datasets.first?.tables.first?.columns.count, 234)

        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)

        XCTAssertNil(store.dataError)
        let repaired = try XCTUnwrap(store.datasets.first?.tables.first)
        XCTAssertEqual(repaired.rowCount, 27)
        XCTAssertEqual(repaired.columns.count, 7)
        XCTAssertEqual(repaired.columns.first?.name, "order_id")
        XCTAssertEqual(repaired.columns[1].name, "customer_id")

        await store.executeSQL("SELECT COUNT(*) AS row_count FROM \"orders\";", projectID: projectID)
        let countResult = try XCTUnwrap(store.lastSQLRun?.primaryResult)
        let countValue = countResult.rows.first?.first ?? nil
        XCTAssertEqual(countValue, "27")

        let generation = try String(
            contentsOf: dataDirectory.appendingPathComponent(".bide-sqlite-generation"),
            encoding: .utf8
        ).trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertEqual(generation, "4")
    }
}
