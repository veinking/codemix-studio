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

    @MainActor
    func testCorruptRegistryIsRejectedEvenWhenDerivedDatabaseGenerationIsCurrent() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let registryURL = projectDirectory.appendingPathComponent("datasets.bide.json")
        let markerURL = dataDirectory.appendingPathComponent(".bide-sqlite-generation")
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        let walURL = URL(fileURLWithPath: databaseURL.path + "-wal")
        let shmURL = URL(fileURLWithPath: databaseURL.path + "-shm")
        let corruptRegistry = "{not-valid-json-current-generation"

        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        try corruptRegistry.write(to: registryURL, atomically: true, encoding: .utf8)
        try "2".write(to: markerURL, atomically: true, encoding: .utf8)
        XCTAssertTrue(manager.createFile(atPath: databaseURL.path, contents: Data()))
        XCTAssertTrue(manager.createFile(atPath: walURL.path, contents: Data("stale wal".utf8)))
        XCTAssertTrue(manager.createFile(atPath: shmURL.path, contents: Data("stale shm".utf8)))

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.datasets.isEmpty, "The forgiving project loader still presents an unreadable registry as empty until strict validation runs.")

        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)

        XCTAssertTrue(
            store.dataError?.contains("could not verify it safely") == true,
            "Strict registry validation must run before the current-generation early return."
        )
        XCTAssertEqual(
            try String(contentsOf: registryURL, encoding: .utf8),
            corruptRegistry,
            "Fail-closed validation must not rewrite or reconcile over the damaged registry."
        )
        XCTAssertFalse(
            manager.fileExists(atPath: databaseURL.path),
            "A corrupt authoritative registry must invalidate the derived SQLite database so stale tables cannot remain queryable."
        )
        XCTAssertFalse(manager.fileExists(atPath: walURL.path))
        XCTAssertFalse(manager.fileExists(atPath: shmURL.path))
        XCTAssertEqual(
            try String(contentsOf: markerURL, encoding: .utf8),
            "2",
            "The generation marker may remain because a missing database forces a future safe rebuild after authority is repaired."
        )
    }

    @MainActor
    func testMissingRegisteredSourceInvalidatesCurrentDerivedDatabase() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let registryURL = projectDirectory.appendingPathComponent("datasets.bide.json")
        let markerURL = dataDirectory.appendingPathComponent(".bide-sqlite-generation")
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")

        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        let missingAsset = DatasetAsset(
            fileName: "missing.csv",
            relativePath: "data/missing.csv",
            format: .csv,
            sizeBytes: 12,
            tables: [
                DatasetTableDescriptor(
                    displayName: "missing",
                    sqliteName: "missing",
                    rowCount: 1,
                    columns: [DatasetColumn(name: "id", type: .integer)]
                )
            ]
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        let registryData = try encoder.encode([missingAsset])
        try registryData.write(to: registryURL, options: .atomic)
        try "2".write(to: markerURL, atomically: true, encoding: .utf8)
        XCTAssertTrue(manager.createFile(atPath: databaseURL.path, contents: Data("stale table bytes".utf8)))

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertEqual(store.datasets.count, 1, "The valid registry loads before source authority is verified.")

        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)

        XCTAssertTrue(
            store.dataError?.contains("could not verify it safely") == true,
            "A registry entry whose source file disappeared must fail authoritative verification."
        )
        XCTAssertTrue(
            store.dataError?.contains("missing.csv") == true,
            "The integrity error should identify the missing registered source."
        )
        XCTAssertFalse(
            manager.fileExists(atPath: databaseURL.path),
            "A missing authoritative source must invalidate stale derived SQL even when its generation marker is current."
        )
        XCTAssertEqual(
            try Data(contentsOf: registryURL),
            registryData,
            "Authority failure must not silently rewrite the user's dataset registry."
        )
    }

    @MainActor
    func testOrphanCurrentGenerationDatabaseIsRemovedBeforeSourceReconciliation() async throws {
        let projectID = UUID()
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let markerURL = dataDirectory.appendingPathComponent(".bide-sqlite-generation")
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        let sourceURL = dataDirectory.appendingPathComponent("fresh.csv")

        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        try "2".write(to: markerURL, atomically: true, encoding: .utf8)
        XCTAssertTrue(manager.createFile(atPath: databaseURL.path, contents: Data("stale derived state".utf8)))
        try "id,value\n1,new\n".write(to: sourceURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.datasets.isEmpty)

        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)

        XCTAssertNil(store.dataError)
        XCTAssertFalse(
            manager.fileExists(atPath: databaseURL.path),
            "A derived database with no authoritative registry must be removed even when its generation marker is current."
        )
        XCTAssertEqual(try String(contentsOf: markerURL, encoding: .utf8), "2")

        await store.reconcileProjectFiles(projectID: projectID)

        XCTAssertNil(store.dataError)
        XCTAssertEqual(store.datasets.count, 1)
        XCTAssertEqual(store.datasets.first?.fileName, "fresh.csv")
        XCTAssertEqual(store.datasets.first?.tables.first?.rowCount, 1)
        XCTAssertTrue(
            manager.fileExists(atPath: databaseURL.path),
            "Reconciliation should rebuild SQLite only from the real source file after orphan cleanup."
        )
    }
}
