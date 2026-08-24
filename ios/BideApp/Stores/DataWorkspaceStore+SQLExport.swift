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
        guard !hasActiveDataOperation(projectID: projectID),
              !hasActiveSQLOperation(projectID: projectID) else {
            dataError = "Finish the current dataset or SQL operation before exporting this result."
            return nil
        }
        guard await prepareDerivedDatabaseForSQLIfNeeded(projectID: projectID) else {
            dataError = dataError ?? "bIDE could not prepare the local SQL database for export. The result was not shared or saved."
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

        let token = String(UUID().uuidString.prefix(8)).lowercased()
        let outputURL = manager.temporaryDirectory
            .appendingPathComponent("\(Self.savedResultFilePrefix)\(token).csv")

        // If the on-screen result is complete, verify every visible row. Only genuinely
        // truncated (>500-row) results use a bounded display comparison while the exporter
        // still streams and fingerprints the complete query result.
        let verificationSampleCount = result.isTruncated
            ? min(result.rows.count, 100)
            : result.rows.count

        let exportSummary: SQLCSVExportSummary
        do {
            exportSummary = try await Task.detached(priority: .userInitiated) {
                try SQLiteProjectEngine.exportReadOnlyQueryToCSV(
                    databaseURL: databaseURL,
                    sql: result.statementSQL,
                    outputURL: outputURL,
                    sampleLimit: verificationSampleCount
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

        // Create a durable pending marker before project registration. Verification is only
        // committed after the re-imported dataset passes every row/schema/value check. If the
        // app is killed in between, startup recovery removes the unverified derived result.
        let verificationMarkerURL: URL
        do {
            verificationMarkerURL = try beginSavedResultVerification(projectID: projectID, token: token)
        } catch {
            try? manager.removeItem(at: outputURL)
            dataError = "bIDE could not start crash-safe saved-result verification, so the result was not added to Datasets: \(error.localizedDescription)"
            return nil
        }

        let existingIDs = Set(datasets.map(\.id))
        await importDatasets([outputURL], projectID: projectID)
        try? manager.removeItem(at: outputURL)

        guard activeProjectID == projectID,
              let imported = datasets.first(where: { !existingIDs.contains($0.id) }) else {
            // No project dataset was committed, so the pending marker can be discarded.
            // If marker cleanup itself fails, startup recovery safely handles the orphan.
            try? clearSavedResultVerificationMarker(verificationMarkerURL)
            dataError = "The exported CSV was created, but bIDE could not register it as a project dataset."
            return nil
        }

        guard imported.tables.count == 1,
              let importedTable = imported.tables.first,
              imported.totalRows == exportedRowCount,
              importedTable.columns.count == result.columns.count else {
            await rejectUnverifiedSavedResult(
                imported,
                projectID: projectID,
                verificationMarkerURL: verificationMarkerURL,
                reason: "Saved-result verification failed because the registered shape does not match the exported result."
            )
            return nil
        }

        guard await prepareDerivedDatabaseForSQLIfNeeded(projectID: projectID),
              beginSQLOperation(projectID: projectID) else {
            await rejectUnverifiedSavedResult(
                imported,
                projectID: projectID,
                verificationMarkerURL: verificationMarkerURL,
                reason: "Saved-result verification could not run because the local SQL database was not ready."
            )
            return nil
        }

        // CSV re-import may intentionally disambiguate duplicate header names, so full
        // verification compares column count plus row/value order rather than exact headers.
        // ORDER BY rowid reproduces the CSV insertion order without materializing all rows.
        let tableName = SQLiteProjectEngine.quoteIdentifier(importedTable.sqliteName)
        let verificationSQL = "SELECT * FROM \(tableName) ORDER BY rowid;"
        let integritySummary: SQLQueryIntegritySummary
        do {
            integritySummary = try await Task.detached(priority: .userInitiated) {
                try SQLiteProjectEngine.integritySummaryForReadOnlyQuery(
                    databaseURL: databaseURL,
                    sql: verificationSQL
                )
            }.value
        } catch {
            endSQLOperation(projectID: projectID)
            await rejectUnverifiedSavedResult(
                imported,
                projectID: projectID,
                verificationMarkerURL: verificationMarkerURL,
                reason: "Saved-result verification could not read the complete derived dataset: \(error.localizedDescription)"
            )
            return nil
        }
        endSQLOperation(projectID: projectID)

        guard integritySummary.rowCount == exportSummary.rowCount,
              integritySummary.columns.count == exportSummary.columns.count,
              integritySummary.valueFingerprint == exportSummary.valueFingerprint else {
            await rejectUnverifiedSavedResult(
                imported,
                projectID: projectID,
                verificationMarkerURL: verificationMarkerURL,
                reason: "Saved-result full verification failed because rows or values changed during the CSV round trip."
            )
            return nil
        }

        do {
            // This atomic state transition is the commit point. A crash after it but before
            // marker deletion keeps the verified dataset; startup simply removes the marker.
            try commitSavedResultVerification(markerURL: verificationMarkerURL)
        } catch {
            await rejectUnverifiedSavedResult(
                imported,
                projectID: projectID,
                verificationMarkerURL: verificationMarkerURL,
                reason: "The saved result passed data verification, but bIDE could not commit its verification state."
            )
            return nil
        }

        // Once verification is durably committed the marker is only cleanup metadata.
        // A failure here is harmless: startup recognizes `verified` and preserves the result.
        try? clearSavedResultVerificationMarker(verificationMarkerURL)
        return fileURL(for: imported, projectID: projectID)
    }

    private func rejectUnverifiedSavedResult(
        _ asset: DatasetAsset,
        projectID: UUID,
        verificationMarkerURL: URL,
        reason: String
    ) async {
        await deleteDataset(asset, projectID: projectID)
        let removed = !datasets.contains(where: { $0.id == asset.id })

        if removed {
            // The failed result no longer exists, so there is nothing left for startup
            // recovery to roll back. Marker cleanup can be retried harmlessly if it fails.
            try? clearSavedResultVerificationMarker(verificationMarkerURL)
            dataError = "\(reason) bIDE removed the unverified saved dataset instead of keeping it."
            return
        }

        let cleanupDetail = dataError
        dataError = "\(reason) bIDE could not finish removing the unverified dataset immediately. It remains marked pending and will be removed on the next safe project open.\(cleanupDetail.map { " Cleanup detail: \($0)" } ?? "")"
    }
}
