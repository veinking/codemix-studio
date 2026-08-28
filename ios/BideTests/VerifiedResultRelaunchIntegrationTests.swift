import Foundation
import XCTest
@testable import bIDE

final class VerifiedResultRelaunchIntegrationTests: XCTestCase {
    @MainActor
    func testImportedSourcesAndVerifiedSavedJoinSurviveFreshStoreReopen() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let inputDirectory = manager.temporaryDirectory
            .appendingPathComponent("bide-relaunch-\(UUID().uuidString)", isDirectory: true)
        try manager.createDirectory(at: inputDirectory, withIntermediateDirectories: true)
        defer {
            try? manager.removeItem(at: projectDirectory)
            try? manager.removeItem(at: inputDirectory)
        }

        let ordersURL = inputDirectory.appendingPathComponent("Orders.csv")
        let customersURL = inputDirectory.appendingPathComponent("Customers.csv")
        try """
        order_id,customer_id,order_total
        O1,C001,49.0
        O2,C999,30.0
        """.write(to: ordersURL, atomically: true, encoding: .utf8)
        try """
        customer_id,name
        C001,Avery Brooks
        C002,Jordan Lee
        """.write(to: customersURL, atomically: true, encoding: .utf8)

        let firstStore = DataWorkspaceStore()
        firstStore.openProject(projectID)
        await firstStore.importDatasets([ordersURL, customersURL], projectID: projectID)
        XCTAssertNil(firstStore.dataError)
        XCTAssertEqual(firstStore.datasets.count, 2)

        await firstStore.executeSQL(
            """
            SELECT o.*, c.*
            FROM "orders" AS o
            LEFT JOIN "customers" AS c
              ON o."customer_id" = c."customer_id";
            """,
            projectID: projectID
        )
        XCTAssertNil(firstStore.sqlError)
        let report = try XCTUnwrap(firstStore.lastSQLRun)
        let result = try XCTUnwrap(report.primaryResult)
        XCTAssertEqual(result.rows.count, 2)
        XCTAssertEqual(result.columns.count, 5)
        XCTAssertNil(result.rows[1][3])
        XCTAssertNil(result.rows[1][4])

        let savedURL = try XCTUnwrap(await firstStore.exportSQLResult(
            report,
            projectID: projectID,
            registerAsDataset: true
        ))
        XCTAssertNil(firstStore.dataError)
        XCTAssertEqual(firstStore.datasets.count, 3)
        XCTAssertTrue(manager.fileExists(atPath: savedURL.path))

        // Model a fresh app/store instance. Startup recovery must preserve a fully verified
        // saved result while the two original source assets remain authoritative too.
        let reopenedStore = DataWorkspaceStore()
        reopenedStore.openProject(projectID)
        XCTAssertEqual(reopenedStore.datasets.count, 3)
        XCTAssertTrue(reopenedStore.recoverInterruptedSavedResults(projectID: projectID))
        await reopenedStore.reconcileProjectFiles(projectID: projectID)
        await reopenedStore.migrateDerivedDatabaseIfNeeded(projectID: projectID)

        XCTAssertNil(reopenedStore.dataError)
        XCTAssertEqual(reopenedStore.datasets.count, 3)
        XCTAssertTrue(reopenedStore.datasets.contains(where: { $0.fileName == "Orders.csv" }))
        XCTAssertTrue(reopenedStore.datasets.contains(where: { $0.fileName == "Customers.csv" }))
        let saved = try XCTUnwrap(reopenedStore.datasets.first(where: { $0.fileName == savedURL.lastPathComponent }))
        XCTAssertEqual(saved.totalRows, 2)
        XCTAssertEqual(saved.tables.first?.columns.count, 5)

        let savedTable = try XCTUnwrap(saved.tables.first)
        await reopenedStore.executeSQL(
            "SELECT * FROM \(SQLiteProjectEngine.quoteIdentifier(savedTable.sqliteName)) ORDER BY rowid;",
            projectID: projectID
        )
        XCTAssertNil(reopenedStore.sqlError)
        let reopenedResult = try XCTUnwrap(reopenedStore.lastSQLRun?.primaryResult)
        XCTAssertEqual(reopenedResult.rows.count, 2)
        XCTAssertEqual(reopenedResult.rows[0][0], "O1")
        XCTAssertEqual(reopenedResult.rows[0][1], "C001")
        XCTAssertEqual(reopenedResult.rows[1][1], "C999")
        XCTAssertNil(reopenedResult.rows[1][3])
        XCTAssertNil(reopenedResult.rows[1][4])
    }
}
