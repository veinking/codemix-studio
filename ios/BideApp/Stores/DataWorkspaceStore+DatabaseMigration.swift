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

        let storedGeneration = (try? String(contentsOf: markerURL, encoding: .utf8))?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let databaseExists = manager.fileExists(atPath: databaseURL.path)

        guard storedGeneration != Self.derivedDatabaseGeneration || !databaseExists else { return }

        if datasets.isEmpty {
            do {
                try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
                try Self.derivedDatabaseGeneration.write(to: markerURL, atomically: true, encoding: .utf8)
            } catch {
                dataError = "Could not record the local SQL engine version: \(error.localizedDescription)"
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

        // Reload the freshly reconstructed registry before rebuilding SQLite so both the
        // Datasets UI metadata and the derived SQL tables come from the same source parse.
        openProject(projectID)
        await rebuildDatabase(projectID: projectID)
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

        let manager = FileManager.default
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

            let refreshedTables = zip(parsedTables, asset.tables).map { parsed, existing in
                DatasetTableDescriptor(
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
