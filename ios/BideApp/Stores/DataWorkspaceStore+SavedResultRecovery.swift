import Foundation

@MainActor
extension DataWorkspaceStore {
    static let pendingSavedResultMarkerPrefix = ".bide-pending-result-"
    static let savedResultFilePrefix = "bide_query_result_"

    func pendingSavedResultMarkerURL(projectID: UUID, token: String) -> URL {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
            .appendingPathComponent("data", isDirectory: true)
            .appendingPathComponent(Self.pendingSavedResultMarkerPrefix + token)
    }

    func beginSavedResultVerification(projectID: UUID, token: String) throws -> URL {
        guard token.count == 8,
              token.range(of: "^[a-f0-9]{8}$", options: .regularExpression) != nil else {
            throw CocoaError(.fileWriteInvalidFileName)
        }

        let markerURL = pendingSavedResultMarkerURL(projectID: projectID, token: token)
        try FileManager.default.createDirectory(
            at: markerURL.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        try "pending".write(to: markerURL, atomically: true, encoding: .utf8)
        return markerURL
    }

    func commitSavedResultVerification(markerURL: URL) throws {
        try "verified".write(to: markerURL, atomically: true, encoding: .utf8)
    }

    func clearSavedResultVerificationMarker(_ markerURL: URL) throws {
        let manager = FileManager.default
        if manager.fileExists(atPath: markerURL.path) {
            try manager.removeItem(at: markerURL)
        }
    }

    func savedResultFileName(_ fileName: String, matchesToken token: String) -> Bool {
        let base = Self.savedResultFilePrefix + token
        if fileName == base + ".csv" { return true }

        // uniqueDestination(...) resolves an exact filename collision as
        // `name 2.csv`, `name 3.csv`, etc. Match only that generated shape so recovery
        // can never sweep up a manually named `..._<token>_backup.csv` file.
        guard fileName.hasPrefix(base + " "), fileName.hasSuffix(".csv") else { return false }
        let suffixStart = fileName.index(fileName.startIndex, offsetBy: base.count + 1)
        let suffixEnd = fileName.index(fileName.endIndex, offsetBy: -4)
        guard suffixStart < suffixEnd else { return false }
        return Int(fileName[suffixStart..<suffixEnd]).map { $0 >= 2 } ?? false
    }

    @discardableResult
    func recoverInterruptedSavedResults(projectID: UUID) -> Bool {
        guard activeProjectID == projectID else { return false }
        guard !hasActiveDataOperation(projectID: projectID),
              !hasActiveSQLOperation(projectID: projectID) else {
            return false
        }

        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let projectDirectory = documents
            .appendingPathComponent("bIDE Projects", isDirectory: true)
            .appendingPathComponent(projectID.uuidString, isDirectory: true)
        let dataDirectory = projectDirectory.appendingPathComponent("data", isDirectory: true)
        let generationMarker = dataDirectory.appendingPathComponent(".bide-sqlite-generation")

        guard manager.fileExists(atPath: dataDirectory.path) else { return true }
        guard let entries = try? manager.contentsOfDirectory(
            at: dataDirectory,
            includingPropertiesForKeys: [.isRegularFileKey],
            options: []
        ) else {
            // If bIDE cannot inspect recovery metadata, do not continue trusting a derived
            // database whose saved-result transaction state cannot be proven.
            if manager.fileExists(atPath: generationMarker.path) {
                try? manager.removeItem(at: generationMarker)
            }
            dataError = "bIDE could not inspect this project for interrupted saved-result verification. The local SQL state was invalidated and will not be trusted until recovery succeeds."
            return false
        }

        let markers = entries.filter {
            $0.lastPathComponent.hasPrefix(Self.pendingSavedResultMarkerPrefix)
        }
        guard !markers.isEmpty else { return true }

        var pendingTokens: [String] = []
        var verifiedMarkers: [URL] = []
        var malformedMarkerName: String?

        for marker in markers {
            let name = marker.lastPathComponent
            let token = String(name.dropFirst(Self.pendingSavedResultMarkerPrefix.count))
            guard token.count == 8,
                  token.range(of: "^[a-f0-9]{8}$", options: .regularExpression) != nil else {
                malformedMarkerName = name
                continue
            }

            let state = (try? String(contentsOf: marker, encoding: .utf8))?
                .trimmingCharacters(in: .whitespacesAndNewlines)
            if state == "verified" {
                verifiedMarkers.append(marker)
            } else {
                // Unknown/unreadable state is treated as pending. Fail closed rather than
                // preserving a result whose verification commit cannot be proven.
                pendingTokens.append(token)
            }
        }

        let hasUntrustedRecoveryState = malformedMarkerName != nil || !pendingTokens.isEmpty
        if hasUntrustedRecoveryState {
            do {
                // A pending/unrecognized result may already have created SQLite tables.
                // Invalidate generation before registry/file cleanup so every later failure
                // path remains fail-closed for SQL reads.
                if manager.fileExists(atPath: generationMarker.path) {
                    try manager.removeItem(at: generationMarker)
                }
            } catch {
                dataError = "bIDE found an interrupted saved result but could not invalidate the local SQL state: \(error.localizedDescription)"
                return false
            }
        }

        if let malformedMarkerName {
            dataError = "bIDE found an unrecognized saved-result recovery marker (\(malformedMarkerName)) and stopped before changing project data. The local SQL state remains invalidated."
            return false
        }

        do {
            for marker in verifiedMarkers {
                try manager.removeItem(at: marker)
            }

            guard !pendingTokens.isEmpty else { return true }

            let registryURL = projectDirectory.appendingPathComponent("datasets.bide.json")
            var updatedAssets = datasets
            updatedAssets.removeAll { asset in
                pendingTokens.contains { token in
                    savedResultFileName(asset.fileName, matchesToken: token)
                }
            }

            // Commit the registry rollback before deleting files. If the app stops after
            // this atomic write, the still-present marker prevents reconciliation from
            // re-registering a pending result on the next launch.
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            encoder.dateEncodingStrategy = .iso8601
            try encoder.encode(updatedAssets).write(to: registryURL, options: .atomic)

            for token in pendingTokens {
                let matchingFiles = entries.filter { entry in
                    savedResultFileName(entry.lastPathComponent, matchesToken: token)
                }
                for file in matchingFiles where manager.fileExists(atPath: file.path) {
                    try manager.removeItem(at: file)
                }
            }

            for marker in markers where manager.fileExists(atPath: marker.path) {
                try manager.removeItem(at: marker)
            }

            openProject(projectID)
            return true
        } catch {
            // Pending markers stay in place whenever possible so another launch can retry.
            // Generation was invalidated before mutation, so partial cleanup can never leave
            // the old SQLite state eligible for SQL reads.
            openProject(projectID)
            dataError = "bIDE could not safely recover an interrupted saved-result verification: \(error.localizedDescription). The local SQL state remains invalidated."
            return false
        }
    }
}
