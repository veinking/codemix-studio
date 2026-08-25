import Foundation

@MainActor
extension DataWorkspaceStore {
    @discardableResult
    func recoverInterruptedDatasetDeletions(projectID: UUID) -> Bool {
        guard activeProjectID == projectID else { return false }

        // A staged delete file is only a crash-recovery artifact when no live operation
        // still owns this project. Switching away and back during a legitimate delete must
        // never cause startup recovery to race the in-flight transaction.
        guard !hasActiveDataOperation(projectID: projectID),
              !hasActiveSQLOperation(projectID: projectID) else {
            return false
        }

        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let markerURL = projectDirectory
            .appendingPathComponent("data", isDirectory: true)
            .appendingPathComponent(".bide-sqlite-generation")

        guard let enumerator = manager.enumerator(
            at: projectDirectory,
            includingPropertiesForKeys: [.isRegularFileKey],
            options: [.skipsPackageDescendants]
        ) else {
            dataError = "bIDE could not inspect this project for interrupted dataset operations."
            return false
        }

        var stagedFiles: [(url: URL, assetID: UUID)] = []
        var malformedStagedFileName: String?
        var sawDeleteArtifact = false
        let prefix = ".bide-delete-"

        for case let url as URL in enumerator {
            guard (try? url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true else { continue }
            let name = url.lastPathComponent
            guard name.hasPrefix(prefix) else { continue }

            sawDeleteArtifact = true
            let remainder = String(name.dropFirst(prefix.count))
            let expectedLength = 36 + 1 + 36
            guard remainder.count == expectedLength else {
                malformedStagedFileName = name
                continue
            }

            let separatorIndex = remainder.index(remainder.startIndex, offsetBy: 36)
            guard remainder[separatorIndex] == "-" else {
                malformedStagedFileName = name
                continue
            }

            let assetPart = String(remainder.prefix(36))
            let transactionPart = String(remainder.suffix(36))
            guard let assetID = UUID(uuidString: assetPart),
                  UUID(uuidString: transactionPart) != nil else {
                malformedStagedFileName = name
                continue
            }
            stagedFiles.append((url, assetID))
        }

        guard sawDeleteArtifact else { return true }

        // Once any delete staging artifact exists, the derived database cannot be trusted
        // until recovery reaches a known registry/source state. Invalidate generation before
        // validating or moving files so every failure path remains fail-closed for SQL.
        do {
            if manager.fileExists(atPath: markerURL.path) {
                try manager.removeItem(at: markerURL)
            }
        } catch {
            dataError = "bIDE found an interrupted dataset deletion but could not invalidate the local SQL state: \(error.localizedDescription)"
            return false
        }

        if let malformedStagedFileName {
            dataError = "bIDE found an unrecognized interrupted-delete file (\(malformedStagedFileName)) and stopped before changing project data. The local SQL state was invalidated and will not be trusted until recovery succeeds."
            return false
        }

        let duplicateAssetIDs = Dictionary(grouping: stagedFiles, by: \.assetID)
            .filter { $0.value.count > 1 }
            .map(\.key)
        guard duplicateAssetIDs.isEmpty else {
            dataError = "bIDE found multiple interrupted-delete copies for the same dataset and stopped before moving either file. The local SQL state was invalidated and will not be trusted until recovery succeeds."
            return false
        }

        let registeredByID = Dictionary(uniqueKeysWithValues: datasets.map { ($0.id, $0) })

        // Validate every restore destination before mutating any staged file. This avoids a
        // later conflict leaving an earlier dataset half-recovered in the same pass.
        for staged in stagedFiles {
            guard let asset = registeredByID[staged.assetID] else { continue }
            let destination = projectDirectory.appendingPathComponent(asset.relativePath)
            guard !manager.fileExists(atPath: destination.path) else {
                dataError = "bIDE found both the registered source and an interrupted-delete copy for \(asset.fileName). It stopped to avoid overwriting either file. The local SQL state remains invalidated."
                return false
            }
        }

        do {
            for staged in stagedFiles {
                if let asset = registeredByID[staged.assetID] {
                    // The registry still contains the asset, so deletion never committed.
                    // Restore the authoritative source file to its registered path.
                    let destination = projectDirectory.appendingPathComponent(asset.relativePath)
                    try manager.createDirectory(
                        at: destination.deletingLastPathComponent(),
                        withIntermediateDirectories: true
                    )
                    try manager.moveItem(at: staged.url, to: destination)
                } else {
                    // The registry no longer contains the asset, so metadata deletion did
                    // commit. Finish cleanup by removing the staged source copy.
                    try manager.removeItem(at: staged.url)
                }
            }
            return true
        } catch {
            // Generation was already invalidated before mutation, so even a partial recovery
            // cannot leave the old SQLite state eligible for SQL reads.
            dataError = "bIDE could not safely recover an interrupted dataset deletion: \(error.localizedDescription). The local SQL state remains invalidated."
            return false
        }
    }
}
