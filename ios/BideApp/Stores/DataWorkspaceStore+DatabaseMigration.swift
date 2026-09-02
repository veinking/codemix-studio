import Foundation
import SQLite3

private struct DatasetValueFingerprint {
    private(set) var value: UInt64 = 14_695_981_039_346_656_037

    mutating func append(row: [String?]) {
        mix(byte: 0x52)
        mix(number: UInt64(row.count))

        for cell in row {
            guard let cell else {
                mix(byte: 0x00)
                continue
            }

            mix(byte: 0x01)
            mix(number: UInt64(cell.utf8.count))
            for byte in cell.utf8 {
                mix(byte: byte)
            }
        }
    }

    private mutating func mix(number: UInt64) {
        var remaining = number
        for _ in 0..<8 {
            mix(byte: UInt8(truncatingIfNeeded: remaining))
            remaining >>= 8
        }
    }

    private mutating func mix(byte: UInt8) {
        value ^= UInt64(byte)
        value &*= 1_099_511_628_211
    }
}

@MainActor
extension DataWorkspaceStore {
    // Generation 4 is the Build-12 hardware-integrity reset. Generation 3 validated schema
    // and row counts but could still trust same-shaped SQLite tables whose cell values had
    // drifted (for example C001 -> C001_2). Every generation-3 project must rebuild from its
    // source datasets before SQL is trusted again.
    private static let derivedDatabaseGeneration = "4"

    func isDerivedDatabaseReadyForSQL(projectID: UUID) -> Bool {
        guard activeProjectID == projectID else { return false }
        guard datasetRegistryIntegrityStatus(projectID: projectID) != .unreadable else {
            return false
        }

        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let dataDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
            .appendingPathComponent("data", isDirectory: true)
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        let markerURL = dataDirectory.appendingPathComponent(".bide-sqlite-generation")

        let storedGeneration = (try? String(contentsOf: markerURL, encoding: .utf8))?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard storedGeneration == Self.derivedDatabaseGeneration else { return false }

        // Projects with registered datasets must have a database to query. An empty or
        // SQL-only project may legitimately have no dataset registry and no SQLite file yet;
        // a simple SQL statement can create the empty DB after the generation marker has
        // already established that stale tables were cleared.
        return datasets.isEmpty || manager.fileExists(atPath: databaseURL.path)
    }

    func prepareDerivedDatabaseForSQLIfNeeded(projectID: UUID) async -> Bool {
        guard activeProjectID == projectID else { return false }

        // SQL may be requested before the asynchronous project-open recovery task finishes.
        // Recheck the registry boundary here so a fast user action can never outrun recovery
        // and query derived state whose source-of-truth metadata is unreadable/ambiguous.
        guard validateDatasetRegistryBeforeRecovery(projectID: projectID) else {
            return false
        }

        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        let markerURL = dataDirectory.appendingPathComponent(".bide-sqlite-generation")

        if isDerivedDatabaseReadyForSQL(projectID: projectID) {
            let expectedAssets = datasets
            let matchesRegistry = await Task.detached(priority: .userInitiated) {
                Self.derivedDatabaseMatchesRegistry(
                    databaseURL: databaseURL,
                    projectDirectory: projectDirectory,
                    expectedAssets: expectedAssets
                )
            }.value

            guard activeProjectID == projectID else { return false }
            if matchesRegistry { return true }

            // A current generation marker is not enough if the actual SQLite tables have
            // drifted from the authoritative registry or source values. Invalidate the marker
            // so migration must rebuild from project source files before SQL can run.
            do {
                if manager.fileExists(atPath: markerURL.path) {
                    try manager.removeItem(at: markerURL)
                }
            } catch {
                dataError = "bIDE detected that the local SQL tables no longer match the project datasets, but could not invalidate the stale SQL state: \(error.localizedDescription)"
                return false
            }
        }

        guard !hasActiveDataOperation(projectID: projectID),
              !hasActiveSQLOperation(projectID: projectID) else {
            return false
        }

        await migrateDerivedDatabaseIfNeeded(projectID: projectID)
        guard isDerivedDatabaseReadyForSQL(projectID: projectID) else { return false }

        let expectedAssets = datasets
        let matchesRegistry = await Task.detached(priority: .userInitiated) {
            Self.derivedDatabaseMatchesRegistry(
                databaseURL: databaseURL,
                projectDirectory: projectDirectory,
                expectedAssets: expectedAssets
            )
        }.value

        guard activeProjectID == projectID else { return false }
        if !matchesRegistry {
            dataError = "bIDE rebuilt the local SQL database, but its table schemas, row counts, or values still do not match the project source datasets. SQL was blocked instead of returning an untrusted result."
        }
        return matchesRegistry
    }

    func migrateDerivedDatabaseIfNeeded(projectID: UUID) async {
        guard activeProjectID == projectID else { return }
        guard validateDatasetRegistryBeforeRecovery(projectID: projectID) else { return }

        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        let markerURL = dataDirectory.appendingPathComponent(".bide-sqlite-generation")

        let storedGeneration = (try? String(contentsOf: markerURL, encoding: .utf8))?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let databaseExists = manager.fileExists(atPath: databaseURL.path)

        let migrationNeeded = storedGeneration != Self.derivedDatabaseGeneration || (!datasets.isEmpty && !databaseExists)
        guard migrationNeeded else { return }
        guard beginDataOperation(projectID: projectID, status: "Refreshing local SQL state…") else {
            return
        }
        if activeProjectID == projectID {
            // Only failures from this migration attempt should prevent the generation commit.
            dataError = nil
        }
        defer { endDataOperation(projectID: projectID) }

        if datasets.isEmpty {
            do {
                try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)

                // An empty registry is authoritative: there must not be queryable tables left
                // behind from an older derived database. Remove SQLite plus any WAL sidecars
                // before recording the current generation.
                for staleURL in [
                    databaseURL,
                    URL(fileURLWithPath: databaseURL.path + "-wal"),
                    URL(fileURLWithPath: databaseURL.path + "-shm"),
                ] where manager.fileExists(atPath: staleURL.path) {
                    try manager.removeItem(at: staleURL)
                }

                try Self.derivedDatabaseGeneration.write(to: markerURL, atomically: true, encoding: .utf8)
            } catch {
                if activeProjectID == projectID {
                    dataError = "Could not reset the empty project's local SQL database: \(error.localizedDescription)"
                }
            }
            return
        }

        do {
            try await refreshDatasetRegistryFromSourceAssets(
                projectID: projectID,
                projectDirectory: projectDirectory
            )
        } catch {
            guard activeProjectID == projectID else { return }
            dataError = "bIDE found older local data metadata but could not safely refresh it from the project source files: \(error.localizedDescription)"
            return
        }

        guard activeProjectID == projectID else { return }

        // Reload the freshly reconstructed registry while retaining the project-level data
        // operation lock. The following SQLite rebuild therefore cannot race SQL, previews,
        // exports, imports, deletes, or another rebuild.
        openProject(projectID)
        await rebuildDatabaseWithinDataOperation(projectID: projectID)
        guard activeProjectID == projectID, dataError == nil else { return }

        do {
            try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
            try Self.derivedDatabaseGeneration.write(to: markerURL, atomically: true, encoding: .utf8)
        } catch {
            dataError = "The SQL database was rebuilt, but bIDE could not finish its local migration marker: \(error.localizedDescription)"
        }
    }

    private func refreshDatasetRegistryFromSourceAssets(
        projectID: UUID,
        projectDirectory: URL
    ) async throws {
        guard activeProjectID == projectID else { return }

        let registryURL = projectDirectory.appendingPathComponent("datasets.bide.json")
        let registryData = try Data(contentsOf: registryURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let registeredAssets = try decoder.decode([DatasetAsset].self, from: registryData)

        var refreshedAssets: [DatasetAsset] = []
        refreshedAssets.reserveCapacity(registeredAssets.count)

        for asset in registeredAssets {
            guard activeProjectID == projectID else { return }

            let sourceURL = projectDirectory.appendingPathComponent(asset.relativePath)
            let parsedTables = try await Task.detached(priority: .userInitiated) {
                try DatasetParser.parse(url: sourceURL, format: asset.format)
            }.value

            guard parsedTables.count == asset.tables.count else {
                throw DatasetParserError.unreadable(asset.fileName)
            }

            let refreshedTables = zip(parsedTables, asset.tables).map { pair in
                let (parsed, existing) = pair
                return DatasetTableDescriptor(
                    id: existing.id,
                    displayName: parsed.displayName,
                    sqliteName: existing.sqliteName,
                    sourceSheetName: parsed.sourceSheetName,
                    rowCount: parsed.rows.count,
                    columns: parsed.columns
                )
            }

            let fileSize = (try? sourceURL.resourceValues(forKeys: [.fileSizeKey]).fileSize)
                .map(Int64.init) ?? asset.sizeBytes

            refreshedAssets.append(
                DatasetAsset(
                    id: asset.id,
                    fileName: asset.fileName,
                    relativePath: asset.relativePath,
                    format: asset.format,
                    sizeBytes: fileSize,
                    importedAt: asset.importedAt,
                    tables: refreshedTables
                )
            )
        }

        refreshedAssets.sort { $0.importedAt > $1.importedAt }
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        let refreshedData = try encoder.encode(refreshedAssets)
        try refreshedData.write(to: registryURL, options: .atomic)
    }

    nonisolated private static func derivedDatabaseMatchesRegistry(
        databaseURL: URL,
        projectDirectory: URL,
        expectedAssets: [DatasetAsset]
    ) -> Bool {
        if expectedAssets.isEmpty { return true }
        guard FileManager.default.fileExists(atPath: databaseURL.path) else { return false }

        // Re-read the authoritative source files. Registry shape alone cannot detect a
        // same-row-count/same-schema value mutation in the derived SQLite database.
        var expectedTables: [DatasetTableDescriptor] = []
        var expectedFingerprints: [String: UInt64] = [:]

        for asset in expectedAssets {
            let sourceURL = projectDirectory.appendingPathComponent(asset.relativePath)
            guard let parsedTables = try? DatasetParser.parse(url: sourceURL, format: asset.format),
                  parsedTables.count == asset.tables.count else {
                return false
            }

            for (parsed, descriptor) in zip(parsedTables, asset.tables) {
                guard parsed.rows.count == descriptor.rowCount,
                      parsed.columns == descriptor.columns else {
                    return false
                }
                expectedTables.append(descriptor)
                expectedFingerprints[descriptor.sqliteName.lowercased()] = canonicalSourceFingerprint(parsed)
            }
        }

        var db: OpaquePointer?
        let flags = SQLITE_OPEN_READONLY | SQLITE_OPEN_FULLMUTEX
        let openResult = databaseURL.path.withCString { pointer in
            sqlite3_open_v2(pointer, &db, flags, nil)
        }
        guard openResult == SQLITE_OK, let db else {
            if let db { sqlite3_close(db) }
            return false
        }
        defer { sqlite3_close(db) }
        sqlite3_busy_timeout(db, 3_000)

        for table in expectedTables {
            let schemaSQL = "PRAGMA table_info(\(SQLiteProjectEngine.quoteIdentifier(table.sqliteName)));"
            var schemaStatement: OpaquePointer?
            let schemaPrepareResult = schemaSQL.withCString { pointer in
                sqlite3_prepare_v2(db, pointer, -1, &schemaStatement, nil)
            }
            guard schemaPrepareResult == SQLITE_OK, let schemaStatement else {
                if let schemaStatement { sqlite3_finalize(schemaStatement) }
                return false
            }

            var actualColumns: [DatasetColumn] = []
            var schemaStep = sqlite3_step(schemaStatement)
            while schemaStep == SQLITE_ROW {
                guard let namePointer = sqlite3_column_text(schemaStatement, 1),
                      let typePointer = sqlite3_column_text(schemaStatement, 2) else {
                    sqlite3_finalize(schemaStatement)
                    return false
                }
                let name = String(cString: namePointer)
                let typeName = String(cString: typePointer).uppercased()
                guard let type = DatasetColumnType(rawValue: typeName) else {
                    sqlite3_finalize(schemaStatement)
                    return false
                }
                actualColumns.append(DatasetColumn(name: name, type: type))
                schemaStep = sqlite3_step(schemaStatement)
            }
            guard schemaStep == SQLITE_DONE else {
                sqlite3_finalize(schemaStatement)
                return false
            }
            sqlite3_finalize(schemaStatement)
            guard actualColumns == table.columns else { return false }

            let valueSQL = "SELECT * FROM \(SQLiteProjectEngine.quoteIdentifier(table.sqliteName)) ORDER BY rowid;"
            var valueStatement: OpaquePointer?
            let valuePrepareResult = valueSQL.withCString { pointer in
                sqlite3_prepare_v2(db, pointer, -1, &valueStatement, nil)
            }
            guard valuePrepareResult == SQLITE_OK, let valueStatement else {
                if let valueStatement { sqlite3_finalize(valueStatement) }
                return false
            }

            var actualFingerprint = DatasetValueFingerprint()
            var actualRowCount = 0
            var valueStep = sqlite3_step(valueStatement)
            while valueStep == SQLITE_ROW {
                let row = (0..<table.columns.count).map { index in
                    sqliteColumnValue(valueStatement, index: Int32(index))
                }
                actualFingerprint.append(row: row)
                actualRowCount += 1
                valueStep = sqlite3_step(valueStatement)
            }
            guard valueStep == SQLITE_DONE else {
                sqlite3_finalize(valueStatement)
                return false
            }
            sqlite3_finalize(valueStatement)

            guard actualRowCount == table.rowCount,
                  let expectedFingerprint = expectedFingerprints[table.sqliteName.lowercased()],
                  actualFingerprint.value == expectedFingerprint else {
                return false
            }
        }

        return true
    }

    nonisolated private static func canonicalSourceFingerprint(_ table: ParsedDatasetTable) -> UInt64 {
        var fingerprint = DatasetValueFingerprint()
        for sourceRow in table.rows {
            let canonicalRow = table.columns.enumerated().map { index, column -> String? in
                let value = index < sourceRow.count ? sourceRow[index] : nil
                return canonicalSQLiteValue(value, type: column.type)
            }
            fingerprint.append(row: canonicalRow)
        }
        return fingerprint.value
    }

    nonisolated private static func canonicalSQLiteValue(
        _ value: String?,
        type: DatasetColumnType
    ) -> String? {
        guard let value else { return nil }
        switch type {
        case .integer:
            return Int64(value).map { String($0) } ?? value
        case .real:
            return Double(value).map { String($0) } ?? value
        case .text:
            return value
        }
    }

    nonisolated private static func sqliteColumnValue(
        _ statement: OpaquePointer,
        index: Int32
    ) -> String? {
        switch sqlite3_column_type(statement, index) {
        case SQLITE_NULL:
            return nil
        case SQLITE_INTEGER:
            return String(sqlite3_column_int64(statement, index))
        case SQLITE_FLOAT:
            return String(sqlite3_column_double(statement, index))
        case SQLITE_TEXT:
            guard let pointer = sqlite3_column_text(statement, index) else { return nil }
            return String(cString: pointer)
        case SQLITE_BLOB:
            return "<BLOB \(sqlite3_column_bytes(statement, index)) bytes>"
        default:
            return nil
        }
    }
}
