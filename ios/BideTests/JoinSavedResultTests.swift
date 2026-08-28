import Foundation
import XCTest
@testable import bIDE

final class JoinSavedResultTests: XCTestCase {
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
    func testCanonicalLeftJoinSaveResultCreatesVerifiedTwentySevenByTwelveDataset() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        let customersURL = dataDirectory.appendingPathComponent("Customers.csv")
        let ordersURL = dataDirectory.appendingPathComponent("Orders.csv")
        try customersCSV.write(to: customersURL, atomically: true, encoding: .utf8)
        try ordersCSV.write(to: ordersURL, atomically: true, encoding: .utf8)
        let customers = try XCTUnwrap(DatasetParser.parse(url: customersURL, format: .csv).first)
        let orders = try XCTUnwrap(DatasetParser.parse(url: ordersURL, format: .csv).first)

        try SQLiteProjectEngine.importTable(databaseURL: databaseURL, sqliteName: "orders", table: orders)
        try SQLiteProjectEngine.importTable(databaseURL: databaseURL, sqliteName: "customers", table: customers)
        try "3".write(
            to: dataDirectory.appendingPathComponent(".bide-sqlite-generation"),
            atomically: true,
            encoding: .utf8
        )

        let sql = """
        SELECT o.*, c.*
        FROM "orders" AS o
        LEFT JOIN "customers" AS c
          ON o."customer_id" = c."customer_id";
        """
        let report = try SQLiteProjectEngine.execute(databaseURL: databaseURL, sql: sql, rowLimit: 500)
        let result = try XCTUnwrap(report.primaryResult)
        XCTAssertEqual(result.rows.count, 27)
        XCTAssertEqual(result.columns.count, 12)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        let savedURL = try XCTUnwrap(await store.exportSQLResult(
            report,
            projectID: projectID,
            registerAsDataset: true
        ))

        XCTAssertNil(store.dataError)
        let savedAsset = try XCTUnwrap(store.datasets.first(where: { $0.fileName == savedURL.lastPathComponent }))
        let savedTable = try XCTUnwrap(savedAsset.tables.first)
        XCTAssertEqual(savedTable.rowCount, 27)
        XCTAssertEqual(savedTable.columns.count, 12)
        XCTAssertEqual(savedTable.columns.map(\.name), [
            "order_id", "customer_id", "order_date", "product", "quantity", "order_total", "status",
            "customer_id_2", "customer_name", "state", "segment", "signup_date",
        ])

        let roundTrip = try XCTUnwrap(DatasetParser.parse(url: savedURL, format: .csv).first)
        XCTAssertEqual(roundTrip.rows.count, 27)
        XCTAssertEqual(roundTrip.columns.count, 12)

        let firstOrder = try XCTUnwrap(roundTrip.rows.first(where: { $0.first ?? nil == "O1001" }))
        XCTAssertEqual(firstOrder[1], "C001")
        XCTAssertEqual(firstOrder[3], "Starter Plan")
        XCTAssertEqual(firstOrder[4], "1")
        XCTAssertEqual(firstOrder[5], "49.0")
        XCTAssertEqual(firstOrder[7], "C001")
        XCTAssertEqual(firstOrder[9], "VA")

        let orphan999 = try XCTUnwrap(roundTrip.rows.first(where: { $0.first ?? nil == "O1025" }))
        XCTAssertEqual(orphan999[1], "C999")
        XCTAssertNil(orphan999[7])
        XCTAssertNil(orphan999[8])
        XCTAssertNil(orphan999[9])
        XCTAssertNil(orphan999[10])
        XCTAssertNil(orphan999[11])

        let orphan888 = try XCTUnwrap(roundTrip.rows.first(where: { $0.first ?? nil == "O1026" }))
        XCTAssertEqual(orphan888[1], "C888")
        XCTAssertNil(orphan888[7])

        let dataNames = try manager.contentsOfDirectory(atPath: dataDirectory.path)
        XCTAssertFalse(dataNames.contains { $0.hasPrefix(DataWorkspaceStore.pendingSavedResultMarkerPrefix) })

        let allCells = roundTrip.rows.flatMap { $0.compactMap { $0 } }
        for forbidden in ["C001_2", "Starter Plan_2", "VA_2", "49.0_2"] {
            XCTAssertFalse(allCells.contains(forbidden), "Cell values must never receive header-uniqueness suffixes: \(forbidden)")
        }
    }
}
