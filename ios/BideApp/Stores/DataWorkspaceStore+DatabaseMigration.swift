import Foundation

@MainActor
extension DataWorkspaceStore {
    private static let derivedDatabaseGeneration = "2"

    func migrateDerivedDatabaseIfNeeded(projectID: UUID) async {
        guard activeProjectID == projectID else { return }

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

        await rebuildDatabase(projectID: projectID)
        guard activeProjectID == projectID, dataError == nil else { return }

        do {
            try manager.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
            try Self.derivedDatabaseGeneration.write(to: markerURL, atomically: true, encoding: .utf8)
        } catch {
            dataError = "The SQL database was rebuilt, but bIDE could not finish its local migration marker: \(error.localizedDescription)"
        }
    }
}
