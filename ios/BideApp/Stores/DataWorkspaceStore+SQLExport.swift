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
        guard beginSQLOperation(projectID: projectID) else {
            dataError = "Finish the current dataset or SQL operation before exporting this result."
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

        let exportSummary: SQLCSVExportSummary
        do {
            exportSummary = try await Task.detached(priority: .userInitiated) {
                try SQLiteProjectEngine.exportReadOnlyQueryToCSV(
                    databaseURL: databaseURL,
                    sql: result.statementSQL,
                    outputURL: outputURL,
                    sampleLimit: min(result.rows.count, 100)
                )
            }.value
        } catch {
            endSQLOperation(projectID: projectID)
            try? manager.removeItem(at: outputURL)
            if activeProjectID == projectID {
                dataError = "Could not export the SQL result: \(error.localizedDescription)"
            }
            return nil
        }
        endSQLOperation(projectID: projectID)

        guard exportSummary.columns == result.columns else {
            try? manager.removeItem(at: outputURL)
            dataError = "Export verification failed because the CSV columns no longer match the SQL result. bIDE did not share or save the file."
            return nil
        }

        let expectedSample = Array(result.rows.prefix(exportSummary.sampleRows.count))
        guard exportSummary.sampleRows == expectedSample else {
            try? manager.removeItem(at: outputURL)
            dataError = "Export verification failed because the CSV values no longer match the SQL result. bIDE did not share or save the file."
            return nil
        }

        if !result.isTruncated, exportSummary.rowCount != result.rowCount {
            try? manager.removeItem(at: outputURL)
            dataError = "Export verification failed because the CSV row count no longer matches the SQL result. bIDE did not share or save the file."
            return nil
        }

        let exportedRowCount = exportSummary.rowCount
        guard registerAsDataset else { return outputURL }

        let existingIDs = Set(datasets.map(\.id))
        await importDatasets([outputURL], projectID: projectID)
        try? manager.removeItem(at: outputURL)

        guard activeProjectID == projectID,
              let imported = datasets.first(where: { !existingIDs.contains($0.id) }) else {
            dataError = "The exported CSV was created, but bIDE could not register it as a project dataset."
            return nil
        }

        guard imported.tables.count == 1,
              let importedTable = imported.tables.first,
              imported.totalRows == exportedRowCount,
              importedTable.columns.count == result.columns.count else {
            await removeFailedSavedResult(imported, projectID: projectID)
            dataError = "Saved-result verification failed. bIDE removed the derived dataset instead of keeping an incomplete copy."
            return nil
        }

        let sampleCount = min(result.rows.count, 100)
        if sampleCount > 0 {
            guard beginSQLOperation(projectID: projectID) else {
                await removeFailedSavedResult(imported, projectID: projectID)
                dataError = "Saved-result verification could not run because another project data operation started. bIDE removed the unverified derived dataset."
                return nil
            }

            let tableName = SQLiteProjectEngine.quoteIdentifier(importedTable.sqliteName)
            let verificationSQL = "SELECT * FROM \(tableName) LIMIT \(sampleCount);"
            let verification: SQLRunReport
            do {
                verification = try await Task.detached(priority: .userInitiated) {
                    try SQLiteProjectEngine.execute(
                        databaseURL: databaseURL,
                        sql: verificationSQL,
                        rowLimit: sampleCount
                    )
                }.value
            } catch {
                endSQLOperation(projectID: projectID)
                await removeFailedSavedResult(imported, projectID: projectID)
                dataError = "Saved-result verification could not read the derived dataset. bIDE removed it instead of keeping an unverified copy: \(error.localizedDescription)"
                return nil
            }
            endSQLOperation(projectID: projectID)

            let expectedRows = Array(result.rows.prefix(sampleCount))
            guard verification.primaryResult?.rows == expectedRows else {
                await removeFailedSavedResult(imported, projectID: projectID)
                dataError = "Saved-result value verification failed. bIDE removed the derived dataset instead of keeping altered values."
                return nil
            }
        }

        return fileURL(for: imported, projectID: projectID)
    }

    private func removeFailedSavedResult(_ asset: DatasetAsset, projectID: UUID) async {
        await deleteDataset(asset, projectID: projectID)
    }
}
