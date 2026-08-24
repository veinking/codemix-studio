import Foundation

@MainActor
extension DataWorkspaceStore {
    @discardableResult
    func recoverInterruptedDatasetDeletions(projectID: UUID) -> Bool {
        guard activeProjectID == projectID else { return false }

        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)

        guard let enumerator = manager.enumerator(
            at: projectDirectory,
            includingPropertiesForKeys: [.isRegularFileKey],
            options: [.skipsPackageDescendants]
        ) else {
            dataError = "bIDE could not inspect this project for interrupted dataset operations."
            return false
        }

        var stagedFiles: [(url: URL, assetID: UUID)] = []
        let prefix = ".bide-delete-"

        for case let url as URL in enumerator {
            guard (try? url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true else { continue }
            let name = url.lastPathComponent
            guard name.hasPrefix(prefix) else { continue }

            let remainder = String(name.dropFirst(prefix.count))
            guard remainder.count >= 36,
                  let assetID = UUID(uuidString: String(remainder.prefix(36))) else {
                dataError = "bIDE found an unrecognized interrupted-delete file and stopped before changing project data."
                return false
            }
            stagedFiles.append((url, assetID))
        }

        guard !stagedFiles.isEmpty else { return true }

        let registeredByID = Dictionary(uniqueKeysWithValues: datasets.map { ($0.id, $0) })

        do {
            for staged in stagedFiles {
                if let asset = registeredByID[staged.assetID] {
                    // The registry still contains the asset, so deletion never committed.
                    // Restore the authoritative source file to its registered path.
                    let destination = projectDirectory.appendingPathComponent(asset.relativePath)
                    guard !manager.fileExists(atPath: destination.path) else {
                        dataError = "bIDE found both the registered source and an interrupted-delete copy for \(asset.fileName). It stopped to avoid overwriting either file."
                        return false
                    }
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

            // A crash may have happened before SQLite cleanup. Force the normal migration
            // to reconstruct derived SQL from whichever registry state won above.
            let markerURL = projectDirectory
                .appendingPathComponent("data", isDirectory: true)
                .appendingPathComponent(".bide-sqlite-generation")
            if manager.fileExists(atPath: markerURL.path) {
                try manager.removeItem(at: markerURL)
            }
            return true
        } catch {
            dataError = "bIDE could not safely recover an interrupted dataset deletion: \(error.localizedDescription)"
            return false
        }
    }
}
