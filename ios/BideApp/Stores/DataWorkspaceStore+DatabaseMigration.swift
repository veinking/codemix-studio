import Foundation

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
        if isDerivedDatabaseReadyForSQL(projectID: projectID) { return true }

        guard !hasActiveDataOperation(projectID: projectID),
              !hasActiveSQLOperation(projectID: projectID) else {
            return false
        }

        await migrateDerivedDatabaseIfNeeded(projectID: projectID)
        return isDerivedDatabaseReadyForSQL(projectID: projectID)
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
}
