import Foundation
import XCTest
@testable import bIDE

final class DatabaseMigrationFailureTests: XCTestCase {
    @MainActor
    func testCorruptDatasetRegistryDoesNotGetMarkedAsMigrated() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let registryURL = projectDirectory.appendingPathComponent("datasets.bide.json")
        let markerURL = dataDirectory.appendingPathComponent(".bide-sqlite-generation")

        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        try "{not-valid-json".write(to: registryURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.datasets.isEmpty, "Ordinary project opening intentionally fails soft for an unreadable registry.")

        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)

        XCTAssertNotNil(store.dataError)
        XCTAssertTrue(
            store.dataError?.contains("could not verify it safely") == true,
            "Migration should surface a fail-closed registry error instead of pretending the project is empty."
        )
        XCTAssertFalse(
            manager.fileExists(atPath: markerURL.path),
            "A corrupt registry must never be stamped as successfully migrated."
        )
    }
}
