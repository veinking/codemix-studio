import Foundation

@MainActor
extension DataWorkspaceStore {
    func deleteDatasetSafely(_ asset: DatasetAsset, projectID: UUID) async {
        guard activeProjectID == projectID else { return }
        guard !isImporting, !isRunningSQL else {
            dataError = "Finish the current data operation before deleting a dataset."
            return
        }

        dataError = nil
        let originalAssets = datasets
        guard originalAssets.contains(where: { $0.id == asset.id }) else { return }
        let updatedAssets = originalAssets.filter { $0.id != asset.id }

        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let registryURL = projectDirectory.appendingPathComponent("datasets.bide.json")
        let databaseURL = projectDirectory
            .appendingPathComponent("data", isDirectory: true)
            .appendingPathComponent(".bide.sqlite")
        let sourceURL = fileURL(for: asset, projectID: projectID)

        // Commit metadata first. Until this succeeds, neither SQL nor the authoritative
        // source file is touched. If the app stops immediately afterward, the source still
        // exists and normal reconciliation can safely register it again.
        do {
            try writeDatasetRegistrySnapshot(updatedAssets, to: registryURL)
        } catch {
            dataError = "Could not delete \(asset.fileName): the dataset registry could not be updated, so the source file and SQL tables were left untouched. \(error.localizedDescription)"
            return
        }

        // Drop every table for this asset in one SQLite transaction. A statement failure
        // closes the connection with an uncommitted transaction, so no partial table set is
        // accepted. If this stage fails, restore metadata while the source is still intact.
        do {
            try await dropDatasetTablesTransactionally(
                asset.tables.map(\.sqliteName),
                databaseURL: databaseURL
            )
        } catch {
            let sqlError = error.localizedDescription
            if restoreDatasetRegistrySnapshot(originalAssets, to: registryURL) {
                openProject(projectID)
                dataError = "Could not delete \(asset.fileName): SQL cleanup failed, so the dataset registry and source file were restored. \(sqlError)"
            } else {
                openProject(projectID)
                await reconcileProjectFiles(projectID: projectID)
                if dataError == nil {
                    dataError = "Could not delete \(asset.fileName): SQL cleanup failed. The source file was preserved and bIDE re-registered it from disk."
                }
            }
            return
        }

        // The source is deliberately last. If filesystem deletion fails, restore the
        // registry and rebuild SQLite from the still-existing authoritative source.
        do {
            if manager.fileExists(atPath: sourceURL.path) {
                try manager.removeItem(at: sourceURL)
            }
        } catch {
            let sourceError = error.localizedDescription
            if restoreDatasetRegistrySnapshot(originalAssets, to: registryURL) {
                openProject(projectID)
                await rebuildDatabase(projectID: projectID)
                if dataError == nil {
                    dataError = "Could not remove \(asset.fileName) from disk, so the dataset was restored. \(sourceError)"
                }
            } else {
                openProject(projectID)
                await reconcileProjectFiles(projectID: projectID)
                if dataError == nil {
                    dataError = "Could not remove \(asset.fileName) from disk or restore its previous registry entry. The source file was preserved and bIDE re-registered it from disk."
                }
            }
            return
        }

        // All three stages succeeded. Reload from the committed registry so every view sees
        // the same post-delete state and stale SQL result breadcrumbs are cleared.
        openProject(projectID)
    }

    private func writeDatasetRegistrySnapshot(
        _ assets: [DatasetAsset],
        to registryURL: URL
    ) throws {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(assets)
        try data.write(to: registryURL, options: .atomic)
    }

    private func restoreDatasetRegistrySnapshot(
        _ assets: [DatasetAsset],
        to registryURL: URL
    ) -> Bool {
        do {
            try writeDatasetRegistrySnapshot(assets, to: registryURL)
            return true
        } catch {
            return false
        }
    }

    private func dropDatasetTablesTransactionally(
        _ tableNames: [String],
        databaseURL: URL
    ) async throws {
        guard !tableNames.isEmpty,
              FileManager.default.fileExists(atPath: databaseURL.path) else { return }

        let statements = ["BEGIN IMMEDIATE TRANSACTION;"]
            + tableNames.map { "DROP TABLE IF EXISTS \(SQLiteProjectEngine.quoteIdentifier($0));" }
            + ["COMMIT;"]
        let sql = statements.joined(separator: "\n")

        _ = try await Task.detached(priority: .utility) {
            try SQLiteProjectEngine.execute(databaseURL: databaseURL, sql: sql, rowLimit: 0)
        }.value
    }
}
