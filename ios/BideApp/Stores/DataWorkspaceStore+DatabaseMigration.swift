import Foundation

@MainActor
extension DataWorkspaceStore {
    private static let derivedDatabaseGeneration = "2"

    func migrateDerivedDatabaseIfNeeded(projectID: UUID) async {
        guard activeProjectID == projectID else { return }

        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
        let markerURL = dataDirectory.appendingPathComponent(".bide-sqlite-generation")
        let registryURL = projectDirectory.appendingPathComponent("datasets.bide.json")

        // Validate the authoritative registry and every registered source file on every
        // project synchronization, even when the derived SQLite generation is current.
        // If authority cannot be proven, invalidate SQLite so stale tables cannot remain
        // queryable while the app surfaces the data-integrity error.
        let registeredAssets: [DatasetAsset]?
        do {
            registeredAssets = try strictRegistryAssetsIfPresent(
                at: registryURL,
                projectDirectory: projectDirectory
            )
        } catch {
            let verificationError = error.localizedDescription
            do {
                try invalidateDerivedDatabase(manager: manager, databaseURL: databaseURL)
                dataError = "bIDE found local dataset metadata but could not verify it safely. Derived SQL was disabled: \(verificationError)"
            } catch {
                dataError = "bIDE found local dataset metadata but could not verify it safely, and could not disable stale derived SQL: \(error.localizedDescription)"
            }
            return
        }

        if datasets.isEmpty,
           let registeredAssets,
           !registeredAssets.isEmpty {
            datasets = registeredAssets
        }

        let storedGeneration = (try? String(contentsOf: markerURL, encoding: .utf8))?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let databaseExists = manager.fileExists(atPath: databaseURL.path)

        // SQLite is derived state. If there are no authoritative registered datasets,
        // an existing database is orphaned and must not remain queryable. Remove it before
        // stamping the generation; source-file reconciliation can rebuild only the tables
        // that are actually present in the project afterward.
        if datasets.isEmpty {
            do {
                try invalidateDerivedDatabase(manager: manager, databaseURL: databaseURL)
                try recordDerivedDatabaseGeneration(
                    manager: manager,
                    dataDirectory: dataDirectory,
                    markerURL: markerURL
                )
            } catch {
                dataError = "bIDE could not clear stale local SQL state safely: \(error.localizedDescription)"
            }
            return
        }

        guard storedGeneration != Self.derivedDatabaseGeneration || !databaseExists else { return }

        do {
            try await refreshDatasetRegistryFromSourceAssets(
                projectID: projectID,
                projectDirectory: projectDirectory
            )
        } catch {
            guard activeProjectID == projectID else { return }
            try? invalidateDerivedDatabase(manager: manager, databaseURL: databaseURL)
            dataError = "bIDE found older local data metadata but could not safely refresh it from the project source files: \(error.localizedDescription)"
            return
        }

        guard activeProjectID == projectID else { return }

        // Reload the freshly reconstructed registry before rebuilding SQLite so both the
        // Datasets UI metadata and the derived SQL tables come from the same source parse.
        openProject(projectID)
        await rebuildDatabase(projectID: projectID)
        guard activeProjectID == projectID, dataError == nil else { return }

        do {
            try recordDerivedDatabaseGeneration(
                manager: manager,
                dataDirectory: dataDirectory,
                markerURL: markerURL
            )
        } catch {
            dataError = "The SQL database was rebuilt, but bIDE could not finish its local migration marker: \(error.localizedDescription)"
        }
    }

    private func strictRegistryAssetsIfPresent(
        at registryURL: URL,
        projectDirectory: URL
    ) throws -> [DatasetAsset]? {
        guard FileManager.default.fileExists(atPath: registryURL.path) else { return nil }
        let registryData = try Data(contentsOf: registryURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let assets = try decoder.decode([DatasetAsset].self, from: registryData)

        let projectRoot = projectDirectory.standardizedFileURL.path
        let projectPrefix = projectRoot.hasSuffix("/") ? projectRoot : projectRoot + "/"
        for asset in assets {
            let relativePath = asset.relativePath.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !relativePath.isEmpty else {
                throw DatasetParserError.unreadable(asset.fileName)
            }

            let sourceURL = projectDirectory
                .appendingPathComponent(relativePath)
                .standardizedFileURL
            guard sourceURL.path.hasPrefix(projectPrefix),
                  (try? sourceURL.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true else {
                throw DatasetParserError.unreadable(asset.fileName)
            }
        }
        return assets
    }

    private func invalidateDerivedDatabase(
        manager: FileManager,
        databaseURL: URL
    ) throws {
        let relatedURLs = [
            databaseURL,
            URL(fileURLWithPath: databaseURL.path + "-wal"),
            URL(fileURLWithPath: databaseURL.path + "-shm"),
        ]
        for url in relatedURLs where manager.fileExists(atPath: url.path) {
            try manager.removeItem(at: url)
        }
    }

    private func recordDerivedDatabaseGeneration(
        manager: FileManager,
        dataDirectory: URL,
        markerURL: URL
    ) throws {
        try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
        try Self.derivedDatabaseGeneration.write(
            to: markerURL,
            atomically: true,
            encoding: .utf8
        )
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
