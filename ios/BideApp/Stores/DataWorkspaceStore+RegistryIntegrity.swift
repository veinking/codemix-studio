import Foundation

@MainActor
extension DataWorkspaceStore {
    enum DatasetRegistryIntegrityStatus: Equatable {
        case missing
        case readable
        case unreadable
    }

    func datasetRegistryIntegrityStatus(projectID: UUID) -> DatasetRegistryIntegrityStatus {
        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let registryURL = projectDirectory.appendingPathComponent("datasets.bide.json")

        guard manager.fileExists(atPath: registryURL.path) else { return .missing }
        guard let data = try? Data(contentsOf: registryURL) else { return .unreadable }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        guard (try? decoder.decode([DatasetAsset].self, from: data)) != nil else {
            return .unreadable
        }
        return .readable
    }

    @discardableResult
    func validateDatasetRegistryBeforeRecovery(projectID: UUID) -> Bool {
        guard activeProjectID == projectID else { return false }

        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let generationMarker = dataDirectory.appendingPathComponent(".bide-sqlite-generation")

        func invalidateDerivedSQLTrust() -> Bool {
            guard manager.fileExists(atPath: generationMarker.path) else { return true }
            do {
                try manager.removeItem(at: generationMarker)
                return true
            } catch {
                dataError = "bIDE could not invalidate local SQL after detecting an unsafe dataset registry state: \(error.localizedDescription)"
                return false
            }
        }

        switch datasetRegistryIntegrityStatus(projectID: projectID) {
        case .readable:
            return true

        case .unreadable:
            guard invalidateDerivedSQLTrust() else { return false }
            dataError = "bIDE could not read this project's dataset registry. Source files were left untouched, crash recovery was stopped, and local SQL was invalidated rather than guessing which datasets still belong to the project."
            return false

        case .missing:
            // A project imported from a folder may legitimately have no registry yet; normal
            // reconciliation can discover its source datasets. A SQL-only project can also
            // legitimately have no dataset registry while retaining user-created SQLite
            // tables, so missing registry by itself is not corruption.
            guard manager.fileExists(atPath: projectDirectory.path) else { return true }

            // A missing registry plus a crash-recovery artifact is different: without the
            // registry we cannot know whether deletion/save metadata committed before the
            // interruption. Preserve every file and invalidate derived SQL instead of
            // guessing which side of the transaction won.
            let recoveryPrefixes = [
                ".bide-delete-",
                Self.pendingSavedResultMarkerPrefix,
            ]

            guard let enumerator = manager.enumerator(
                at: projectDirectory,
                includingPropertiesForKeys: [.isRegularFileKey],
                options: [.skipsPackageDescendants]
            ) else {
                guard invalidateDerivedSQLTrust() else { return false }
                dataError = "bIDE could not inspect this project before dataset recovery. Source files were left untouched and local SQL was invalidated."
                return false
            }

            var hasRecoveryArtifact = false
            for case let url as URL in enumerator {
                guard (try? url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true else { continue }
                if recoveryPrefixes.contains(where: { url.lastPathComponent.hasPrefix($0) }) {
                    hasRecoveryArtifact = true
                    break
                }
            }

            if hasRecoveryArtifact {
                guard invalidateDerivedSQLTrust() else { return false }
                dataError = "bIDE found interrupted dataset recovery files but the dataset registry is missing. It preserved the files and invalidated local SQL instead of guessing whether the interrupted operation committed."
                return false
            }

            // Generation 4 is a rebuild requirement for databases derived from registered
            // source datasets. A missing registry means there is no authoritative dataset
            // source from which a user-created SQL-only database could be rebuilt. Once the
            // recovery-artifact checks above have proved that the missing registry is not an
            // interrupted transaction, preserve that SQLite file and advance only its trust
            // marker. Do not mutate the marker while a project operation owns SQL/data state.
            let databaseURL = dataDirectory.appendingPathComponent(".bide.sqlite")
            if manager.fileExists(atPath: databaseURL.path),
               !hasActiveDataOperation(projectID: projectID),
               !hasActiveSQLOperation(projectID: projectID) {
                do {
                    try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
                    try "4".write(to: generationMarker, atomically: true, encoding: .utf8)
                } catch {
                    dataError = "bIDE recognized a SQL-only project but could not preserve its local SQL generation marker: \(error.localizedDescription)"
                    return false
                }
            }

            return true
        }
    }
}
