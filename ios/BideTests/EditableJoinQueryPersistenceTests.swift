import Foundation
import XCTest
@testable import bIDE

final class EditableJoinQueryPersistenceTests: XCTestCase {
    @MainActor
    func testGeneratedJoinSQLFilePersistsAndReopensAsActiveSQLDocument() throws {
        let projectName = "Join Query Regression \(UUID().uuidString.prefix(8))"
        let firstStore = WorkspaceStore()
        firstStore.createProject(named: projectName)
        let projectID = try XCTUnwrap(firstStore.activeProjectID)

        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        defer {
            try? manager.removeItem(at: projectDirectory)
            UserDefaults.standard.removeObject(forKey: "bide.lastProject")
            UserDefaults.standard.removeObject(forKey: "bide.lastFile.\(projectID.uuidString)")
        }

        let sql = """
        SELECT l.*, r.*
        FROM "orders" AS l
        LEFT JOIN "customers" AS r
          ON l."customer_id" = r."customer_id";
        """ + "\n"

        firstStore.createFile(named: "join_orders_customers", language: .sql)
        let created = try XCTUnwrap(firstStore.activeFile)
        XCTAssertEqual(created.language, .sql)
        XCTAssertTrue(created.name.hasPrefix("join_orders_customers"))
        XCTAssertEqual(firstStore.saveState, .saved)

        firstStore.updateDocumentText(sql)
        firstStore.saveActiveDocumentNow()
        XCTAssertEqual(firstStore.saveState, .saved)
        XCTAssertEqual(try String(contentsOf: created.url, encoding: .utf8), sql)

        let reopenedStore = WorkspaceStore()
        XCTAssertEqual(reopenedStore.activeProjectID, projectID)
        let reopened = try XCTUnwrap(reopenedStore.activeFile)
        XCTAssertEqual(reopened.id, created.id)
        XCTAssertEqual(reopened.language, .sql)
        XCTAssertEqual(reopenedStore.documentText, sql)
        XCTAssertEqual(try String(contentsOf: reopened.url, encoding: .utf8), sql)
    }
}
