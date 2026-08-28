import Foundation
import SQLite3

@MainActor
extension DataWorkspaceStore {
    private static let derivedDatabaseGeneration = "3"

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
            let expectedTables = tables
            let matchesRegistry = await Task.detached(priority: .userInitiated) {
                Self.derivedDatabaseMatchesRegistry(
                    databaseURL: databaseURL,
                    expectedTables: expectedTables
                )
            }.value

            guard activeProjectID == projectID else { return false }
            if matchesRegistry { return true }

            // A current generation marker is not enough if the actual SQLite tables have
            // drifted from the authoritative registry. Invalidate the marker so migration
            // must rebuild from the project source files before SQL can run.
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

        let expectedTables = tables
        let matchesRegistry = await Task.detached(priority: .userInitiated) {
            Self.derivedDatabaseMatchesRegistry(
                databaseURL: databaseURL,
                expectedTables: expectedTables
            )
        }.value

        guard activeProjectID == projectID else { return false }
        if !matchesRegistry {
            dataError = "bIDE rebuilt the local SQL database, but its table schemas or row counts still do not match the project datasets. SQL was blocked instead of returning an untrusted result."
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
        expectedTables: [DatasetTableDescriptor]
    ) -> Bool {
        if expectedTables.isEmpty { return true }
        guard FileManager.default.fileExists(atPath: databaseURL.path) else { return false }

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

            let countSQL = "SELECT COUNT(*) FROM \(SQLiteProjectEngine.quoteIdentifier(table.sqliteName));"
            var countStatement: OpaquePointer?
            let countPrepareResult = countSQL.withCString { pointer in
                sqlite3_prepare_v2(db, pointer, -1, &countStatement, nil)
            }
            guard countPrepareResult == SQLITE_OK, let countStatement else {
                if let countStatement { sqlite3_finalize(countStatement) }
                return false
            }
            guard sqlite3_step(countStatement) == SQLITE_ROW else {
                sqlite3_finalize(countStatement)
                return false
            }
            let actualRowCount = Int(sqlite3_column_int64(countStatement, 0))
            sqlite3_finalize(countStatement)
            guard actualRowCount == table.rowCount else { return false }
        }

        return true
    }
}
