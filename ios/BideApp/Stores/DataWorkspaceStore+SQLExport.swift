import Foundation

@MainActor
extension DataWorkspaceStore {
    func exportSQLResult(
        _ report: SQLRunReport,
        projectID: UUID,
        registerAsDataset: Bool
    ) async -> URL? {
        guard activeProjectID == projectID else { return nil }
        guard let result = report.primaryResult,
              !result.columns.isEmpty,
              !result.statementSQL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            dataError = "This SQL run does not contain a table result to export."
            return nil
        }
        guard result.isReadOnly else {
            dataError = SQLiteProjectEngineError.exportRequiresReadOnlyQuery.localizedDescription
            return nil
        }

        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let databaseURL = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
            .appendingPathComponent("data", isDirectory: true)
            .appendingPathComponent(".bide.sqlite")

        let suffix = UUID().uuidString.prefix(8).lowercased()
        let outputURL = manager.temporaryDirectory
            .appendingPathComponent("bide_query_result_\(suffix).csv")

        do {
            try await Task.detached(priority: .userInitiated) {
                try SQLiteProjectEngine.exportReadOnlyQueryToCSV(
                    databaseURL: databaseURL,
                    sql: result.statementSQL,
                    outputURL: outputURL
                )
            }.value

            guard registerAsDataset else { return outputURL }

            let existingIDs = Set(datasets.map(\.id))
            await importDatasets([outputURL], projectID: projectID)
            try? manager.removeItem(at: outputURL)

            guard activeProjectID == projectID,
                  let imported = datasets.first(where: { !existingIDs.contains($0.id) }) else {
                return nil
            }
            return fileURL(for: imported, projectID: projectID)
        } catch {
            try? manager.removeItem(at: outputURL)
            if activeProjectID == projectID {
                dataError = "Could not export the SQL result: \(error.localizedDescription)"
            }
            return nil
        }
    }
}
