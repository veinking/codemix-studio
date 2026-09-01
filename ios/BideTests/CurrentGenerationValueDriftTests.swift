import Foundation
import XCTest
@testable import bIDE

final class CurrentGenerationValueDriftTests: XCTestCase {
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

    @MainActor
    func testCurrentGenerationSameShapeValueDriftIsRebuiltBeforeJoinAndExport() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        let customersURL = dataDirectory.appendingPathComponent("bIDE_Join_Practice_Customers.csv")
        let ordersURL = dataDirectory.appendingPathComponent("bIDE_Join_Practice_Orders.csv")
        try customersCSV.write(to: customersURL, atomically: true, encoding: .utf8)
        try ordersCSV.write(to: ordersURL, atomically: true, encoding: .utf8)

        let customers = try XCTUnwrap(DatasetParser.parse(url: customersURL, format: .csv).first)
        let orders = try XCTUnwrap(DatasetParser.parse(url: ordersURL, format: .csv).first)

        let customerTable = DatasetTableDescriptor(
            displayName: customers.displayName,
            sqliteName: "bide_join_practice_customers",
            rowCount: customers.rows.count,
            columns: customers.columns
        )
        let orderTable = DatasetTableDescriptor(
            displayName: orders.displayName,
            sqliteName: "bide_join_practice_orders",
            rowCount: orders.rows.count,
            columns: orders.columns
        )
        let assets = [
            DatasetAsset(
                fileName: customersURL.lastPathComponent,
                relativePath: "data/\(customersURL.lastPathComponent)",
                format: .csv,
                sizeBytes: Int64(customersCSV.utf8.count),
                tables: [customerTable]
            ),
            DatasetAsset(
                fileName: ordersURL.lastPathComponent,
                relativePath: "data/\(ordersURL.lastPathComponent)",
                format: .csv,
                sizeBytes: Int64(ordersCSV.utf8.count),
                tables: [orderTable]
            ),
        ]

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        try encoder.encode(assets).write(
            to: projectDirectory.appendingPathComponent("datasets.bide.json"),
            options: .atomic
        )

        // Reproduce the Build-12 blind spot: the derived database has the correct table
        // names, ordered schemas, and exact row counts, but ordinary cell values have been
        // mutated with uniqueness suffixes. Generation-3 validation accepted this shape.
        var corruptedCustomerRows = customers.rows
        corruptedCustomerRows[0][0] = "C001_2"
        corruptedCustomerRows[0][2] = "VA_2"

        var corruptedOrderRows = orders.rows
        corruptedOrderRows[0][1] = "C001_2"
        corruptedOrderRows[0][3] = "Starter Plan_2"
        corruptedOrderRows[0][5] = "49.0_2"

        let corruptedCustomers = ParsedDatasetTable(
            displayName: customers.displayName,
            sourceSheetName: customers.sourceSheetName,
            columns: customers.columns,
            rows: corruptedCustomerRows
        )
        let corruptedOrders = ParsedDatasetTable(
            displayName: orders.displayName,
            sourceSheetName: orders.sourceSheetName,
            columns: orders.columns,
            rows: corruptedOrderRows
        )

        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        try SQLiteProjectEngine.importTable(
            databaseURL: databaseURL,
            sqliteName: customerTable.sqliteName,
            table: corruptedCustomers
        )
        try SQLiteProjectEngine.importTable(
            databaseURL: databaseURL,
            sqliteName: orderTable.sqliteName,
            table: corruptedOrders
        )
        try "4".write(
            to: dataDirectory.appendingPathComponent(".bide-sqlite-generation"),
            atomically: true,
            encoding: .utf8
        )

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.isDerivedDatabaseReadyForSQL(projectID: projectID))

        let sql = """
        SELECT l.*, r.*
        FROM "bide_join_practice_orders" AS l
        LEFT JOIN "bide_join_practice_customers" AS r
          ON l."customer_id" = r."customer_id";
        """
        await store.executeSQL(sql, projectID: projectID)

        XCTAssertNil(store.sqlError)
        XCTAssertNil(store.dataError)
        let report = try XCTUnwrap(store.lastSQLRun)
        let result = try XCTUnwrap(report.primaryResult)
        XCTAssertEqual(result.columns.count, 12)
        XCTAssertEqual(result.rows.count, 27)

        let orphan999 = try XCTUnwrap(result.rows.first(where: { $0[1] == "C999" }))
        XCTAssertTrue(orphan999[7...11].allSatisfy { $0 == nil })
        let orphan888 = try XCTUnwrap(result.rows.first(where: { $0[1] == "C888" }))
        XCTAssertTrue(orphan888[7...11].allSatisfy { $0 == nil })

        let flattened = result.rows.flatMap { $0.compactMap { $0 } }
        XCTAssertFalse(flattened.contains("C001_2"))
        XCTAssertFalse(flattened.contains("VA_2"))
        XCTAssertFalse(flattened.contains("Starter Plan_2"))
        XCTAssertFalse(flattened.contains("49.0_2"))
        XCTAssertTrue(flattened.contains("C001"))
        XCTAssertTrue(flattened.contains("VA"))
        XCTAssertTrue(flattened.contains("Starter Plan"))

        let exportURL = try XCTUnwrap(
            await store.exportSQLResult(report, projectID: projectID, registerAsDataset: false)
        )
        defer { try? manager.removeItem(at: exportURL) }

        let exported = try XCTUnwrap(DatasetParser.parse(url: exportURL, format: .csv).first)
        XCTAssertEqual(exported.columns.count, 12)
        XCTAssertEqual(exported.rows.count, 27)
        XCTAssertTrue(exported.rows.allSatisfy { $0.count == 12 })

        let exportedValues = exported.rows.flatMap { $0.compactMap { $0 } }
        XCTAssertFalse(exportedValues.contains("C001_2"))
        XCTAssertFalse(exportedValues.contains("VA_2"))
        XCTAssertFalse(exportedValues.contains("Starter Plan_2"))
        XCTAssertFalse(exportedValues.contains("49.0_2"))
    }
}
