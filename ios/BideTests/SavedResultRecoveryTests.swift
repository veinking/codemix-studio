import Foundation
import XCTest
@testable import bIDE

final class SavedResultRecoveryTests: XCTestCase {
    private func makeFixture(
        projectID: UUID,
        token: String,
        markerState: String
    ) throws -> (
        projectDirectory: URL,
        dataDirectory: URL,
        sourceURL: URL,
        databaseURL: URL,
        generationURL: URL,
        verificationMarkerURL: URL,
        asset: DatasetAsset
    ) {
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let fileName = "bide_query_result_\(token).csv"
        let sourceURL = dataDirectory.appendingPathComponent(fileName)
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        let generationURL = dataDirectory.appendingPathComponent(".bide-sqlite-generation")
        let verificationMarkerURL = dataDirectory.appendingPathComponent(".bide-pending-result-\(token)")
        let registryURL = projectDirectory.appendingPathComponent("datasets.bide.json")

        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        try "id,value\n1,verified-shape\n".write(to: sourceURL, atomically: true, encoding: .utf8)
        let parsed = try XCTUnwrap(DatasetParser.parse(url: sourceURL, format: .csv).first)

        let table = DatasetTableDescriptor(
            displayName: "saved_result",
            sqliteName: "saved_result_\(token)",
            rowCount: parsed.rows.count,
            columns: parsed.columns
        )
        let asset = DatasetAsset(
            fileName: fileName,
            relativePath: "data/\(fileName)",
            format: .csv,
            sizeBytes: Int64((try Data(contentsOf: sourceURL)).count),
            tables: [table]
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        try encoder.encode([asset]).write(to: registryURL, options: .atomic)

        try SQLiteProjectEngine.importTable(
            databaseURL: databaseURL,
            sqliteName: table.sqliteName,
            table: parsed
        )
        try "3".write(to: generationURL, atomically: true, encoding: .utf8)
        try markerState.write(to: verificationMarkerURL, atomically: true, encoding: .utf8)

        return (
            projectDirectory,
            dataDirectory,
            sourceURL,
            databaseURL,
            generationURL,
            verificationMarkerURL,
            asset
        )
    }

    @MainActor
    func testPendingSavedResultIsRemovedAndDerivedDatabaseIsRebuiltFromRemainingRegistry() async throws {
        let projectID = UUID()
        let token = "a1b2c3d4"
        let manager = FileManager.default
        let fixture = try makeFixture(projectID: projectID, token: token, markerState: "pending")
        defer { try? manager.removeItem(at: fixture.projectDirectory) }

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertEqual(store.datasets.map(\.id), [fixture.asset.id])

        XCTAssertTrue(store.recoverInterruptedSavedResults(projectID: projectID))
        XCTAssertNil(store.dataError)
        XCTAssertTrue(store.datasets.isEmpty)
        XCTAssertFalse(manager.fileExists(atPath: fixture.sourceURL.path))
        XCTAssertFalse(manager.fileExists(atPath: fixture.verificationMarkerURL.path))
        XCTAssertFalse(manager.fileExists(atPath: fixture.generationURL.path))

        // The stale saved-result table may still exist until the normal derived-database
        // migration runs. With an empty authoritative registry, migration must remove it.
        XCTAssertTrue(manager.fileExists(atPath: fixture.databaseURL.path))
        await store.migrateDerivedDatabaseIfNeeded(projectID: projectID)
        XCTAssertNil(store.dataError)
        XCTAssertFalse(manager.fileExists(atPath: fixture.databaseURL.path))

        let generation = try String(contentsOf: fixture.generationURL, encoding: .utf8)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertEqual(generation, "3")
    }

    @MainActor
    func testVerifiedSavedResultSurvivesRecoveryAndOnlyMarkerIsRemoved() throws {
        let projectID = UUID()
        let token = "deadbeef"
        let manager = FileManager.default
        let fixture = try makeFixture(projectID: projectID, token: token, markerState: "verified")
        defer { try? manager.removeItem(at: fixture.projectDirectory) }

        let store = DataWorkspaceStore()
        store.openProject(projectID)

        XCTAssertTrue(store.recoverInterruptedSavedResults(projectID: projectID))
        XCTAssertNil(store.dataError)
        XCTAssertEqual(store.datasets.map(\.id), [fixture.asset.id])
        XCTAssertTrue(manager.fileExists(atPath: fixture.sourceURL.path))
        XCTAssertFalse(manager.fileExists(atPath: fixture.verificationMarkerURL.path))
        XCTAssertTrue(manager.fileExists(atPath: fixture.databaseURL.path))
        XCTAssertTrue(manager.fileExists(atPath: fixture.generationURL.path))

        let report = try SQLiteProjectEngine.execute(
            databaseURL: fixture.databaseURL,
            sql: "SELECT COUNT(*) AS row_count FROM \"saved_result_\(token)\";"
        )
        XCTAssertEqual(report.primaryResult?.rows.first?.first ?? nil, "1")
    }

    @MainActor
    func testSavedResultRecoveryDoesNotTouchMarkerOwnedByLiveDataOperation() throws {
        let projectID = UUID()
        let token = "1234abcd"
        let manager = FileManager.default
        let fixture = try makeFixture(projectID: projectID, token: token, markerState: "pending")
        defer { try? manager.removeItem(at: fixture.projectDirectory) }

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.beginDataOperation(projectID: projectID, status: "Finishing saved result…"))
        defer { store.endDataOperation(projectID: projectID) }

        XCTAssertFalse(store.recoverInterruptedSavedResults(projectID: projectID))
        XCTAssertTrue(manager.fileExists(atPath: fixture.verificationMarkerURL.path))
        XCTAssertTrue(manager.fileExists(atPath: fixture.sourceURL.path))
        XCTAssertEqual(store.datasets.map(\.id), [fixture.asset.id])
    }

    @MainActor
    func testRecoveryDoesNotDeleteManualFileThatOnlySharesTokenPrefix() throws {
        let projectID = UUID()
        let token = "cafefeed"
        let manager = FileManager.default
        let fixture = try makeFixture(projectID: projectID, token: token, markerState: "pending")
        defer { try? manager.removeItem(at: fixture.projectDirectory) }

        let manualURL = fixture.dataDirectory
            .appendingPathComponent("bide_query_result_\(token)_backup.csv")
        try "id,value\n99,manual-backup\n".write(to: manualURL, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.recoverInterruptedSavedResults(projectID: projectID))

        XCTAssertFalse(manager.fileExists(atPath: fixture.sourceURL.path))
        XCTAssertTrue(manager.fileExists(atPath: manualURL.path))
        XCTAssertTrue(store.datasets.isEmpty)
    }

    @MainActor
    func testMalformedRecoveryMarkerInvalidatesSQLWithoutDeletingResult() throws {
        let projectID = UUID()
        let token = "feedface"
        let manager = FileManager.default
        let fixture = try makeFixture(projectID: projectID, token: token, markerState: "pending")
        defer { try? manager.removeItem(at: fixture.projectDirectory) }

        try manager.removeItem(at: fixture.verificationMarkerURL)
        let malformedMarker = fixture.dataDirectory.appendingPathComponent(".bide-pending-result-not-a-token")
        try "pending".write(to: malformedMarker, atomically: true, encoding: .utf8)

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertTrue(store.isDerivedDatabaseReadyForSQL(projectID: projectID))

        XCTAssertFalse(store.recoverInterruptedSavedResults(projectID: projectID))
        XCTAssertTrue(manager.fileExists(atPath: fixture.sourceURL.path))
        XCTAssertTrue(manager.fileExists(atPath: malformedMarker.path))
        XCTAssertFalse(manager.fileExists(atPath: fixture.generationURL.path))
        XCTAssertFalse(store.isDerivedDatabaseReadyForSQL(projectID: projectID))
        XCTAssertTrue(store.dataError?.contains("unrecognized saved-result recovery marker") == true)
    }

    @MainActor
    func testPendingRecoveryWriteFailureLeavesMarkerAndInvalidatesSQL() throws {
        let projectID = UUID()
        let token = "abcddcba"
        let manager = FileManager.default
        let fixture = try makeFixture(projectID: projectID, token: token, markerState: "pending")
        defer { try? manager.removeItem(at: fixture.projectDirectory) }

        let registryURL = fixture.projectDirectory.appendingPathComponent("datasets.bide.json")
        let store = DataWorkspaceStore()
        store.openProject(projectID)
        XCTAssertEqual(store.datasets.map(\.id), [fixture.asset.id])

        // Force the atomic registry rollback write to fail after the store has already loaded
        // the valid registry. Recovery must have invalidated SQLite generation before this.
        try manager.removeItem(at: registryURL)
        try manager.createDirectory(at: registryURL, withIntermediateDirectories: false)

        XCTAssertFalse(store.recoverInterruptedSavedResults(projectID: projectID))
        XCTAssertTrue(manager.fileExists(atPath: fixture.sourceURL.path))
        XCTAssertTrue(manager.fileExists(atPath: fixture.verificationMarkerURL.path))
        XCTAssertFalse(manager.fileExists(atPath: fixture.generationURL.path))
        XCTAssertFalse(store.isDerivedDatabaseReadyForSQL(projectID: projectID))
        XCTAssertTrue(store.dataError?.contains("local SQL state remains invalidated") == true)
    }

    @MainActor
    func testSavedResultTokenMatcherAcceptsOnlyGeneratedCollisionShape() {
        let store = DataWorkspaceStore()
        let token = "facecafe"

        XCTAssertTrue(store.savedResultFileName("bide_query_result_facecafe.csv", matchesToken: token))
        XCTAssertTrue(store.savedResultFileName("bide_query_result_facecafe 2.csv", matchesToken: token))
        XCTAssertTrue(store.savedResultFileName("bide_query_result_facecafe 12.csv", matchesToken: token))
        XCTAssertFalse(store.savedResultFileName("bide_query_result_facecafe 1.csv", matchesToken: token))
        XCTAssertFalse(store.savedResultFileName("bide_query_result_facecafe_backup.csv", matchesToken: token))
        XCTAssertFalse(store.savedResultFileName("bide_query_result_facecafe 2.json", matchesToken: token))
    }

    @MainActor
    func testVerificationMarkerTransitionsPendingToVerified() throws {
        let projectID = UUID()
        let token = "facecafe"
        let manager = FileManager.default
        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        defer { try? manager.removeItem(at: projectDirectory) }

        let store = DataWorkspaceStore()
        store.openProject(projectID)
        let markerURL = try store.beginSavedResultVerification(projectID: projectID, token: token)

        XCTAssertEqual(
            try String(contentsOf: markerURL, encoding: .utf8),
            "pending"
        )

        try store.commitSavedResultVerification(markerURL: markerURL)
        XCTAssertEqual(
            try String(contentsOf: markerURL, encoding: .utf8),
            "verified"
        )

        try store.clearSavedResultVerificationMarker(markerURL)
        XCTAssertFalse(manager.fileExists(atPath: markerURL.path))
    }
}
