import Foundation
import XCTest
@testable import bIDE

final class ProjectImportFormatTests: XCTestCase {
    @MainActor
    func testProjectImportSkipsUnsupportedXLSAndParquetFiles() throws {
        let manager = FileManager.default
        let sourceRoot = manager.temporaryDirectory
            .appendingPathComponent("bide-project-import-\(UUID().uuidString)", isDirectory: true)
        try manager.createDirectory(at: sourceRoot, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: sourceRoot) }

        try "print('hello')\n".write(
            to: sourceRoot.appendingPathComponent("analysis.py"),
            atomically: true,
            encoding: .utf8
        )
        try "id,value\n1,ok\n".write(
            to: sourceRoot.appendingPathComponent("supported.csv"),
            atomically: true,
            encoding: .utf8
        )
        try Data([0xD0, 0xCF, 0x11, 0xE0]).write(
            to: sourceRoot.appendingPathComponent("legacy.xls"),
            options: .atomic
        )
        try Data("PAR1".utf8).write(
            to: sourceRoot.appendingPathComponent("unsupported.parquet"),
            options: .atomic
        )

        let workspace = WorkspaceStore()
        let importedID = try XCTUnwrap(workspace.importProject(from: sourceRoot))

        let documents = try XCTUnwrap(manager.urls(for: .documentDirectory, in: .userDomainMask).first)
        let importedRoot = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(importedID.uuidString, isDirectory: true)
        defer { try? manager.removeItem(at: importedRoot) }

        XCTAssertTrue(manager.fileExists(atPath: importedRoot.appendingPathComponent("analysis.py").path))
        XCTAssertTrue(manager.fileExists(atPath: importedRoot.appendingPathComponent("supported.csv").path))
        XCTAssertFalse(manager.fileExists(atPath: importedRoot.appendingPathComponent("legacy.xls").path))
        XCTAssertFalse(manager.fileExists(atPath: importedRoot.appendingPathComponent("unsupported.parquet").path))
    }
}
